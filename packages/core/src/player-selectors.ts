import type { LineupMember, Player, Position } from './types';
import { playerSearchText } from './player-display';

/** 排序键：综合评分、三分能力或薪资。 */
export type PlayerSortKey = 'overall' | 'threePoint' | 'salaryUsd';

// V1 的综合能力仅用于列表排序和展示，不参与比赛引擎的具体计算。
export function averageRating(player: Player): number {
  return Math.round(
    (player.threePoint +
      player.layup +
      player.midRange +
      player.insideScoring +
      player.dunk +
      player.offensiveRebound +
      player.defensiveRebound +
      player.handling +
      player.passing +
      player.defensiveIQ +
      player.offensiveIQ) /
      11,
  );
}

/** 球员库列表的过滤与排序：综合评分、三分能力或薪资降序。 */
export function filterSortPlayers(
  players: Player[],
  options: { query: string; position: Position | 'ALL'; sort: PlayerSortKey },
): Player[] {
  return players
    .filter(
      (player) =>
        (!options.query || playerSearchText(player).includes(options.query.toLocaleLowerCase())) &&
        (options.position === 'ALL' || player.defaultPosition === options.position),
    )
    .sort((left, right) =>
      options.sort === 'overall'
        ? averageRating(right) - averageRating(left)
        : right[options.sort] - left[options.sort],
    );
}

/** 阵容候选列表：排除已入选球员，按综合评分降序，支持搜索。 */
export function lineupCandidates(
  players: Player[],
  members: LineupMember[],
  query: string,
): Player[] {
  return players
    .filter(
      (player) =>
        !members.some((member) => member.playerId === player.id) &&
        playerSearchText(player).includes(query.toLocaleLowerCase()),
    )
    .sort((left, right) => averageRating(right) - averageRating(left));
}
