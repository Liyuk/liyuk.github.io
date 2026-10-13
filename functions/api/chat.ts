import { handleChatRequest } from '../../src/lib/site-chat-api.mjs';

interface ChatEnvironment {
  ASSETS: { fetch(request: Request): Promise<Response> };
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  AI?: { run(model: string, input: { text: string[] }): Promise<{ data: number[][] }> };
  VECTOR_INDEX?: {
    query(
      vector: number[],
      options: { topK: number; namespace: string; returnMetadata: 'all' },
    ): Promise<{
      matches: Array<{ metadata?: { url?: string; passageIndex?: number }; score: number }>;
    }>;
  };
}

export const onRequest = ({ request, env }: { request: Request; env: ChatEnvironment }) =>
  handleChatRequest(request, env, fetch);
