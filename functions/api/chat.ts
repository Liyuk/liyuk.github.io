import { handleChatRequest } from '../../src/lib/site-chat-api.mjs';

interface ChatEnvironment {
  ASSETS: { fetch(request: Request): Promise<Response> };
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

export const onRequest = ({ request, env }: { request: Request; env: ChatEnvironment }) =>
  handleChatRequest(request, env, fetch);
