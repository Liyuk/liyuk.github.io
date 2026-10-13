import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
const indexName = process.env.CHAT_VECTOR_INDEX ?? 'liyuk-bge-m3-eval-20261013';
if (!accountId || !token) throw new Error('Cloudflare credentials are required to sync chat vectors.');

const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
const passages = [];
for (const locale of ['zh-CN', 'en']) {
  const index = JSON.parse(await readFile(`dist/chat-index/${locale}.json`, 'utf8'));
  for (const doc of index.documents) for (const [passageIndex, excerpt] of doc.excerpts.entries()) {
    passages.push({ id: createHash('sha256').update(`${doc.url}:${passageIndex}`).digest('hex').slice(0, 32), locale, title: doc.title, url: doc.url, passageIndex, text: `title: ${doc.title} | text: ${excerpt}` });
  }
}

for (let start = 0; start < passages.length; start += 24) {
  const batch = passages.slice(start, start + 24);
  const embedded = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/baai/bge-m3`, { method: 'POST', headers, body: JSON.stringify({ text: batch.map((item) => item.text) }) });
  if (!embedded.ok) throw new Error(`Workers AI embedding failed: HTTP ${embedded.status}`);
  const result = await embedded.json();
  const vectors = result.result?.data;
  if (!Array.isArray(vectors) || vectors.length !== batch.length || vectors.some((vector) => vector.length !== 1024)) throw new Error('Workers AI returned an unexpected embedding shape.');
  for (const locale of ['zh-CN', 'en']) {
    const selected = batch.map((item, i) => ({ item, values: vectors[i] })).filter(({ item }) => item.locale === locale);
    if (!selected.length) continue;
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v2/indexes/${indexName}/upsert`, { method: 'POST', headers, body: JSON.stringify({ vectors: selected.map(({ item, values }) => ({ id: item.id, values, namespace: locale, metadata: { url: item.url, title: item.title, passageIndex: item.passageIndex } })) }) });
    if (!response.ok) throw new Error(`Vectorize upsert failed: HTTP ${response.status}`);
  }
  console.log(`Embedded and upserted ${Math.min(start + batch.length, passages.length)}/${passages.length} passages.`);
}
