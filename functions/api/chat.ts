import { handleChatRequest } from '../../src/lib/site-chat-api.mjs';

interface ChatEnvironment {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  AI?: { run(model: string, input: { text: string[] }): Promise<{ data: number[][] }> };
  VECTOR_INDEX?: {
    query(vector: number[], options: { topK: number; namespace: string; returnMetadata: 'all' }): Promise<{
      matches: Array<{ metadata?: { url?: string; passageIndex?: number }; score: number }>;
    }>;
  };
}

const cachedIndexes = new Map<string, { expiresAt: number; response: Response }>();

async function fetchForChat(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(input instanceof Request ? input.url : input.toString());
  if (!url.pathname.startsWith('/chat-index/') || !url.pathname.endsWith('.json') || init?.method) {
    return fetch(input, init);
  }

  const cachedIndex = cachedIndexes.get(url.pathname);
  if (cachedIndex && cachedIndex.expiresAt > Date.now()) return cachedIndex.response.clone();

  const response = await fetch(input, init);
  if (response.ok) {
    cachedIndexes.set(url.pathname, {
      expiresAt: Date.now() + 5 * 60_000,
      response: response.clone(),
    });
  }
  return response;
}

export const onRequest = ({ request, env }: { request: Request; env: ChatEnvironment }) =>
  handleChatRequest(request, env, fetchForChat);
