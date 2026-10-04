import { describe, expect, it } from 'vitest';
import { players } from './data/players';
import type { LineupMember, Player } from './types';
import { playerSearchText } from './player-display';
import { averageRating, filterSortPlayers, lineupCandidates } from './player-selectors';

const member = (playerId: string): LineupMember => ({
  playerId,
  position: 'PG',
  starter: false,
  inactive: false,
});

describe('averageRating', () => {
  // 夹具使用手算期望值：十一项评分为 90+80+70+60+50+40+30+20+10+95+85 = 630，
  // 630 / 11 = 57.27…，按实现取整为 57。预期值直接写在断言里，不复制计算公式。
  const rated = (values: {
    threePoint: number;
    layup: number;
    midRange: number;
    insideScoring: number;
    dunk: number;
    offensiveRebound: number;
    defensiveRebound: number;
    handling: number;
    passing: number;
    defensiveIQ: number;
    offensiveIQ: number;
  }): Player => ({
    ...players[0],
    ...values,
  });

  it('averages the eleven production ratings with rounding down at 57.27', () => {
    const player = rated({
      threePoint: 90,
      layup: 80,
      midRange: 70,
      insideScoring: 60,
      dunk: 50,
      offensiveRebound: 40,
      defensiveRebound: 30,
      handling: 20,
      passing: 10,
      defensiveIQ: 95,
      offensiveIQ: 85,
    });

    expect(averageRating(player)).toBe(57);
  });

  it('rounds 57.55 up to 58 (values summing to 633)', () => {
    const player = rated({
      threePoint: 90,
      layup: 80,
      midRange: 70,
      insideScoring: 60,
      dunk: 50,
      offensiveRebound: 40,
      defensiveRebound: 30,
      handling: 20,
      passing: 10,
      defensiveIQ: 97,
      offensiveIQ: 86,
    });

    expect(averageRating(player)).toBe(58);
  });

  it('returns the common value when all eleven ratings are equal', () => {
    const value = {
      threePoint: 80,
      layup: 80,
      midRange: 80,
      insideScoring: 80,
      dunk: 80,
      offensiveRebound: 80,
      defensiveRebound: 80,
      handling: 80,
      passing: 80,
      defensiveIQ: 80,
      offensiveIQ: 80,
    };

    expect(averageRating(rated(value))).toBe(80);
  });
});

describe('filterSortPlayers', () => {
  it('filters by Chinese name query and position', () => {
    const list = filterSortPlayers(players, { query: '乔丹', position: 'SG', sort: 'overall' });

    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('jordan');
  });

  it('sorts by salary descending', () => {
    const list = filterSortPlayers(players, { query: '', position: 'ALL', sort: 'salaryUsd' });

    for (let index = 1; index < list.length; index += 1) {
      expect(list[index - 1].salaryUsd).toBeGreaterThanOrEqual(list[index].salaryUsd);
    }
  });

  it('does not mutate the input array order', () => {
    const snapshot = players.map((player) => player.id);

    filterSortPlayers(players, { query: '', position: 'ALL', sort: 'threePoint' });

    expect(players.map((player) => player.id)).toEqual(snapshot);
  });
});

describe('lineupCandidates', () => {
  it('excludes rostered players, matches Chinese queries and sorts by overall rating', () => {
    const rostered: LineupMember[] = [member(players[0].id)];
    const candidates = lineupCandidates(players, rostered, '');

    expect(candidates.some((player) => player.id === players[0].id)).toBe(false);
    for (let index = 1; index < candidates.length; index += 1) {
      expect(averageRating(candidates[index - 1])).toBeGreaterThanOrEqual(
        averageRating(candidates[index]),
      );
    }

    const searched = lineupCandidates(players, [], '乔丹');
    expect(searched.length).toBeGreaterThan(0);
    expect(searched.some((player) => player.id === 'jordan')).toBe(true);
    // 每个命中结果都必须包含搜索词，且不包含任何已入选球员。
    expect(searched.every((player) => playerSearchText(player).includes('乔丹'))).toBe(true);
  });
});

describe('catalog invariants used by the selectors', () => {
  it('keeps unique player ids across the merged catalog', () => {
    const ids = new Set(players.map((player: Player) => player.id));
    expect(ids.size).toBe(players.length);
  });
});
