export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';

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
