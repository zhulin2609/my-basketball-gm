import { validateLineup } from './lineup-validation';
import type { Lineup, Player } from './types';

export type MatchupIssueCode =
  | 'missingLineup'
  | 'sameLineup'
  | 'memberCount'
  | 'activeCount'
  | 'duplicatePlayers'
  | 'starterFormation'
  | 'missingPlayer';

export interface MatchupIssue {
  code: MatchupIssueCode;
  side: 'home' | 'away';
  lineupName: string;
}

/** 界面与引擎共享参赛规则；core 仅返回领域信息，文案由应用翻译。 */
export function validateMatchup(
  home: Lineup | undefined,
  away: Lineup | undefined,
  players: Player[],
): MatchupIssue | null {
  if (!home) return { code: 'missingLineup', side: 'home', lineupName: '' };
  if (!away) return { code: 'missingLineup', side: 'away', lineupName: '' };
  if (home.id === away.id) {
    return { code: 'sameLineup', side: 'away', lineupName: away.name };
  }
  const playerIds = new Set(players.map((player) => player.id));
  for (const [side, lineup] of [
    ['home', home],
    ['away', away],
  ] as const) {
    const validation = validateLineup(lineup);
    let code: MatchupIssueCode | undefined;
    if (!validation.isEligibleForSimulation) {
      if (lineup.members.length < 5 || lineup.members.length > 15) code = 'memberCount';
      else if (validation.activeCount > 13) code = 'activeCount';
      else if (validation.hasDuplicatePlayers) code = 'duplicatePlayers';
      else code = 'starterFormation';
    } else if (lineup.members.some((member) => !playerIds.has(member.playerId))) {
      code = 'missingPlayer';
    }
    if (code) return { code, side, lineupName: lineup.name };
  }
  return null;
}

export class MatchupValidationError extends Error {
  readonly issue: MatchupIssue;

  constructor(issue: MatchupIssue) {
    super(`${issue.side}: ${issue.code} (${issue.lineupName})`);
    this.name = 'MatchupValidationError';
    this.issue = issue;
  }
}

export function assertValidMatchup(home: Lineup, away: Lineup, players: Player[]): void {
  const issue = validateMatchup(home, away, players);
  if (issue) throw new MatchupValidationError(issue);
}
