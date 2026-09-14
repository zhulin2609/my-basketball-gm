/**
 * 云端版本的 HTTP 适配层。
 * 当前离线 MVP 仍由 repository.ts 读写 localStorage；接入后端时，将页面调用替换为本模块即可。
 */
import type { Lineup, Player, Simulation } from '@/types';
const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

// 统一处理 API base URL、JSON 请求头和非 2xx 响应，避免每个 endpoint 重复同一套样板代码。
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!baseUrl) throw new Error('VITE_API_BASE_URL is not configured');
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json() as Promise<T>;
}
export const api = {
  // 这里的路径和请求体是前后端约定，具体表结构见 db/schema.sql。
  listPlayers: () => request<Player[]>('/players'),
  listLineups: () => request<Lineup[]>('/lineups'),
  saveLineup: (lineup: Lineup) =>
    request<Lineup>(`/lineups/${lineup.id}`, { method: 'PUT', body: JSON.stringify(lineup) }),
  simulate: (homeLineupId: string, awayLineupId: string, seed?: number) =>
    request<Simulation>('/simulations', {
      method: 'POST',
      body: JSON.stringify({ homeLineupId, awayLineupId, seed }),
    }),
};
