// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { players } from '@/data/players';
import { guestWorkspaceRepository } from '@/lib/guest-workspace';
import type { Lineup, Simulation } from '@/types';

const savedLineup: Lineup = {
  id: 'guest-lineup',
  name: 'Guest lineup',
  description: 'Stored in this browser',
  members: [],
  createdAt: '2026-09-17T00:00:00.000Z',
  updatedAt: '2026-09-17T00:00:00.000Z',
};

const savedSimulation: Simulation = {
  id: 'guest-game',
  homeLineupId: 'guest-lineup',
  awayLineupId: 'classic-five',
  seed: 42,
  homeScore: 101,
  awayScore: 99,
  homeStats: [],
  awayStats: [],
  createdAt: '2026-09-17T00:00:00.000Z',
  expiresAt: '2026-10-17T00:00:00.000Z',
};

describe('guest workspace', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates one browser workspace and restores the same identity after reload', () => {
    const created = guestWorkspaceRepository.load();
    const restored = guestWorkspaceRepository.load();

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(restored).toEqual(created);
    expect(created.players).toEqual([]);
    expect(created.lineups).toEqual([]);
    expect(created.simulations).toEqual([]);
    expect(created.hasUserProgress).toBe(false);
  });

  it('marks user changes as progress and clears the imported workspace', () => {
    const original = guestWorkspaceRepository.load();

    guestWorkspaceRepository.saveLineups([savedLineup]);

    expect(guestWorkspaceRepository.load()).toMatchObject({
      id: original.id,
      hasUserProgress: true,
      lineups: [savedLineup],
    });
    expect(guestWorkspaceRepository.summary()).toMatchObject({
      lineupCount: 1,
      playerCount: 0,
      simulationCount: 0,
    });

    guestWorkspaceRepository.clear();

    const fresh = guestWorkspaceRepository.load();
    expect(fresh.id).not.toBe(original.id);
    expect(fresh.hasUserProgress).toBe(false);
    expect(fresh.lineups).toEqual([]);
  });

  it('keeps players, lineups and simulations in the same guest workspace', () => {
    guestWorkspaceRepository.savePlayers([players[0]]);
    guestWorkspaceRepository.saveLineups([savedLineup]);
    guestWorkspaceRepository.saveSimulations([savedSimulation]);

    const workspace = guestWorkspaceRepository.load();
    expect(workspace.players).toEqual([players[0]]);
    expect(workspace.lineups).toEqual([savedLineup]);
    expect(workspace.simulations).toEqual([savedSimulation]);
    expect(guestWorkspaceRepository.summary()).toMatchObject({
      playerCount: 1,
      lineupCount: 1,
      simulationCount: 1,
    });
  });

  it('migrates existing browser saves into one guest workspace', () => {
    localStorage.setItem('dream-court.lineups.v1', JSON.stringify([savedLineup]));
    localStorage.setItem('dream-court.players.v1', JSON.stringify([players[0]]));
    localStorage.setItem('dream-court.games.v1', JSON.stringify([savedSimulation]));

    const migrated = guestWorkspaceRepository.load();

    expect(migrated.lineups).toEqual([savedLineup]);
    expect(migrated.players).toEqual([players[0]]);
    expect(migrated.simulations).toEqual([savedSimulation]);
    expect(migrated.hasUserProgress).toBe(true);
    expect(localStorage.getItem('dream-court.lineups.v1')).toBeNull();
    expect(localStorage.getItem('dream-court.players.v1')).toBeNull();
    expect(localStorage.getItem('dream-court.games.v1')).toBeNull();
  });
});
