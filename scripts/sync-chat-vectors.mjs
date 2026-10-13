import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { planChatVectorSync, serializeVectorizeNdjson } from '../src/lib/chat-vector-sync.mjs';

const API_BASE = 'https://api.cloudflare.com/client/v4';
const MODEL = '@cf/baai/bge-m3';
const EMBEDDING_BATCH_SIZE = 24;
const DELETE_BATCH_SIZE = 100;
const POLL_INTERVAL_MS = 1_000;
const POLL_TIMEOUT_MS = 90_000;

const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

function passageId(url, passageIndex) {
  return createHash('sha256').update(`${url}:${passageIndex}`).digest('hex').slice(0, 32);
}

async function cloudflareRequest(url, init, label) {
  const response = await fetch(url, init);
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`${label} returned an invalid JSON response (HTTP ${response.status}).`);
  }
  if (!response.ok || payload?.success !== true) {
    const detail = payload?.errors?.map(({ message }) => message).filter(Boolean).join('; ');
    throw new Error(`${label} failed (HTTP ${response.status})${detail ? `: ${detail}` : '.'}`);
  }
  return payload.result;
}

async function getExistingVectorIds({ accountId, token, indexName }) {
  const ids = new Set();
  let cursor;
  do {
    const url = new URL(`${API_BASE}/accounts/${accountId}/vectorize/v2/indexes/${indexName}/list`);
    url.searchParams.set('count', '1000');
    if (cursor) url.searchParams.set('cursor', cursor);
    const result = await cloudflareRequest(url, {
      headers: { authorization: `Bearer ${token}` },
    }, 'Vectorize list');
    for (const vector of result.vectors ?? []) ids.add(vector.id);
    cursor = result.nextCursor;
  } while (cursor);
  return ids;
}

async function deleteVectors(ids, { accountId, token, indexName }) {
  const mutationIds = [];
  for (let start = 0; start < ids.length; start += DELETE_BATCH_SIZE) {
    const url = `${API_BASE}/accounts/${accountId}/vectorize/v2/indexes/${indexName}/delete_by_ids`;
    const result = await cloudflareRequest(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ids: ids.slice(start, start + DELETE_BATCH_SIZE) }),
    }, 'Vectorize delete');
    if (!result.mutationId) throw new Error('Vectorize delete did not return a mutation id.');
    mutationIds.push(result.mutationId);
  }
  return mutationIds;
}

