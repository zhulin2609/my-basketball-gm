import type { TFunction } from 'i18next';
import type { MatchupIssue } from '@dream-court/core';

export function matchupErrorMessage(t: TFunction, issue: MatchupIssue): string {
  const reason = t(`battle.validation.${issue.code}`);
  if (issue.code === 'sameLineup') return reason;
  const side = t(`battle.${issue.side}`);
  return issue.code === 'missingLineup'
    ? t('battle.validation.selection', { side, reason })
    : t('battle.validation.lineup', { side, name: issue.lineupName, reason });
}
