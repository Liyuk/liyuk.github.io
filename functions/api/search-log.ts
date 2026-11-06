import { handleSearchLog } from '../../src/lib/search-log.mjs';

interface SearchLogEnvironment {
  SEARCH_LOG?: { writeDataPoint(point: { indexes: string[]; blobs: string[]; doubles: number[] }): void };
}

export const onRequest = ({ request, env }: { request: Request; env: SearchLogEnvironment }) =>
  handleSearchLog(request, env);
