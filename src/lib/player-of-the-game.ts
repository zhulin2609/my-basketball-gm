import type { PlayerStat, Simulation } from '@/types';

/** 本场最佳球员的评选结果：stat 为该球员本场统计，score 为表现分。 */
export interface PlayerOfTheGame {
  stat: PlayerStat;
  score: number;
  isWinner: boolean;
}

const POINTS_WEIGHT = 1.0;
const REBOUNDS_WEIGHT = 1.2;
const ASSISTS_WEIGHT = 1.5;
// 抢断与盖帽场均只有 0–2 个，权重不放大就会被得分淹没。
const STEALS_WEIGHT = 2.0;
const BLOCKS_WEIGHT = 2.0;
// 上场时间体现教练信任，首发 32 分钟约 +9.6 分，只作辅助因子。
const MINUTES_WEIGHT = 0.3;
// 胜方加成幅度有限：胜方刷子可以因此胜过数据接近的败方球员，但败方巨星仍可凭数据获奖。
const WINNER_BONUS = 3;

/**
 * 表现分公式：产量项（得分、篮板、助攻、抢断、盖帽、时间）加效率项与胜负加成。
 * 效率项 2 × 命中 − 出手 = 出手 × (2 × 命中率 − 1)，命中率不区分两分和三分；
 * 以出手数为乘数，命中率五成时等于命中数，高效多出手加分、低效多出手扣分。
 * 内部以十分之一分为单位做整数运算，整数在双精度浮点下精确，平票比较才能可靠。
 */
export function scorePlayerStat(stat: PlayerStat, isWinner: boolean): number {
  const productionTenths =
    stat.points * (POINTS_WEIGHT * 10) +
    stat.rebounds * (REBOUNDS_WEIGHT * 10) +
    stat.assists * (ASSISTS_WEIGHT * 10) +
    stat.steals * (STEALS_WEIGHT * 10) +
    stat.blocks * (BLOCKS_WEIGHT * 10) +
    stat.minutes * (MINUTES_WEIGHT * 10);
  const efficiencyTenths = (2 * stat.fgMade - stat.fgAttempted) * 10;
  const winnerTenths = isWinner ? WINNER_BONUS * 10 : 0;
  return (productionTenths + efficiencyTenths + winnerTenths) / 10;
}

/** 从一场战报中选出表现分最高的球员；平票依次比较得分、上场时间，再相同按球员 ID 保证确定性。 */
export function selectPlayerOfTheGame(game: Simulation): PlayerOfTheGame | null {
  const homeWon = game.homeScore > game.awayScore;
  const candidates: PlayerOfTheGame[] = [
    ...game.homeStats.map((stat) => ({ stat, score: 0, isWinner: homeWon })),
    ...game.awayStats.map((stat) => ({ stat, score: 0, isWinner: !homeWon })),
  ].map((entry) => ({ ...entry, score: scorePlayerStat(entry.stat, entry.isWinner) }));
  if (candidates.length === 0) return null;
  return candidates.reduce((best, candidate) => {
    if (candidate.score !== best.score) return candidate.score > best.score ? candidate : best;
    if (candidate.stat.points !== best.stat.points) {
      return candidate.stat.points > best.stat.points ? candidate : best;
    }
    if (candidate.stat.minutes !== best.stat.minutes) {
      return candidate.stat.minutes > best.stat.minutes ? candidate : best;
    }
    return candidate.stat.playerId < best.stat.playerId ? candidate : best;
  });
}
