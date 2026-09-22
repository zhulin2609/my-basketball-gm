import { describe, expect, it } from 'vitest';
import { displayPlayerName, playerSearchText } from '@/lib/player-display';
import type { Player } from '@/types';

const player: Player = {
  id: 'jordan',
  name: 'Michael Jordan',
  chineseName: '迈克尔·乔丹',
  initials: 'MJ',
  peakSeason: '1990–91',
  peakTeam: 'Chicago',
  defaultPosition: 'SG',
  heightFeet: 6,
  heightInches: 6,
  weightLbs: 198,
  salaryUsd: 0,
  archetype: 'Two-way scorer',
  bio: 'Test player',
  accent: '#f6a623',
  threePoint: 82,
  layup: 99,
  midRange: 94,
  insideScoring: 88,
  dunk: 98,
  offensiveRebound: 70,
  defensiveRebound: 74,
  handling: 96,
  passing: 87,
  defensiveIQ: 96,
  offensiveIQ: 82,
  speed: 96,
  agility: 80,
  vertical: 98,
  strength: 76,
  freeThrow: 85,
  steal: 97,
  block: 84,
  stamina: 88,
  shotTendency: 98,
};

describe('player display helpers', () => {
  it('shows the Chinese name only in the Simplified Chinese interface', () => {
    expect(displayPlayerName(player, 'zh-CN')).toBe('Michael Jordan(迈克尔·乔丹)');
    expect(displayPlayerName(player, 'en')).toBe('Michael Jordan');
  });

  it('searches English names, Chinese names, and player archetypes', () => {
    const searchText = playerSearchText(player);

    expect(searchText).toContain('michael jordan');
    expect(searchText).toContain('迈克尔·乔丹');
    expect(searchText).toContain('two-way scorer');
  });
});
