/**
 * 云端版本的 HTTP 适配层。
 * 未配置 API 地址时仍由 repository.ts 读写 localStorage；配置后业务数据走 REST 接口。
 */
import type {
  CommunityComment,
  CommunityPostDetail,
  CommunityPostSummary,
  Lineup,
  PagedResponse,
  Player,
  Simulation,
  SimulationMode,
} from '@/types';

const SESSION_STORAGE_KEY = 'dream-court.auth-session.v1';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
}

export interface AuthSession {
  accessToken: string;
  tokenType: 'Bearer';
  expiresAt: string;
  user: AuthUser;
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface LlmCredential {
  configured: boolean;
  baseUrl: string | null;
  model: string | null;
  apiKeyHint: string | null;
}

export interface LlmCredentialWrite {
  baseUrl: string;
  model: string;
  apiKey: string;
}

/**
 * 游客存档只由浏览器产生；提交时使用这一份明确的传输结构，避免把 localStorage
 * 的 schema 当作对服务端永久开放的接口。
 */
export interface GuestImportRequest {
  guestWorkspaceId: string;
  players: Array<{
    id: string;
    custom: boolean;
    player: PlayerWriteRequest;
  }>;
  lineups: Array<{
    id: string;
    lineup: Pick<Lineup, 'name' | 'description' | 'members'>;
  }>;
  simulations: Array<{
    id: string;
    homeLineupId: string;
    awayLineupId: string;
    homeLineupName: string;
    awayLineupName: string;
    seed: number;
    homeScore: number;
    awayScore: number;
    homeStats: GuestSimulationStat[];
    awayStats: GuestSimulationStat[];
    engineVersion: string;
    createdAt: string;
    expiresAt: string;
  }>;
}

export interface GuestSimulationStat {
  playerId: string;
  playerName: string;
  playerInitials: string;
  playerAccent: string;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  fgMade: number;
  fgAttempted: number;
  threeMade: number;
  threeAttempted: number;
}

export interface GuestImportResponse {
  guestWorkspaceId: string;
  alreadyImported: boolean;
  playerCount: number;
  lineupCount: number;
  simulationCount: number;
}

// ownerId 不出现在请求体中：Spring Security 从当前登录用户的 token 建立球员归属。
export type PlayerWriteRequest = Omit<Player, 'id' | 'isCustom'>;
const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

/** When unset, the product keeps the original offline demo storage behavior. */
export const isApiEnabled = Boolean(baseUrl);

function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    const expiresAt = Date.parse(session.expiresAt);
    const isUsable =
      session.tokenType === 'Bearer' &&
      typeof session.accessToken === 'string' &&
      Boolean(session.user?.id) &&
      Number.isFinite(expiresAt) &&
      expiresAt > Date.now();
    if (!isUsable) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

function saveSession(session: AuthSession) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

// 统一处理 API base URL、JSON 请求头和非 2xx 响应，避免每个 endpoint 重复同一套样板代码。
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!baseUrl) throw new Error('VITE_API_BASE_URL is not configured');
  const token = readSession()?.accessToken;
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    if (response.status === 401) clearSession();
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `API ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const api = {
  readSession,
  saveSession,
  clearSession,
  register: (credentials: AuthRequest) =>
    request<AuthSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  login: (credentials: AuthRequest) =>
    request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  currentUser: () => request<AuthUser>('/auth/me'),
  getLlmCredential: () => request<LlmCredential>('/llm-credentials'),
  saveLlmCredential: (credential: LlmCredentialWrite) =>
    request<LlmCredential>('/llm-credentials', {
      method: 'PUT',
      body: JSON.stringify(credential),
    }),
  deleteLlmCredential: async () => {
    await request<void>('/llm-credentials', { method: 'DELETE' });
  },
  // 这里的路径和请求体是前后端约定，具体表结构见 db/schema.sql。
  listPlayers: () => request<Player[]>('/players'),
  createPlayer: (player: PlayerWriteRequest) =>
    request<Player>('/players', { method: 'POST', body: JSON.stringify(player) }),
  // 系统球员的 PUT 由服务端写入当前用户的覆盖档案；自定义球员则更新其自身记录。
  updatePlayer: (id: string, player: PlayerWriteRequest) =>
    request<Player>(`/players/${id}`, { method: 'PUT', body: JSON.stringify(player) }),
  importGuestWorkspace: (workspace: GuestImportRequest) =>
    request<GuestImportResponse>('/guest-imports', {
      method: 'POST',
      body: JSON.stringify(workspace),
    }),
  // 阵容 ID 是浏览器稳定键；服务端用它将数据库 UUID 和旧 localStorage 存档关联起来。
  listLineups: () => request<Lineup[]>('/lineups'),
  saveLineup: (lineup: Lineup) =>
    request<Lineup>(`/lineups/${lineup.id}`, { method: 'PUT', body: JSON.stringify(lineup) }),
  // 服务端是云端比赛的权威计算方，并在同一事务中保存比分和球员统计。
  listSimulations: () => request<Simulation[]>('/simulations?limit=30'),
  simulate: (
    homeLineupId: string,
    awayLineupId: string,
    simulationMode: SimulationMode,
    seed?: number,
  ) =>
    request<Simulation>('/simulations', {
      method: 'POST',
      body: JSON.stringify({ homeLineupId, awayLineupId, seed, simulationMode }),
    }),
  // 社区接口：三个只读 GET 允许匿名调用，写操作由服务端校验登录态。
  listCommunityPosts: (page: number, pageSize: number) =>
    request<PagedResponse<CommunityPostSummary>>(`/forum/posts?page=${page}&pageSize=${pageSize}`),
  getCommunityPost: (id: string) => request<CommunityPostDetail>(`/forum/posts/${id}`),
  listCommunityComments: (postId: string, page: number, pageSize: number) =>
    request<PagedResponse<CommunityComment>>(
      `/forum/posts/${postId}/comments?page=${page}&pageSize=${pageSize}`,
    ),
  shareLineup: (lineupId: string) =>
    request<CommunityPostDetail>('/forum/posts', {
      method: 'POST',
      body: JSON.stringify({ lineupId }),
    }),
  withdrawCommunityPost: (id: string) => request<void>(`/forum/posts/${id}`, { method: 'DELETE' }),
  addCommunityComment: (postId: string, content: string, parentId: string | null) =>
    request<CommunityComment>(`/forum/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    }),
  deleteCommunityComment: (id: string) =>
    request<void>(`/forum/comments/${id}`, { method: 'DELETE' }),
  copyCommunityPost: (id: string) => request<Lineup>(`/forum/posts/${id}/copy`, { method: 'POST' }),
};
