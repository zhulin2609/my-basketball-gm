import type { Lineup, Position } from './types';

export const STARTER_POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

export interface LineupValidation {
  activeCount: number;
  starterCount: number;
  missingStarterPositions: Position[];
  hasDuplicatePlayers: boolean;
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
  // 同一球员不得重复加入：Web 界面在候选列表中排除已入选者，这里提供不依赖界面的兜底校验。
  const hasDuplicatePlayers =
    new Set(lineup.members.map((member) => member.playerId)).size !== lineup.members.length;

  return {
    activeCount: activeMembers.length,
    starterCount: starters.length,
    missingStarterPositions,
    hasDuplicatePlayers,
    isStarterFormationValid,
    isEligibleForSimulation:
      lineup.members.length >= 5 &&
      lineup.members.length <= 15 &&
      activeMembers.length <= 13 &&
      isStarterFormationValid &&
      !hasDuplicatePlayers,
  };
}
