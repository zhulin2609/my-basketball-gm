// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Lineup } from '@dream-court/core';
import {
  createApiClient,
  createFetchHttpPort,
  createLineupSaveQueue,
  type LineupSaveQueue,
} from './index';
import { startTestApiServer, type TestApiServer } from './testing/local-api-server';

const browserStorage = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
  removeItem: (key: string) => localStorage.removeItem(key),
};

const lineupWith = (name: string): Lineup => ({
  id: 'lineup-1',
  name,
  description: '',
  members: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

let server: TestApiServer;
let queue: LineupSaveQueue;
const applied: string[] = [];
const errors: unknown[] = [];

beforeEach(async () => {
  localStorage.clear();
  server = await startTestApiServer();
  const api = createApiClient({
    baseUrl: server.baseUrl,
    http: createFetchHttpPort(),
    storage: browserStorage,
    clock: () => new Date(),
  });
  queue = createLineupSaveQueue((lineup) => api.saveLineup(lineup));
  applied.length = 0;
  errors.length = 0;
});

afterEach(async () => {
  await server.close();
});

describe('lineup save queue over real http', () => {
  it('serializes saves per lineup, and an earlier response never overrides a newer edit', async () => {
    // 第一个请求被服务器扣住响应；此时第二个保存不得发出。
    let releaseFirst!: () => void;
    const firstResponseGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    server.respond('PUT', '/api/v1/lineups/lineup-1', async (request) => {
      const name = (request.body as Lineup).name;
      if (name === 'first') {
        await firstResponseGate;
        return { status: 200, body: lineupWith('applied-first') };
      }
      return { status: 200, body: lineupWith('applied-second') };
    });

    const first = queue.enqueue(lineupWith('first'), {
      onApplied: (remote) => applied.push(remote.name),
      onError: (error) => errors.push(error),
    });
    await server.waitForRequestCount(1);

    const second = queue.enqueue(lineupWith('second'), {
      onApplied: (remote) => applied.push(remote.name),
      onError: (error) => errors.push(error),
    });
    // 串行化核心断言：第一个请求未完成前，第二个请求尚未发往服务器。
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(server.requests).toHaveLength(1);

    releaseFirst();
    await Promise.all([first, second]);

    expect(applied).toEqual(['applied-second']);
    expect(errors).toHaveLength(0);
    expect(server.requests.map((request) => (request.body as Lineup).name)).toEqual([
      'first',
      'second',
    ]);
  });

  it('propagates a real 500 response as a structured ApiError and lets later saves run', async () => {
    server.respond('PUT', '/api/v1/lineups/lineup-1', async (request) => {
      const name = (request.body as Lineup).name;
      if (name === 'boom') {
        return { status: 500, body: { message: '数据库写入失败', code: null } };
      }
      return { status: 200, body: lineupWith(name) };
    });

    const failing = queue.enqueue(lineupWith('boom'), {
      onError: (error) => errors.push(error),
    });
    await expect(failing).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: '数据库写入失败',
    });
    expect(errors).toHaveLength(1);

    await expect(queue.enqueue(lineupWith('recovered'))).resolves.toBeUndefined();
  });

  it('exposes only unfinished saves so battle start can wait for them', async () => {
    let release!: () => void;
    const responseGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.respond('PUT', '/api/v1/lineups/lineup-1', async () => {
      await responseGate;
      return { status: 200, body: lineupWith('first') };
    });

    expect(queue.pending('lineup-1')).toBeUndefined();
    const request = queue.enqueue(lineupWith('first'));
    expect(queue.pending('lineup-1')).toBe(request);

    release();
    await request;
    expect(queue.pending('lineup-1')).toBeUndefined();
  });
});
