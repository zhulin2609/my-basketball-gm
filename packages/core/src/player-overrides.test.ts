import { describe, expect, it } from 'vitest';
import type { Player } from './types';
import { mergePlayerCatalog } from './player-overrides';

const basePlayer: Player = {
  id: 'catalog-player',
  name: 'Catalog Player',
  initials: 'CP',
  peakSeason: '2020–21',
  peakTeam: 'Catalog',
  defaultPosition: 'SF',
  heightFeet: 6,
  heightInches: 7,
  weightLbs: 220,
  salaryUsd: 0,
  archetype: 'Two-way forward',
  bio: 'Seed entry',
  accent: '#c3ec8b',
  threePoint: 60,
  layup: 60,
  midRange: 60,
  insideScoring: 60,
  dunk: 60,
  offensiveRebound: 60,
  defensiveRebound: 60,
  handling: 60,
  passing: 60,
  defensiveIQ: 60,
  offensiveIQ: 60,
  speed: 60,
  agility: 60,
  vertical: 60,
  strength: 60,
  freeThrow: 60,
  steal: 60,
  block: 60,
  stamina: 60,
  shotTendency: 60,
};

describe('mergePlayerCatalog', () => {
  it('applies user overrides to seed entries without mutating the inputs', () => {
    const seed = [{ ...basePlayer }];
    const override = { ...basePlayer, threePoint: 99 };
    const saved = [override];

    const merged = mergePlayerCatalog(seed, saved);

    expect(merged[0].threePoint).toBe(99);
    expect(seed[0].threePoint).toBe(60);
    expect(merged).not.toBe(seed);
  });

  it('appends custom players after the catalog and keeps unknown saved entries', () => {
    const seed = [{ ...basePlayer }];
    const custom = { ...basePlayer, id: 'custom-1', isCustom: true };
    const stale = { ...basePlayer, id: 'removed-from-catalog' };

    const merged = mergePlayerCatalog(seed, [stale, custom]);

    expect(merged.map((player) => player.id)).toEqual([
      'catalog-player',
      'removed-from-catalog',
      'custom-1',
    ]);
  });
});
