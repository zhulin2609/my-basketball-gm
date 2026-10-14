import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { players } from '@dream-court/core/catalog';
import type { Lineup, Simulation } from '@dream-court/core';
import {
  createApiClient,
  createFetchHttpPort,
  type ApiClient,
  type AuthUser,
} from '@dream-court/client';
import {
  startTestApiServer,
  type TestApiServer,
} from '@dream-court/client/testing/local-api-server';
import { createAccountStore } from './account-store';
import type { DataStore } from './data-store';
import { createDiskStorage, type DiskStorage } from './testing/disk-storage';

const user: AuthUser = {
  id: 'user-account-1',
  username: '球员甲',
  displayName: '球员甲',
  admin: false,
};

const now = new Date('2026-10-13T12:00:00.000Z');

const lineup = (id: string, name: string): Lineup => ({
  id,
  name,
  description: '',
  members: [],
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
});

const report = (id: string): Simulation => ({
  id,
  homeLineupId: 'lineup-1',
  awayLineupId: 'lineup-2',
  homeLineupName: '主队',
  awayLineupName: '客队',
  seed: 42,
  homeScore: 108,
  awayScore: 104,
  homeStats: [],
  awayStats: [],
  engineVersion: 'v1',
  createdAt: now.toISOString(),
  expiresAt: '2026-11-12T12:00:00.000Z',
});

let server: TestApiServer;
let disk: DiskStorage;
let api: ApiClient;

beforeEach(async () => {
  disk = createDiskStorage();
  server = await startTestApiServer();
  api = createApiClient({
    baseUrl: server.baseUrl,
    http: createFetchHttpPort(),
    storage: disk.storage,
    clock: () => now,
  });
  server.respond('GET', '/api/v1/players', async () => ({ status: 200, body: players }));
  server.respond('GET', '/api/v1/lineups', async () => ({
    status: 200,
    body: [lineup('lineup-1', '主队'), lineup('lineup-2', '客队')],
  }));
  server.respond('GET', '/api/v1/simulations?limit=30&offset=0', async () => ({
    status: 200,
    body: [],
  }));
});

afterEach(async () => {
  await server.close();
});

const createStore = (): Promise<DataStore> =>
  createAccountStore({ api, storage: disk.storage, id: randomUUID, clock: () => now, user });

// 边界说明：测试服务器提供的是契约响应，验证对象是账号数据源的状态、顺序与错误处理；
// 与真实后端的端到端行为由后端集成测试和平台验收覆盖。

