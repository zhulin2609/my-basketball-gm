import type { Lineup, Position } from '@/types';

export const STARTER_POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

export interface LineupValidation {
  activeCount: number;
  starterCount: number;
  missingStarterPositions: Position[];
  isStarterFormationValid: boolean;
  isEligibleForSimulation: boolean;
}

// 统一首发和阵容人数规则，前端与未来服务端都应使用相同的判定方式。
export function validateLineup(lineup: Lineup): LineupValidation {
  const activeMembers = lineup.members.filter((member) => !member.inactive);
  const starters = activeMembers.filter((member) => member.starter);
  const missingStarterPositions = STARTER_POSITIONS.filter(
    (position) => !starters.some((starter) => starter.position === position),
  );
  const isStarterFormationValid =
    starters.length === STARTER_POSITIONS.length && missingStarterPositions.length === 0;

  return {
    activeCount: activeMembers.length,
    starterCount: starters.length,
    missingStarterPositions,
    isStarterFormationValid,
    isEligibleForSimulation:
      lineup.members.length >= 5 &&
      lineup.members.length <= 15 &&
      activeMembers.length <= 13 &&
      isStarterFormationValid,
  };
}
