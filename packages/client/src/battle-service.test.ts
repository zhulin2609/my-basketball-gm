// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { players } from '@dream-court/core/catalog';
import { createBattleService, createGuestRepositories } from './index';
import {
  startTestApiServer,
  testApi,
  register,
  type TestApiServer,
} from './testing/local-api-server';
let server: TestApiServer;
beforeEach(async () => {
  localStorage.clear();
  server = await startTestApiServer();
});
afterEach(async () => {
  await server.close();
});
const lineup = (id: string, memberIds: string[]) => ({
  id,
  name: id,
  description: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  members: memberIds.map((playerId, i) => ({
    playerId,
    position: (['PG', 'SG', 'SF', 'PF', 'C'] as const)[i],
    starter: true,
    inactive: false,
  })),
});
const home = () => lineup('home', ['curry', 'jordan', 'lebron', 'duncan', 'shaq']);
const away = () => lineup('away', ['magic', 'kobe', 'bird', 'garnett', 'olajuwon']);
function dependencies() {
  let count = 0;
  const clock = () => new Date('2026-09-17T12:00:00.000Z');
  return {
    api: testApi(server.baseUrl, localStorage),
    repositories: createGuestRepositories({
      storage: localStorage,
      id: () => `id-${++count}`,
      clock,
    }),
    id: () => `report-${++count}`,
    clock,
    randomSeed: () => 42,
  };
}
describe('battle service', () => {
  it('runs the shared engine on device, persists locally, never calls API', () => {
    const deps = dependencies();
    const report = createBattleService(deps).runLocal(home(), away(), players);
    expect(report.id).toBe('report-1');
    expect(report.seed).toBe(42);
    expect(report.createdAt).toBe('2026-09-17T12:00:00.000Z');
    expect(report.engineVersion).toBe('v1');
    expect(report.homeStats.reduce((sum, stat) => sum + stat.minutes, 0)).toBe(240);
    expect(deps.repositories.simulations.list().map((r) => r.id)).toEqual(['report-1']);
    expect(
      JSON.parse(localStorage.getItem('dream-court.guest-workspace.v1')!).simulations,
    ).toHaveLength(1);
    expect(server.requests).toHaveLength(0);
  });
  it('waits for actual pending lineup save before Spring Boot calculates and persists report', async () => {
    const deps = dependencies();
    await register(deps.api);
    await deps.api.saveLineup(away());
    const gate = server.pauseResponse('PUT', '/api/v1/lineups/home');
    const saving = deps.api.saveLineup(home()).then(() => undefined);
    await gate.arrived;
    const pending = createBattleService(deps).runCloud('home', 'away', 'local', [saving]);
    await new Promise((done) => setTimeout(done, 50));
    expect(
      server.requests.filter((r) => r.method === 'POST' && r.path === '/api/v1/simulations'),
    ).toHaveLength(0);
    gate.release();
    const report = await pending;
    expect(server.requests.at(-1)?.body).toMatchObject({
      homeLineupId: 'home',
      awayLineupId: 'away',
      simulationMode: 'local',
    });
    expect(report.homeStats).toHaveLength(5);
    expect(report.awayStats).toHaveLength(5);
    expect(report.homeStats.reduce((sum, stat) => sum + stat.points, 0)).toBe(report.homeScore);
    const persisted = await deps.api.getSimulation(report.id);
    expect({ ...persisted, homeStats: [], awayStats: [] }).toEqual({
      ...report,
      homeStats: [],
      awayStats: [],
    });
    expect(persisted.homeStats).toEqual(expect.arrayContaining(report.homeStats));
    expect(persisted.awayStats).toEqual(expect.arrayContaining(report.awayStats));
    expect(persisted.homeStats).toHaveLength(report.homeStats.length);
    expect(persisted.awayStats).toHaveLength(report.awayStats.length);
  });
});
