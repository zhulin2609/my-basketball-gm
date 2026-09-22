import { describe, expect, it } from 'vitest';
import { historicalCatalogCoverage, historicalPlayers } from '@/data/historical-players.generated';
import { players } from '@/data/players';
import historicalPlayerChineseNames from '@catalog/player-catalog-chinese-names.json';
import type { Ratings } from '@/types';

const ratingKeys = [
  'threePoint',
  'layup',
  'midRange',
  'insideScoring',
  'dunk',
  'offensiveRebound',
  'defensiveRebound',
  'handling',
  'passing',
  'defensiveIQ',
  'offensiveIQ',
  'speed',
  'agility',
  'vertical',
  'strength',
  'freeThrow',
  'steal',
  'block',
  'stamina',
  'shotTendency',
] satisfies (keyof Ratings)[];

const normalizeName = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

describe('historical player catalog', () => {
  it('contains every requested source player exactly once', () => {
    const playerNames = players.map((player) => normalizeName(player.name));
    const uniqueNames = new Set(playerNames);

    expect(uniqueNames.size).toBe(playerNames.length);
    expect(new Set(players.map((player) => player.id)).size).toBe(players.length);

    for (const names of Object.values(historicalCatalogCoverage.sourceNames)) {
      for (const name of names) {
        expect(uniqueNames.has(normalizeName(name)), `Missing ${name}`).toBe(true);
      }
    }
  });

  it('covers NBA 75 and every requested award season', () => {
    const annualSeasons = Array.from({ length: 49 }, (_, index) => 1978 + index);
    const allStarSeasons = annualSeasons.filter((season) => season !== 1999);

    expect(historicalCatalogCoverage.nba75Count).toBe(76);
    expect(historicalCatalogCoverage.allStarSeasons).toEqual(allStarSeasons);
    expect(historicalCatalogCoverage.allNbaSeasons).toEqual(annualSeasons);
    expect(historicalCatalogCoverage.allDefenseSeasons).toEqual(annualSeasons);
    expect(historicalCatalogCoverage.fmvpSeasons).toEqual(annualSeasons);
  });

  it('provides a Chinese name for every historical catalog player', () => {
    expect(Object.keys(historicalPlayerChineseNames)).toHaveLength(historicalPlayers.length);
    expect(
      players
        .filter((player) => historicalPlayers.some(({ id }) => id === player.id))
        .every((player) => Boolean(player.chineseName?.trim())),
    ).toBe(true);
  });

  it('keeps names, physical data and generated ratings valid', () => {
    for (const player of players) {
      expect(player.name).not.toMatch(/[\u3400-\u9fff]/);
      expect(player.name).not.toMatch(/[’‘]/);
      expect(player.peakSeason).toMatch(/^\d{4}–\d{2}$/);
      expect(player.heightFeet).toBeGreaterThanOrEqual(5);
      expect(player.heightInches).toBeGreaterThanOrEqual(0);
      expect(player.heightInches).toBeLessThan(12);
      expect(player.weightLbs).toBeGreaterThanOrEqual(130);

      for (const key of ratingKeys) {
        expect(Number.isInteger(player[key]), `${player.name}.${key}`).toBe(true);
        expect(player[key], `${player.name}.${key}`).toBeGreaterThanOrEqual(25);
        expect(player[key], `${player.name}.${key}`).toBeLessThanOrEqual(99);
      }
    }
  });
});
