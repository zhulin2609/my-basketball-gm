// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import type { Lineup, Player, Simulation } from '@dream-court/core';
import {
  GUEST_WORKSPACE_KEY,
  LEGACY_LINEUPS_KEY,
  LEGACY_PLAYERS_KEY,
  LEGACY_SIMULATIONS_KEY,
} from '@dream-court/client';
import { loadLegacyWorkspace } from './guest-legacy';
import { createIdentifier } from './identifier';

const savedLineup: Lineup = {
  id: 'legacy-lineup',
  name: 'Legacy lineup',
  description: '',
  members: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const legacyPlayer: Player = {
  id: 'legacy-player',
  name: 'Legacy Player',
  initials: 'LP',
  peakSeason: '2020–21',
  peakTeam: 'Legacy',
  defaultPosition: 'SG',
  heightFeet: 6,
  heightInches: 5,
  weightLbs: 200,
  salaryUsd: 0,
  archetype: 'Wing scorer',
  bio: 'Legacy entry',
  accent: '#f3c969',
  threePoint: 80,
  layup: 80,
  midRange: 80,
  insideScoring: 80,
  dunk: 80,
  offensiveRebound: 50,
  defensiveRebound: 50,
  handling: 70,
  passing: 60,
  defensiveIQ: 70,
  offensiveIQ: 70,
  speed: 85,
  agility: 80,
  vertical: 85,
  strength: 70,
  freeThrow: 80,
  steal: 70,
  block: 50,
  stamina: 80,
  shotTendency: 75,
};

const savedSimulation: Simulation = {
  id: 'legacy-game',
  homeLineupId: 'legacy-lineup',
  awayLineupId: 'classic-five',
  seed: 42,
  homeScore: 101,
  awayScore: 99,
  homeStats: [],
  awayStats: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-02-01T00:00:00.000Z',
};

const deps = () => ({
  storage: {
    getItem: (key: string) => localStorage.getItem(key),
    setItem: (key: string, value: string) => localStorage.setItem(key, value),
    removeItem: (key: string) => localStorage.removeItem(key),
  },
  id: createIdentifier,
  clock: () => new Date('2026-09-17T12:00:00.000Z'),
});

describe('legacy browser storage migration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('folds the legacy keys into one workspace and removes them', () => {
    localStorage.setItem(LEGACY_LINEUPS_KEY, JSON.stringify([savedLineup]));
    localStorage.setItem(LEGACY_PLAYERS_KEY, JSON.stringify([legacyPlayer]));
    localStorage.setItem(LEGACY_SIMULATIONS_KEY, JSON.stringify([savedSimulation]));

    const migrated = loadLegacyWorkspace(deps());

    expect(migrated.lineups).toEqual([savedLineup]);
    expect(migrated.players).toEqual([legacyPlayer]);
    expect(migrated.simulations).toEqual([savedSimulation]);
    expect(migrated.hasUserProgress).toBe(true);
    expect(migrated.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(localStorage.getItem(LEGACY_LINEUPS_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_PLAYERS_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_SIMULATIONS_KEY)).toBeNull();
  });

  it('produces an empty non-progress workspace when no legacy keys exist', () => {
    const migrated = loadLegacyWorkspace(deps());

    expect(migrated.players).toEqual([]);
    expect(migrated.lineups).toEqual([]);
    expect(migrated.simulations).toEqual([]);
    expect(migrated.hasUserProgress).toBe(false);
    // 迁移本身不写入当前工作区键；持久化由 client 的工作区仓库完成。
    expect(localStorage.getItem(GUEST_WORKSPACE_KEY)).toBeNull();
  });
});
