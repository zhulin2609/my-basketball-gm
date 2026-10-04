import { beforeEach, describe, expect, it } from 'vitest';
import type { Lineup, Simulation } from '@dream-court/core';
import {
  CLASSIC_LINEUP_CLIENT_KEY,
  createClassicLineup,
  createStarterLineup,
} from '@dream-court/core';
import { createGuestRepositories, type GuestRepositories } from './repository';
import type { StoragePort } from './ports';

const memoryStorage = (): StoragePort => {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
};

let identifierCount = 0;
let now: Date;

const createRepositories = (): GuestRepositories =>
  createGuestRepositories({
    storage: memoryStorage(),
    id: () => `id-${(identifierCount += 1)}`,
    clock: () => now,
  });

const presetLineups = (): Lineup[] => [
  createStarterLineup({
    id: `starter-${identifierCount + 1}`,
    name: '我的梦之队',
    description: '示例',
    now: now.toISOString(),
  }),
  createClassicLineup({
    id: CLASSIC_LINEUP_CLIENT_KEY,
    name: '经典五人',
    description: '示例',
    now: now.toISOString(),
  }),
];

const simulationAt = (id: string, createdAt: Date): Simulation => ({
  id,
  homeLineupId: 'home',
  awayLineupId: 'away',
  seed: 1,
  homeScore: 100,
  awayScore: 98,
  homeStats: [],
  awayStats: [],
  createdAt: createdAt.toISOString(),
  expiresAt: new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
});

describe('guest repositories', () => {
  beforeEach(() => {
    identifierCount = 0;
    now = new Date('2026-09-17T12:00:00.000Z');
  });

  it('seeds playable lineups without treating examples as user progress', () => {
    const repositories = createRepositories();

    const lineups = repositories.bootstrap(presetLineups());

    expect(lineups).toHaveLength(2);
    expect(lineups[0].name).toBe('我的梦之队');
    expect(repositories.workspace.load().hasUserProgress).toBe(false);
  });

  it('keeps existing lineups when bootstrap runs again with user data present', () => {
    const repositories = createRepositories();
    repositories.bootstrap(presetLineups());

    const edited: Lineup = { ...repositories.lineups.list()[0], name: 'My lineup' };
    repositories.lineups.save(edited);
    const again = repositories.bootstrap(presetLineups());

    expect(again[0].name).toBe('My lineup');
    expect(repositories.workspace.load().hasUserProgress).toBe(true);
  });

  it('caps local simulations at the newest twenty reports', () => {
    const repositories = createRepositories();

    for (let index = 0; index < 25; index += 1) {
      repositories.simulations.save(simulationAt(`report-${index}`, now));
    }

    const reports = repositories.simulations.list();
    expect(reports).toHaveLength(20);
    expect(reports[0].id).toBe('report-24');
    expect(reports[19].id).toBe('report-5');
  });

  it('drops expired reports on read and backfills the retention window for legacy rows', () => {
    const repositories = createRepositories();
    const expired = simulationAt('expired', new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000));
    const legacy = { ...simulationAt('legacy', new Date(now.getTime() - 10 * 86400000)) };
    delete (legacy as Partial<Simulation>).expiresAt;
    repositories.workspace.saveSimulations([expired, legacy], true);

    const reports = repositories.simulations.list();

    expect(reports.map((report) => report.id)).toEqual(['legacy']);
    expect(reports[0].expiresAt).toBe(
      new Date(new Date('2026-09-07T12:00:00.000Z').getTime() + 30 * 86400000).toISOString(),
    );
  });
});
