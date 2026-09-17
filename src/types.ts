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
  /** 已公开到社区时的帖子 ID；未公开或未登录时不返回。 */
  sharedPostId?: string | null;
  /** 阻止公开的球员名字（自定义球员或被当前用户编辑过的公共球员）。 */
  shareBlockedPlayers?: string[];
}

export interface CommunityPostMember {
  playerId: string;
  position: Position;
  starter: boolean;
  inactive: boolean;
  player: Player;
}

export interface CommunityPostSummary {
  id: string;
  name: string;
  description: string;
  authorName: string;
  memberCount: number;
  commentCount: number;
  copyCount: number;
  mine: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPostDetail extends CommunityPostSummary {
  members: CommunityPostMember[];
}

export interface CommunityComment {
  id: string;
  authorName: string;
  content: string;
  parentId: string | null;
  parentAuthorName: string | null;
  mine: boolean;
  createdAt: string;
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
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
