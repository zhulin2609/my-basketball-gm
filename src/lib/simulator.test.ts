import { describe, expect, it } from 'vitest';
import { players } from '@/data/players';
import type { Lineup } from '@/types';
import { simulate } from '@/lib/simulator';

// 测试夹具只构造模拟所需的最小合规首发阵容，避免依赖浏览器 localStorage。
const createLineup = (id: string, playerIds: string[]): Lineup => ({
  id,
  name: id,
  description: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  members: playerIds.map((playerId, index) => ({
    playerId,
    position: ['PG', 'SG', 'SF', 'PF', 'C'][index] as Lineup['members'][number]['position'],
    starter: true,
    inactive: false,
  })),
});

const home = createLineup('home', ['curry', 'jordan', 'lebron', 'duncan', 'shaq']);
const away = createLineup('away', ['magic', 'kobe', 'bird', 'garnett', 'olajuwon']);

describe('simulate', () => {
  it('returns the same result for the same lineups and seed', () => {
    const first = simulate(home, away, players, 42);
    const second = simulate(home, away, players, 42);

    expect({
      homeScore: first.homeScore,
      awayScore: first.awayScore,
      homeStats: first.homeStats,
      awayStats: first.awayStats,
    }).toEqual({
      homeScore: second.homeScore,
      awayScore: second.awayScore,
      homeStats: second.homeStats,
      awayStats: second.awayStats,
    });
  });

  it('reports team scores that equal the individual player points', () => {
    const result = simulate(home, away, players, 7);

    expect(result.homeScore).toBe(result.homeStats.reduce((sum, stat) => sum + stat.points, 0));
    expect(result.awayScore).toBe(result.awayStats.reduce((sum, stat) => sum + stat.points, 0));
    expect([result.homeScore, result.awayScore]).toEqual([149, 156]);
  });

  it('normalizes each team to exactly 240 total minutes without overtime', () => {
    for (const seed of [42, 7, 1998]) {
      const result = simulate(home, away, players, seed);

      expect(result.homeStats.reduce((sum, stat) => sum + stat.minutes, 0)).toBe(240);
      expect(result.awayStats.reduce((sum, stat) => sum + stat.minutes, 0)).toBe(240);
    }
  });

  it('caps every player at 48 minutes without overtime', () => {
    for (const seed of [42, 7, 1998]) {
      const result = simulate(home, away, players, seed);

      [...result.homeStats, ...result.awayStats].forEach((stat) =>
        expect(stat.minutes).toBeLessThanOrEqual(48),
      );
    }
  });

  it('keeps the 240-minute total and positive minutes with a bench rotation', () => {
    const deepHome = createLineup('deep', [
      'curry',
      'jordan',
      'lebron',
      'duncan',
      'shaq',
      'kobe',
      'bird',
      'garnett',
      'olajuwon',
    ]);
    deepHome.members.forEach((member, index) => {
      member.starter = index < 5;
    });

    const result = simulate(deepHome, away, players, 42);

    expect(result.homeStats).toHaveLength(9);
    expect(result.homeStats.reduce((sum, stat) => sum + stat.minutes, 0)).toBe(240);
    result.homeStats.forEach((stat) => expect(stat.minutes).toBeGreaterThan(0));
  });
});
