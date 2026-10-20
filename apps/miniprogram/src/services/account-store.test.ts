import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { players } from '@dream-court/core/catalog';
import type { Lineup } from '@dream-court/core';
import type { ApiClient, AuthSession } from '@dream-court/client';
import {
  startTestApiServer,
  testApi,
  register,
  failLineupWrites,
  type TestApiServer,
} from '@dream-court/client/testing/local-api-server';
import { createAccountStore } from './account-store';
import { createDiskStorage, type DiskStorage } from './testing/disk-storage';
const lineup = (id: string, name: string): Lineup => ({
  id,
  name,
  description: '',
  members: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
let server: TestApiServer;
let disk: DiskStorage;
let api: ApiClient;
let session: AuthSession;
let unauthorizedCalls: number;
beforeEach(async () => {
  disk = createDiskStorage();
  server = await startTestApiServer();
  unauthorizedCalls = 0;
  api = testApi(server.baseUrl, disk.storage);
  session = await register(api);
  await api.saveLineup(lineup('lineup-1', '主队'));
  await api.saveLineup(lineup('lineup-2', '客队'));
});
afterEach(async () => {
  await server.close();
});
const createStore = (id: () => string = randomUUID) =>
  createAccountStore({
    api,
    storage: disk.storage,
    id,
    clock: () => new Date(),
    user: session.user,
    onUnauthorized: () => {
      unauthorizedCalls++;
    },
  });
describe('账号数据源 → Spring Boot + PostgreSQL', () => {
  it('初始化通过真实 HTTP 读取球员、阵容与战报', async () => {
    const snapshot = (await createStore()).getSnapshot();
    expect(snapshot.source).toBe('account');
    expect(snapshot.user?.id).toBe(session.user.id);
    expect(snapshot.players).toHaveLength(players.length);
    expect(snapshot.lineups.map((l) => l.id).sort()).toEqual(['lineup-1', 'lineup-2']);
    expect(snapshot.hasUserProgress).toBe(true);
  });
  it('创建和连续保存更新快照，草稿按账号隔离', async () => {
    const store = await createStore(() => 'new-lineup');
    expect((await store.createLineup()).name).toBe('新阵容');
    expect(store.getSnapshot().lineups[0]?.id).toBe('new-lineup');
    await store.saveLineup(lineup('lineup-1', '第一次改名'));
    await store.saveLineup(lineup('lineup-1', '第二次改名'));
    expect(store.getSnapshot().lineups.find((l) => l.id === 'lineup-1')?.name).toBe('第二次改名');
    expect((await api.listLineups()).find((l) => l.id === 'lineup-1')?.name).toBe('第二次改名');
    expect(store.readDraft('lineup-1')).toBeNull();
    store.saveDraft(lineup('lineup-1', '未保存草稿'));
    expect(
      disk.storage.getItem(`dream-court.lineup-drafts.v1.account.${session.user.id}`),
    ).toContain('未保存草稿');
    expect(disk.storage.getItem('dream-court.lineup-drafts.v1')).toBeNull();
  });
  it('真实数据库写入失败时草稿与快照保持原状', async () => {
    const store = await createStore();
    store.saveDraft(lineup('lineup-1', '未保存草稿'));
    const restore = failLineupWrites(session.user.id);
    try {
      await expect(store.saveLineup(lineup('lineup-1', '未保存草稿'))).rejects.toMatchObject({
        status: 500,
      });
    } finally {
      restore();
    }
    expect(store.readDraft('lineup-1')?.name).toBe('未保存草稿');
    expect(store.getSnapshot().lineups.find((l) => l.id === 'lineup-1')?.name).toBe('主队');
  });
  it('保存期间写入的新草稿不被旧响应删除', async () => {
    const store = await createStore();
    const gate = server.pauseResponse('PUT', '/api/v1/lineups/lineup-1');
    const submitted = lineup('lineup-1', '提交版本');
    store.saveDraft(submitted);
    const saving = store.saveLineup(submitted);
    await gate.arrived;
    store.saveDraft({ ...submitted, name: '更新的编辑' });
    gate.release();
    await saving;
    expect(store.readDraft('lineup-1')?.name).toBe('更新的编辑');
    expect(store.getSnapshot().lineups.find((l) => l.id === 'lineup-1')?.name).toBe('提交版本');
  });
  it('失效账号的写操作返回真实 401，通知运行时并保留草稿', async () => {
    const store = await createStore();
    store.saveDraft(lineup('lineup-1', '未保存草稿'));
    api.saveSession({ ...session, accessToken: randomUUID() });
    await expect(store.saveLineup(lineup('lineup-1', '未保存草稿'))).rejects.toMatchObject({
      status: 401,
    });
    expect(unauthorizedCalls).toBe(1);
    expect(store.readDraft('lineup-1')?.name).toBe('未保存草稿');
  });
  it('真实规则对战前置战报，拒绝相同阵容、缺少球员和未保存草稿', async () => {
    const store = await createStore();
    await expect(store.runBattle('lineup-1', 'lineup-1')).rejects.toThrow('两套不同的阵容');
    await expect(store.runBattle('lineup-1', 'lineup-2')).rejects.toThrow();
    const eligible = (id: string, start: number): Lineup => ({
      ...lineup(id, id),
      members: (['PG', 'SG', 'SF', 'PF', 'C'] as const).map((position, i) => ({
        playerId: players[start + i].id,
        position,
        starter: true,
        inactive: false,
      })),
    });
    await store.saveLineup(eligible('lineup-1', 0));
    await store.saveLineup(eligible('lineup-2', 5));
    const draft = { ...eligible('lineup-2', 5), name: '客队草稿' };
    store.saveDraft(draft);
    await expect(store.runBattle('lineup-1', 'lineup-2')).rejects.toThrow('完成草稿保存');
    await store.saveLineup(draft);
    expect(store.readDraft('lineup-2')).toBeNull();
    const report = await store.runBattle('lineup-1', 'lineup-2');
    expect(store.getSnapshot().reports[0]).toEqual(report);
    const persisted = await api.getSimulation(report.id);
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
