import { beforeEach, describe, expect, it } from 'vitest';
import { players } from '@dream-court/core/catalog';
import type { Lineup, Player, Simulation } from '@dream-court/core';
import {
  GUEST_WORKSPACE_KEY,
  createGuestWorkspaceRepository,
  type GuestWorkspaceDeps,
} from './guest-workspace';
import type { StoragePort } from './ports';

const memoryStorage = (): StoragePort & { dump(): string[] } => {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
    dump: () => [...map.keys()],
  };
};

const savedLineup: Lineup = {
  id: 'guest-lineup',
  name: 'Guest lineup',
  description: 'Stored on this device',
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

let storage: ReturnType<typeof memoryStorage>;
let identifierCount: number;

const deps = (): GuestWorkspaceDeps => ({
  storage,
  id: () => `workspace-${(identifierCount += 1)}`,
  clock: () => new Date('2026-09-17T12:00:00.000Z'),
});

describe('guest workspace', () => {
  beforeEach(() => {
    storage = memoryStorage();
    identifierCount = 0;
  });

  it('creates one workspace and restores the same identity after reload', () => {
    const created = createGuestWorkspaceRepository(deps());
    const repository = createGuestWorkspaceRepository(deps());

    const loaded = created.load();
    const restored = repository.load();

    expect(loaded.id).toMatch(/^workspace-\d+$/);
    expect(loaded.players).toEqual([]);
    expect(loaded.lineups).toEqual([]);
    expect(loaded.simulations).toEqual([]);
    expect(loaded.hasUserProgress).toBe(false);
    expect(restored).toEqual(loaded);
  });

  it('marks user changes as progress and clears the imported workspace', () => {
    const repository = createGuestWorkspaceRepository(deps());
    const original = repository.load();

    repository.saveLineups([savedLineup]);

    expect(repository.load()).toMatchObject({
      id: original.id,
      hasUserProgress: true,
      lineups: [savedLineup],
    });
    expect(repository.summary()).toMatchObject({
      lineupCount: 1,
      playerCount: 0,
      simulationCount: 0,
    });

    repository.clear();

    const fresh = createGuestWorkspaceRepository(deps()).load();
    expect(fresh.id).not.toBe(original.id);
    expect(fresh.hasUserProgress).toBe(false);
    expect(fresh.lineups).toEqual([]);
  });

  it('keeps players, lineups and simulations in the same guest workspace', () => {
    const repository = createGuestWorkspaceRepository(deps());
    const samplePlayer: Player = players[0];

    repository.savePlayers([samplePlayer]);
    repository.saveLineups([savedLineup]);
    repository.saveSimulations([savedSimulation]);

    const workspace = repository.load();
    expect(workspace.players).toEqual([samplePlayer]);
    expect(workspace.lineups).toEqual([savedLineup]);
    expect(workspace.simulations).toEqual([savedSimulation]);
  });

  it('uses the injected legacy loader when no workspace exists yet', () => {
    const legacy: NonNullable<GuestWorkspaceDeps['loadLegacyWorkspace']> = () => ({
      id: 'legacy-workspace',
      schemaVersion: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      hasUserProgress: true,
      players: [],
      lineups: [savedLineup],
      simulations: [],
    });

    const repository = createGuestWorkspaceRepository({ ...deps(), loadLegacyWorkspace: legacy });
    const migrated = repository.load();

    expect(migrated.id).toBe('legacy-workspace');
    expect(migrated.lineups).toEqual([savedLineup]);
    expect(migrated.hasUserProgress).toBe(true);
    // 迁移结果立即持久化为当前工作区键，后续读取不再走兜底来源。
    expect(storage.dump()).toEqual([GUEST_WORKSPACE_KEY]);
    expect(createGuestWorkspaceRepository(deps()).load()).toEqual(migrated);
  });
});
