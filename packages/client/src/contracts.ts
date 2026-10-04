import type { Lineup, Player, Simulation, SimulationMode } from '@dream-court/core';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  admin: boolean;
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

/**
 * 游客存档只由客户端产生；提交时使用这一份明确的传输结构，避免把本地
 * 存储 schema 当作对服务端永久开放的接口。
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

export interface SimulationRequestBody {
  homeLineupId: string;
  awayLineupId: string;
  seed?: number;
  simulationMode: SimulationMode;
}
