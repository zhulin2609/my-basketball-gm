// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Lineup } from '@dream-court/core';
import { createLineupSaveQueue, type LineupSaveQueue } from './index';
import {
  startTestApiServer,
  testApi,
  register,
  failLineupWrites,
  type TestApiServer,
} from './testing/local-api-server';
const lineupWith = (name: string): Lineup => ({
  id: 'lineup-1',
  name,
  description: '',
  members: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
let server: TestApiServer;
let queue: LineupSaveQueue;
let owner: string;
beforeEach(async () => {
  localStorage.clear();
  server = await startTestApiServer();
  const api = testApi(server.baseUrl, localStorage);
  owner = (await register(api)).user.id;
  server.requests.length = 0;
  queue = createLineupSaveQueue((lineup) => api.saveLineup(lineup));
});
afterEach(async () => {
  await server.close();
});
describe('lineup save queue → Spring Boot + PostgreSQL', () => {
  it('serializes saves per lineup; earlier response cannot override newer edit', async () => {
    const applied: string[] = [];
    const errors: unknown[] = [];
    const gate = server.pauseResponse('PUT', '/api/v1/lineups/lineup-1');
    const first = queue.enqueue(lineupWith('first'), {
      onApplied: (r) => applied.push(r.name),
      onError: (e) => errors.push(e),
    });
    await gate.arrived;
    const second = queue.enqueue(lineupWith('second'), {
      onApplied: (r) => applied.push(r.name),
      onError: (e) => errors.push(e),
    });
    await new Promise((done) => setTimeout(done, 50));
    expect(server.requests).toHaveLength(1);
    gate.release();
    await Promise.all([first, second]);
    expect(applied).toEqual(['second']);
    expect(errors).toHaveLength(0);
    expect(server.requests.map((r) => (r.body as Lineup).name)).toEqual(['first', 'second']);
  });
  it('propagates PostgreSQL write failure as ApiError and lets later saves run', async () => {
    const restore = failLineupWrites(owner);
    const errors: unknown[] = [];
    try {
      await expect(
        queue.enqueue(lineupWith('boom'), { onError: (e) => errors.push(e) }),
      ).rejects.toMatchObject({ name: 'ApiError', status: 500 });
      expect(errors).toHaveLength(1);
    } finally {
      restore();
    }
    await expect(queue.enqueue(lineupWith('recovered'))).resolves.toBeUndefined();
  });
  it('exposes only unfinished saves so battle start can wait for them', async () => {
    const gate = server.pauseResponse('PUT', '/api/v1/lineups/lineup-1');
    expect(queue.pending('lineup-1')).toBeUndefined();
    const request = queue.enqueue(lineupWith('first'));
    expect(queue.pending('lineup-1')).toBe(request);
    await gate.arrived;
    gate.release();
    await request;
    expect(queue.pending('lineup-1')).toBeUndefined();
  });
});
