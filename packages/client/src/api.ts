import type {
  AuthRequest,
  AuthSession,
  AuthUser,
  GuestImportRequest,
  GuestImportResponse,
  PlayerWriteRequest,
  SimulationRequestBody,
} from './contracts';
import { ApiError } from './errors';
import type { Clock, HttpPort, StoragePort } from './ports';
import { createSessionStore, type SessionStore } from './session';
import type { Lineup, Player, Simulation, SimulationMode } from '@dream-court/core';

export interface ApiTransport {
  /** API 前缀，例如 `/api/v1`。为空时请求直接失败，由应用决定是否启用 API 模式。 */
  baseUrl: string;
  http: HttpPort;
  storage: StoragePort;
  clock: Clock;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

export type RequestSender = <T>(path: string, init?: RequestOptions) => Promise<T>;

/**
 * 统一处理 API base URL、JSON 请求头、会话注入和非 2xx 响应；
 * 底层传输由应用的 HttpPort 决定，协议逻辑在所有客户端保持一致。
 */
export function createRequestSender(transport: ApiTransport): RequestSender {
  const sessions = createSessionStore({ storage: transport.storage, clock: transport.clock });

  const request = async <T>(path: string, init?: RequestOptions): Promise<T> => {
    if (!transport.baseUrl) throw new Error('VITE_API_BASE_URL is not configured');
    const token = sessions.read()?.accessToken;
    const response = await transport.http.send({
      method: init?.method ?? 'GET',
      url: `${transport.baseUrl}${path}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(init?.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    });
    if (response.status < 200 || response.status >= 300) {
      if (response.status === 401) sessions.clear();
      let body: { message?: string; code?: string } | null = null;
      try {
        body = JSON.parse(response.bodyText) as { message?: string; code?: string };
      } catch {
        body = null;
      }
      throw new ApiError(
        body?.message ?? `API ${response.status}`,
        response.status,
        body?.code ?? null,
      );
    }
    if (response.status === 204) return undefined as T;
    return JSON.parse(response.bodyText) as T;
  };

  return request;
}

export interface ApiClient {
  readSession: SessionStore['read'];
  saveSession: SessionStore['save'];
  clearSession: SessionStore['clear'];
  register(credentials: AuthRequest): Promise<AuthSession>;
  login(credentials: AuthRequest): Promise<AuthSession>;
  currentUser(): Promise<AuthUser>;
  listPlayers(): Promise<Player[]>;
  createPlayer(player: PlayerWriteRequest): Promise<Player>;
  updatePlayer(id: string, player: PlayerWriteRequest): Promise<Player>;
  importGuestWorkspace(workspace: GuestImportRequest): Promise<GuestImportResponse>;
  listLineups(): Promise<Lineup[]>;
  saveLineup(lineup: Lineup): Promise<Lineup>;
  listSimulations(): Promise<Simulation[]>;
  simulate(
    homeLineupId: string,
    awayLineupId: string,
    simulationMode: SimulationMode,
    seed?: number,
  ): Promise<Simulation>;
}

export function createApiClient(transport: ApiTransport): ApiClient {
  const sessions = createSessionStore({ storage: transport.storage, clock: transport.clock });
  const request = createRequestSender(transport);

  return {
    readSession: sessions.read,
    saveSession: sessions.save,
    clearSession: sessions.clear,
    register: (credentials) =>
      request<AuthSession>('/auth/register', { method: 'POST', body: credentials }),
    login: (credentials) =>
      request<AuthSession>('/auth/login', { method: 'POST', body: credentials }),
    currentUser: () => request<AuthUser>('/auth/me'),
    // 这里的路径和请求体是前后端约定，具体表结构见数据库迁移文件。
    listPlayers: () => request<Player[]>('/players'),
    createPlayer: (player) => request<Player>('/players', { method: 'POST', body: player }),
    // 系统球员的 PUT 由服务端写入当前用户的覆盖档案；自定义球员则更新其自身记录。
    updatePlayer: (id, player) =>
      request<Player>(`/players/${id}`, { method: 'PUT', body: player }),
    importGuestWorkspace: (workspace) =>
      request<GuestImportResponse>('/guest-imports', { method: 'POST', body: workspace }),
    // 阵容 ID 是客户端稳定键；服务端用它将数据库 UUID 和本地存档关联起来。
    listLineups: () => request<Lineup[]>('/lineups'),
    saveLineup: (lineup) =>
      request<Lineup>(`/lineups/${lineup.id}`, { method: 'PUT', body: lineup }),
    // 服务端是云端比赛的权威计算方，并在同一事务中保存比分和球员统计。
    listSimulations: () => request<Simulation[]>('/simulations?limit=30'),
    simulate: (homeLineupId, awayLineupId, simulationMode, seed) =>
      request<Simulation>('/simulations', {
        method: 'POST',
        body: {
          homeLineupId,
          awayLineupId,
          ...(seed === undefined ? {} : { seed }),
          simulationMode,
        } satisfies SimulationRequestBody,
      }),
  };
}
