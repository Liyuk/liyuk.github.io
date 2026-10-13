import { createHash } from 'node:crypto';

export const CHAT_VECTOR_MODEL = '@cf/baai/bge-m3';
export const CHAT_VECTOR_MANIFEST_VERSION = 1;

export function hashChatVectorText(text) {
  return createHash('sha256').update(text).digest('hex');
}

export function planChatVectorSync(passages, previousManifest) {
  const current = new Map();
  for (const passage of passages) {
    if (!passage || typeof passage.id !== 'string' || typeof passage.text !== 'string') {
      throw new TypeError('Each passage needs a string id and text.');
    }
    if (current.has(passage.id)) throw new Error(`Duplicate chat vector id: ${passage.id}`);
    current.set(passage.id, { ...passage, contentHash: hashChatVectorText(passage.text) });
  }

  const storedPassages = previousManifest?.passages && typeof previousManifest.passages === 'object'
    ? previousManifest.passages
    : {};
  const canReuseHashes = previousManifest?.version === CHAT_VECTOR_MANIFEST_VERSION
    && previousManifest?.model === CHAT_VECTOR_MODEL;
  const previousPassages = canReuseHashes ? storedPassages : {};
  const upsert = [...current.values()].filter(
    ({ id, contentHash }) => previousPassages[id] !== contentHash,
  );
  const deleteIds = Object.keys(storedPassages).filter((id) => !current.has(id));
  const manifest = {
    version: CHAT_VECTOR_MANIFEST_VERSION,
    model: CHAT_VECTOR_MODEL,
    passages: Object.fromEntries(
      [...current.values()].map(({ id, contentHash }) => [id, contentHash]),
    ),
  };
  return { upsert, deleteIds, manifest };
}

export function serializeVectorizeNdjson(vectors) {
  return `${vectors.map((vector) => JSON.stringify(vector)).join('\n')}\n`;
}