async function embedPassages(passages, { accountId, token }) {
  const output = [];
  for (let start = 0; start < passages.length; start += EMBEDDING_BATCH_SIZE) {
    const batch = passages.slice(start, start + EMBEDDING_BATCH_SIZE);
    const result = await cloudflareRequest(`${API_BASE}/accounts/${accountId}/ai/run/${MODEL}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ text: batch.map(({ text }) => text) }),
    }, 'Workers AI embedding');
    const vectors = result?.data;
    if (!Array.isArray(vectors) || vectors.length !== batch.length || vectors.some((vector) => !Array.isArray(vector) || vector.length !== 1_024)) {
      throw new Error('Workers AI returned an unexpected BGE-M3 embedding shape.');
    }
    output.push(...batch.map((passage, index) => ({ passage, values: vectors[index] })));
    console.log(`Embedded ${Math.min(start + batch.length, passages.length)}/${passages.length} changed passages.`);
  }
  return output;
}

async function upsertVectors(records, { accountId, token, indexName }) {
  if (records.length === 0) return [];
  const mutationIds = [];
  for (const locale of ['zh-CN', 'en']) {
    const vectors = records
      .filter(({ passage }) => passage.locale === locale)
      .map(({ passage, values }) => ({
        id: passage.id,
        values,
        namespace: locale,
        metadata: {
          url: passage.url,
          title: passage.title,
          passageIndex: passage.passageIndex,
          contentHash: passage.contentHash,
        },
      }));
    if (vectors.length === 0) continue;
    const body = new FormData();
    body.append(
      'body',
      new Blob([serializeVectorizeNdjson(vectors)], { type: 'application/x-ndjson' }),
      'vectors.ndjson',
    );
    const result = await cloudflareRequest(`${API_BASE}/accounts/${accountId}/vectorize/v2/indexes/${indexName}/upsert`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
      body,
    }, 'Vectorize upsert');
    if (!result.mutationId) throw new Error('Vectorize upsert did not return a mutation id.');
    mutationIds.push(result.mutationId);
  }
  return mutationIds;
}

async function waitForMutations(mutationIds, { accountId, token, indexName }) {
  if (mutationIds.length === 0) return;
  const url = `${API_BASE}/accounts/${accountId}/vectorize/v2/indexes/${indexName}/info`;
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  const targetMutation = mutationIds.at(-1);
  while (Date.now() < deadline) {
    const info = await cloudflareRequest(url, {
      headers: { authorization: `Bearer ${token}` },
    }, 'Vectorize index info');
    if (info.processedUpToMutation === targetMutation) return;
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`Vectorize did not finish mutation ${targetMutation} within ${POLL_TIMEOUT_MS / 1_000} seconds.`);
}

async function readPreviousManifest(manifestPath) {
  try {
    return JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

async function readPublishedPassages() {
  const passages = [];
  for (const locale of ['zh-CN', 'en']) {
    const index = JSON.parse(await readFile(`dist/chat-index/${locale}.json`, 'utf8'));
    for (const document of index.documents) {
      for (const [passageIndex, excerpt] of document.excerpts.entries()) {
        passages.push({
          id: passageId(document.url, passageIndex),
          locale,
          title: document.title,
          url: document.url,
          passageIndex,
          text: `title: ${document.title} | text: ${excerpt}`,
        });
      }
    }
  }
  return passages;
}

export async function syncChatVectors({
  accountId = process.env.CLOUDFLARE_ACCOUNT_ID,
  token = process.env.CLOUDFLARE_API_TOKEN,
  indexName = process.env.CHAT_VECTOR_INDEX,
  manifestPath = '.cache/chat-vectors/manifest.json',
} = {}) {
  if (!accountId || !token) throw new Error('Cloudflare credentials are required to sync chat vectors.');
  const config = JSON.parse(await readFile('wrangler.jsonc', 'utf8'));
  const configuredIndex = config.vectorize?.find(({ binding }) => binding === 'VECTOR_INDEX')?.index_name;
  if (!configuredIndex) throw new Error('wrangler.jsonc must define the VECTOR_INDEX binding.');
  indexName ??= configuredIndex;
  if (indexName !== configuredIndex) {
    throw new Error(`CHAT_VECTOR_INDEX (${indexName}) must match the VECTOR_INDEX binding in wrangler.jsonc (${configuredIndex}).`);
  }

  const passages = await readPublishedPassages();
  const previous = await readPreviousManifest(manifestPath);
  const previousForIndex = previous?.indexName === indexName ? previous : undefined;
  const plan = planChatVectorSync(passages, previousForIndex);
  const currentIds = new Set(passages.map(({ id }) => id));
  const staleIds = [...plan.deleteIds];
  if (!previousForIndex) {
    const existingIds = await getExistingVectorIds({ accountId, token, indexName });
    staleIds.push(...[...existingIds].filter((id) => !currentIds.has(id)));
  }

  const credentials = { accountId, token, indexName };
  const embedded = await embedPassages(plan.upsert, { accountId, token });
  const mutations = [
    ...await upsertVectors(embedded, credentials),
    ...await deleteVectors([...new Set(staleIds)], credentials),
  ];
  await waitForMutations(mutations, credentials);

  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify({ ...plan.manifest, indexName }, null, 2)}\n`);
  console.log(`Vectorize sync complete: ${plan.upsert.length} embedded, ${new Set(staleIds).size} deleted, ${passages.length} current passages.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await syncChatVectors();
}
