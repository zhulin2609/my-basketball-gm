import { describe, expect, it } from 'vitest';
import { players } from '@/data/players';
import type { Lineup } from '@/types';
import { simulate } from '@/lib/simulator';

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
    const result = simulate(home, away, players, 42);

    expect(result.homeScore).toBe(result.homeStats.reduce((sum, stat) => sum + stat.points, 0));
    expect(result.awayScore).toBe(result.awayStats.reduce((sum, stat) => sum + stat.points, 0));
  });
});
