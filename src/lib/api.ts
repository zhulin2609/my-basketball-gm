/**
 * 云端版本的 HTTP 适配层。
 * 当前离线 MVP 仍由 repository.ts 读写 localStorage；接入后端时，将页面调用替换为本模块即可。
 */
import type { Lineup, Player, Simulation } from '@/types';

// ownerId 不出现在请求体中：Spring Security 从当前登录用户的 token 建立球员归属。
export type PlayerWriteRequest = Omit<Player, 'id' | 'isCustom'>;
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
  createPlayer: (player: PlayerWriteRequest) =>
    request<Player>('/players', { method: 'POST', body: JSON.stringify(player) }),
  // 系统球员的 PUT 由服务端写入当前用户的覆盖档案；自定义球员则更新其自身记录。
  updatePlayer: (id: string, player: PlayerWriteRequest) =>
    request<Player>(`/players/${id}`, { method: 'PUT', body: JSON.stringify(player) }),
  listLineups: () => request<Lineup[]>('/lineups'),
  saveLineup: (lineup: Lineup) =>
    request<Lineup>(`/lineups/${lineup.id}`, { method: 'PUT', body: JSON.stringify(lineup) }),
  simulate: (homeLineupId: string, awayLineupId: string, seed?: number) =>
    request<Simulation>('/simulations', {
      method: 'POST',
      body: JSON.stringify({ homeLineupId, awayLineupId, seed }),
    }),
};
