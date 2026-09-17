import { describe, expect, it } from 'vitest';
import { players } from '@/data/players';
import type { PlayerStat, Simulation } from '@/types';
import { scorePlayerStat, selectPlayerOfTheGame } from '@/lib/player-of-the-game';
import { simulate } from '@/lib/simulator';

// 手工构造统计行，未列字段补 0，方便精确控制公式输入。
const stat = (overrides: Partial<PlayerStat>): PlayerStat => ({
  playerId: 'p1',
  minutes: 30,
  points: 20,
  rebounds: 5,
  assists: 5,
  steals: 1,
  blocks: 1,
  fgMade: 8,
  fgAttempted: 16,
  threeMade: 2,
  threeAttempted: 6,
  ...overrides,
});

const game = (homeStats: PlayerStat[], awayStats: PlayerStat[], homeWon = true): Simulation => ({
  id: 'g1',
  homeLineupId: 'home',
  awayLineupId: 'away',
  seed: 1,
  homeScore: homeWon ? 110 : 100,
  awayScore: homeWon ? 100 : 110,
  homeStats,
  awayStats,
  createdAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-02-01T00:00:00.000Z',
});

describe('scorePlayerStat', () => {
  it('weights production, efficiency, and winning', () => {
    // 20×1 + 5×1.2 + 5×1.5 + 1×2 + 1×2 + 30×0.3 + (2×8−16) + 3
    expect(scorePlayerStat(stat({}), true)).toBeCloseTo(49.5, 5);
    expect(scorePlayerStat(stat({}), false)).toBeCloseTo(46.5, 5);
  });

  it('rewards efficient volume and punishes inefficient volume', () => {
    const efficient = stat({ points: 24, fgMade: 10, fgAttempted: 14 });
    const inefficient = stat({ points: 24, fgMade: 10, fgAttempted: 26 });

    expect(scorePlayerStat(efficient, false)).toBeGreaterThan(scorePlayerStat(inefficient, false));
  });

  it('prevents tiny samples from winning the efficiency term', () => {
    // 1 投 1 中的命中率是 100%，但产量极低，分数必须远低于稳定输出的首发。
    const oneShot = stat({
      minutes: 10,
      points: 2,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      fgMade: 1,
      fgAttempted: 1,
    });

    expect(scorePlayerStat(stat({}), false)).toBeGreaterThan(scorePlayerStat(oneShot, true));
  });
});

describe('selectPlayerOfTheGame', () => {
  it('picks the highest scorer across both teams', () => {
    const star = stat({ playerId: 'star', points: 34, fgMade: 13, fgAttempted: 20 });
    const result = selectPlayerOfTheGame(game([stat({ playerId: 'a' })], [star]));

    expect(result?.stat.playerId).toBe('star');
    expect(result?.isWinner).toBe(false);
  });

  it('lets the winner bonus tip close contests', () => {
    // 两人产量接近时，胜方 +3 决定归属。
    const winnerSide = stat({ playerId: 'w', points: 20 });
    const loserSide = stat({ playerId: 'l', points: 21, fgMade: 8, fgAttempted: 17 });
    const result = selectPlayerOfTheGame(game([winnerSide], [loserSide]));

    expect(result?.stat.playerId).toBe('w');
    expect(result?.isWinner).toBe(true);
  });

  it('breaks exact ties by points, then minutes, then player id', () => {
    // 平票决胜链只在胜方加成相同时才走到，因此每组都把两人放在同一队。
    // 精确平票（分数同为 46.5）且得分不同：得分高者获奖。
    const morePoints = stat({ playerId: 'b', points: 23, fgMade: 8, fgAttempted: 19 });
    const moreMinutes = stat({
      playerId: 'a',
      points: 17,
      minutes: 40,
      fgMade: 8,
      fgAttempted: 16,
    });
    expect(scorePlayerStat(morePoints, false)).toBeCloseTo(scorePlayerStat(moreMinutes, false), 5);
    expect(selectPlayerOfTheGame(game([], [moreMinutes, morePoints]))?.stat.playerId).toBe('b');

    // 精确平票且得分相同（同为 20 分、分数同为 43.0）：上场时间长者获奖。
    const longerMinutes = stat({
      playerId: 'b',
      rebounds: 4,
      assists: 4,
      steals: 0,
      blocks: 0,
      minutes: 34,
      fgMade: 9,
      fgAttempted: 16,
    });
    const shorterMinutes = stat({
      playerId: 'a',
      rebounds: 5,
      assists: 4,
      steals: 0,
      blocks: 0,
      minutes: 30,
      fgMade: 9,
      fgAttempted: 16,
    });
    expect(scorePlayerStat(longerMinutes, false)).toBeCloseTo(
      scorePlayerStat(shorterMinutes, false),
      5,
    );
    expect(selectPlayerOfTheGame(game([], [shorterMinutes, longerMinutes]))?.stat.playerId).toBe(
      'b',
    );

    // 完全相同的两行统计：按球员 ID 字典序保证结果确定。
    const tied = selectPlayerOfTheGame(
      game([], [stat({ playerId: 'b' }), stat({ playerId: 'a' })]),
    );
    expect(tied?.stat.playerId).toBe('a');
  });

  it('returns null when the report has no stats', () => {
    expect(selectPlayerOfTheGame(game([], []))).toBeNull();
  });

  it('selects the argmax on engine-generated reports', () => {
    const lineup = (id: string, ids: string[]) => ({
      id,
      name: id,
      description: '',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      members: ids.map((playerId, index) => ({
        playerId,
        position: ['PG', 'SG', 'SF', 'PF', 'C'][index] as 'PG',
        starter: true,
        inactive: false,
      })),
    });
    const report = simulate(
      lineup('home', ['curry', 'jordan', 'lebron', 'duncan', 'shaq']),
      lineup('away', ['magic', 'kobe', 'bird', 'garnett', 'olajuwon']),
      players,
      42,
    );
    const best = selectPlayerOfTheGame(report);

    expect(best).not.toBeNull();
    const homeWon = report.homeScore > report.awayScore;
    for (const other of [...report.homeStats, ...report.awayStats]) {
      if (other.playerId === best!.stat.playerId) continue;
      const otherWon = report.homeStats.some((s) => s.playerId === other.playerId)
        ? homeWon
        : !homeWon;
      expect(best!.score).toBeGreaterThanOrEqual(scorePlayerStat(other, otherWon));
    }
    expect(best!.isWinner).toBe(
      report.homeStats.some((s) => s.playerId === best!.stat.playerId) ? homeWon : !homeWon,
    );
  });
});
