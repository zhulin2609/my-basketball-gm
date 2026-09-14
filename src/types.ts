export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C'

export type Ratings = {
  threePoint: number; twoPoint: number; rebounding: number; handling: number;
  passing: number; defense: number; defensiveIQ: number; offensiveIQ: number;
  speed: number; vertical: number; strength: number; freeThrow: number;
  steal: number; block: number; stamina: number; shotTendency: number
}

export type Player = Ratings & {
  id: string; name: string; initials: string; peakSeason: string; peakTeam: string;
  defaultPosition: Position; salaryUsd: number; archetype: string; bio: string; accent: string
}

export type LineupMember = { playerId: string; position: Position; starter: boolean; inactive: boolean }
export type Lineup = { id: string; name: string; description: string; members: LineupMember[]; createdAt: string; updatedAt: string }
export type PlayerStat = { playerId: string; minutes: number; points: number; rebounds: number; assists: number; steals: number; blocks: number; fgMade: number; fgAttempted: number; threeMade: number; threeAttempted: number }
export type Simulation = { id: string; homeLineupId: string; awayLineupId: string; seed: number; homeScore: number; awayScore: number; homeStats: PlayerStat[]; awayStats: PlayerStat[]; createdAt: string }
