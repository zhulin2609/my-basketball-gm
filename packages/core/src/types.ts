export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';
export type SimulationMode = 'local' | 'ai';

export interface Ratings {
  threePoint: number;
  layup: number;
  midRange: number;
  insideScoring: number;
  dunk: number;
  offensiveRebound: number;
  defensiveRebound: number;
  handling: number;
  passing: number;
  defensiveIQ: number;
  offensiveIQ: number;
  speed: number;
  agility: number;
  vertical: number;
  strength: number;
  freeThrow: number;
  steal: number;
  block: number;
  stamina: number;
  shotTendency: number;
}

export interface Player extends Ratings {
  id: string;
  name: string;
  /** 中文界面显示与中文搜索使用；自定义球员可以不填写。 */
  chineseName?: string;
  initials: string;
  peakSeason: string;
  peakTeam: string;
  defaultPosition: Position;
  heightFeet: number;
  heightInches: number;
  weightLbs: number;
  salaryUsd: number;
  archetype: string;
  bio: string;
  accent: string;
  /** 自定义球员或对默认档案的本地覆盖；服务端以当前登录用户判定归属。 */
  isCustom?: boolean;
}

export interface LineupMember {
  playerId: string;
  position: Position;
  starter: boolean;
  inactive: boolean;
}

export interface Lineup {
  id: string;
  name: string;
  description: string;
  members: LineupMember[];
  createdAt: string;
  updatedAt: string;
  /** 已有 API 的扩展字段：Web 社区在阵容已公开时返回帖子 ID；其他客户端按可空读取。 */
  sharedPostId?: string | null;
  /** 已有 API 的扩展字段：阻止 Web 社区公开的球员名字。 */
  shareBlockedPlayers?: string[];
}

export interface PlayerStat {
  playerId: string;
  /** Cloud reports snapshot display fields so later player edits do not rewrite history. */
  playerName?: string;
  playerInitials?: string;
  playerAccent?: string;
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

export interface Simulation {
  id: string;
  homeLineupId: string;
  awayLineupId: string;
  homeLineupName?: string;
  awayLineupName?: string;
  seed: number;
  homeScore: number;
  awayScore: number;
  homeStats: PlayerStat[];
  awayStats: PlayerStat[];
  engineVersion?: string;
  createdAt: string;
  expiresAt: string;
}
