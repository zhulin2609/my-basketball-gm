// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { players } from '@dream-court/core/catalog';
import type { Simulation } from '@dream-court/core';
import {
  createApiClient,
  createBattleService,
  createFetchHttpPort,
  createGuestRepositories,
  type BattleServiceDeps,
} from './index';
import { startTestApiServer, type TestApiServer } from './testing/local-api-server';

const browserStorage = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
  removeItem: (key: string) => localStorage.removeItem(key),
};

let server: TestApiServer;
let identifierCount: number;

beforeEach(async () => {
  localStorage.clear();
  server = await startTestApiServer();
  identifierCount = 0;
});

afterEach(async () => {
  await server.close();
});

const createDeps = (): BattleServiceDeps => {
  const api = createApiClient({
    baseUrl: server.baseUrl,
    http: createFetchHttpPort(),
    storage: browserStorage,
    clock: () => new Date('2026-09-17T12:00:00.000Z'),
  });
  const repositories = createGuestRepositories({
    storage: browserStorage,
    id: () => `id-${(identifierCount += 1)}`,
    clock: () => new Date('2026-09-17T12:00:00.000Z'),
  });
  return {
    api,
    repositories,
    id: () => `report-${(identifierCount += 1)}`,
    clock: () => new Date('2026-09-17T12:00:00.000Z'),
    randomSeed: () => 42,
  };
};

const lineup = (id: string, memberIds: string[]) => ({
  id,
  name: id,
  description: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  members: memberIds.map((playerId, index) => ({
    playerId,
    position: ['PG', 'SG', 'SF', 'PF', 'C'][index] as 'PG',
    starter: true,
    inactive: false,
  })),
});

// 服务器返回的完整战报结构：覆盖战报响应的全部字段，验证真实 HTTP 契约。
const cloudReport: Simulation = {
  id: '0c3d7c62-1f4a-4f0e-9d1a-5f2a2f5b1a01',
  homeLineupId: 'home',
  awayLineupId: 'away',
  homeLineupName: 'home',
  awayLineupName: 'away',
  seed: 7,
  homeScore: 132,
  awayScore: 128,
  homeStats: [
    {
      playerId: 'curry',
      playerName: 'Stephen Curry',
      playerInitials: 'SC',
      playerAccent: '#f3c969',
      minutes: 38,
      points: 41,
      rebounds: 5,
      assists: 9,
      steals: 2,
      blocks: 0,
      fgMade: 15,
      fgAttempted: 28,
      threeMade: 7,
      threeAttempted: 14,
    },
  ],
  awayStats: [
    {
      playerId: 'jordan',
      playerName: 'Michael Jordan',
      playerInitials: 'MJ',
      playerAccent: '#c3ec8b',
      minutes: 40,
      points: 37,
      rebounds: 7,
      assists: 4,
      steals: 3,
      blocks: 1,
      fgMade: 14,
      fgAttempted: 27,
      threeMade: 2,
      threeAttempted: 5,
    },
  ],
  engineVersion: 'v1',
  createdAt: '2026-09-17T12:00:00.000Z',
  expiresAt: '2026-10-17T12:00:00.000Z',
};

describe('battle service', () => {
  it('runs the shared engine on the device, persists the report locally and never calls the api', async () => {
    const deps = createDeps();
    const home = lineup('home', ['curry', 'jordan', 'lebron', 'duncan', 'shaq']);
    const away = lineup('away', ['magic', 'kobe', 'bird', 'garnett', 'olajuwon']);

    const report = createBattleService(deps).runLocal(home, away, players);

    expect(report.id).toBe('report-1');
    expect(report.seed).toBe(42);
    expect(report.createdAt).toBe('2026-09-17T12:00:00.000Z');
    expect(report.engineVersion).toBe('v1');
    expect(report.homeStats.reduce((sum, stat) => sum + stat.minutes, 0)).toBe(240);
    expect(deps.repositories.simulations.list().map((item) => item.id)).toEqual(['report-1']);
    const stored = JSON.parse(localStorage.getItem('dream-court.guest-workspace.v1') ?? '{}');
    expect(stored.simulations).toHaveLength(1);
    expect(server.requests).toHaveLength(0);
  });

  it('waits for pending lineup saves before sending the real simulation request', async () => {
    server.respond('POST', '/api/v1/simulations', async (request) => {
      expect(request.body).toMatchObject({
        homeLineupId: 'home',
        awayLineupId: 'away',
        simulationMode: 'local',
      });
      return { status: 201, body: cloudReport };
    });

    const deps = createDeps();
    let resolvePending!: () => void;
    const pendingSave = new Promise<void>((resolve) => {
      resolvePending = resolve;
    });

    const pending = createBattleService(deps).runCloud('home', 'away', 'local', [pendingSave]);

    // 在途保存完成前，对战请求不得发出。
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(server.requests).toHaveLength(0);

    resolvePending();
    const report = await pending;

    expect(server.requests).toHaveLength(1);
    expect(report).toEqual(cloudReport);
  });
});