describe('账号数据源', () => {
  it('初始化时通过真实 HTTP 读取球员、阵容与战报', async () => {
    const store = await createStore();
    const snapshot = store.getSnapshot();
    expect(snapshot.source).toBe('account');
    expect(snapshot.user?.username).toBe('球员甲');
    expect(snapshot.players).toHaveLength(players.length);
    expect(snapshot.lineups.map((item) => item.id)).toEqual(['lineup-1', 'lineup-2']);
    expect(snapshot.hasUserProgress).toBe(true);
  });

  it('创建与保存阵容写入服务器并更新快照，草稿按账号隔离保存', async () => {
    const savedRequests: string[] = [];
    server.respond('PUT', '/api/v1/lineups/new-lineup', async (request) => ({
      status: 200,
      body: { ...(request.body as object), id: 'new-lineup' },
    }));
    server.respond('PUT', '/api/v1/lineups/lineup-1', async (request) => {
      savedRequests.push(JSON.stringify(request.body));
      return { status: 200, body: { ...(request.body as object), id: 'lineup-1' } };
    });

    const store = await createAccountStore({
      api,
      storage: disk.storage,
      id: () => 'new-lineup',
      clock: () => now,
      user,
    });
    const created = await store.createLineup();
    expect(created.name).toBe('新阵容');
    expect(store.getSnapshot().lineups[0]?.id).toBe('new-lineup');

    await store.saveLineup({ ...lineup('lineup-1', '主队'), name: '第一次改名' });
    await store.saveLineup({ ...lineup('lineup-1', '主队'), name: '第二次改名' });
    expect(savedRequests).toHaveLength(2);
    expect(savedRequests[0]).toContain('第一次改名');
    expect(savedRequests[1]).toContain('第二次改名');
    expect(store.getSnapshot().lineups.find((item) => item.id === 'lineup-1')?.name).toBe(
      '第二次改名',
    );
    expect(store.readDraft('lineup-1')).toBeNull();

    store.saveDraft({ ...lineup('lineup-1', '主队'), name: '未保存草稿' });
    expect(disk.storage.getItem(`dream-court.lineup-drafts.v1.account.${user.id}`)).toContain(
      '未保存草稿',
    );
    expect(disk.storage.getItem('dream-court.lineup-drafts.v1')).toBeNull();
  });

  it('保存失败时草稿与快照保持原状', async () => {
    server.respond('PUT', '/api/v1/lineups/lineup-1', async () => ({
      status: 500,
      body: { message: '服务器错误' },
    }));
    const store = await createStore();
    store.saveDraft({ ...lineup('lineup-1', '主队'), name: '未保存草稿' });
    await expect(
      store.saveLineup({ ...lineup('lineup-1', '主队'), name: '未保存草稿' }),
    ).rejects.toMatchObject({ status: 500 });
    expect(store.readDraft('lineup-1')?.name).toBe('未保存草稿');
    expect(store.getSnapshot().lineups.find((item) => item.id === 'lineup-1')?.name).toBe('主队');
  });

  it('保存期间写入的新草稿不被旧响应删除', async () => {
    let releaseResponse: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    server.respond('PUT', '/api/v1/lineups/lineup-1', async (request) => {
      await gate;
      return { status: 200, body: { ...(request.body as object), id: 'lineup-1' } };
    });

    const store = await createStore();
    const submitted = { ...lineup('lineup-1', '主队'), name: '提交版本' };
    store.saveDraft(submitted);
    const saving = store.saveLineup(submitted);
    // 请求未返回时写入更新的编辑
    store.saveDraft({ ...submitted, name: '更新的编辑' });
    releaseResponse();
    await saving;

    expect(store.readDraft('lineup-1')?.name).toBe('更新的编辑');
    expect(store.getSnapshot().lineups.find((item) => item.id === 'lineup-1')?.name).toBe(
      '提交版本',
    );
  });

  it('规则对战经服务器计算并前置最新战报，存在草稿或阵容不完整时拒绝发起', async () => {
    const eligibleLineup = (id: string, name: string, start: number): Lineup => ({
      id,
      name,
      description: '',
      members: (['PG', 'SG', 'SF', 'PF', 'C'] as const).map((position, index) => ({
        playerId: players[start + index].id,
        position,
        starter: true,
        inactive: false,
      })),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    server.respond('GET', '/api/v1/lineups', async () => ({
      status: 200,
      body: [eligibleLineup('lineup-1', '主队', 0), eligibleLineup('lineup-2', '客队', 5)],
    }));
    server.respond('POST', '/api/v1/simulations', async (request) => ({
      status: 201,
      body: report('report-1'),
    }));

    const store = await createStore();
    await expect(store.runBattle('lineup-1', 'lineup-1')).rejects.toThrow('两套不同的阵容');

    store.saveDraft({ ...eligibleLineup('lineup-2', '客队', 5), name: '客队草稿' });
    await expect(store.runBattle('lineup-1', 'lineup-2')).rejects.toThrow('完成草稿保存');

    server.respond('PUT', '/api/v1/lineups/lineup-2', async (request) => ({
      status: 200,
      body: { ...(request.body as object), id: 'lineup-2' },
    }));
    await store.saveLineup({ ...eligibleLineup('lineup-2', '客队', 5), name: '客队草稿' });
    expect(store.readDraft('lineup-2')).toBeNull();

    const played = await store.runBattle('lineup-1', 'lineup-2');
    expect(played.id).toBe('report-1');
    expect(store.getSnapshot().reports[0]?.id).toBe('report-1');
  });
});
