import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { players } from '@dream-court/core/catalog';
import { createApiClient, createFetchHttpPort } from '@dream-court/client';
import { startTestApiServer } from '@dream-court/client/testing/local-api-server';
import { createGuestRuntime, toDataStore } from './guest-runtime';
import { createAccountStore } from './account-store';
import {
  addLineupMember,
  createGuestStore,
  loadLineupEditor,
  removeLineupMember,
} from './guest-store';
import { createDiskStorage } from './testing/disk-storage';
import { validateApiBaseUrl } from '../config/env';

describe('游客初始化', () => {
  it('移除球员后草稿变化通知列表，正式保存后清除草稿并更新人数', async () => {
    const { storage } = createDiskStorage();
    const deps = {
      storage,
      catalog: players,
      id: randomUUID,
      clock: () => new Date(),
      randomSeed: () => 314159,
    };
    const store = createGuestStore(deps);
    let lineup = store.getSnapshot().lineups[0];
    for (const player of players) {
      if (lineup.members.length === 15) break;
      if (!lineup.members.some((member) => member.playerId === player.id)) {
        lineup = addLineupMember(lineup, player);
      }
    }
    store.saveLineup(lineup);
    const runtime = createGuestRuntime(async () => toDataStore(store));
    await runtime.initialize();
    const before = runtime.getSnapshot();
    let notifications = 0;
    runtime.subscribe(() => notifications++);
    let draft = lineup;
    for (const member of lineup.members.slice(-4)) {
      draft = removeLineupMember(draft, member.playerId);
      store.saveDraft(draft);
    }
    expect(notifications).toBe(4);
    const pending = runtime.getSnapshot();
    expect(pending).not.toBe(before);
    if (pending.status !== 'ready') throw new Error('游客服务状态错误');
    const saved = pending.data.lineups.find((item) => item.id === lineup.id);
    if (!saved) throw new Error('缺少已保存阵容');
    expect(saved.members).toHaveLength(15);
    expect(loadLineupEditor(pending.store, saved)).toEqual({
      status: 'ready',
      lineup: draft,
      dirty: true,
    });
    expect(draft.members).toHaveLength(11);
    expect(() => store.runBattle(lineup.id, 'classic-five')).toThrow('草稿保存');
    const restored = createGuestStore(deps);
    expect(restored.readDraft(lineup.id)?.members).toHaveLength(11);
    const unchanged = restored.getSnapshot().lineups.find((item) => item.id === lineup.id);
    expect(unchanged?.members).toHaveLength(15);
    store.saveLineup(draft);
    const completed = runtime.getSnapshot();
    if (completed.status !== 'ready') throw new Error('游客服务状态错误');
    const updated = completed.data.lineups.find((item) => item.id === lineup.id);
    if (!updated) throw new Error('缺少更新后的阵容');
    expect(updated.members).toHaveLength(11);
    expect(loadLineupEditor(store, updated)).toEqual({
      status: 'ready',
      lineup: updated,
      dirty: false,
    });
    expect(store.readDraft(lineup.id)).toBeNull();
    expect(store.runBattle(lineup.id, 'classic-five').homeLineupName).toBe(lineup.name);
  });

  it('真实存储读取失败后允许重试，恢复后复用同一个工作区和服务', async () => {
    const { storage, file } = createDiskStorage();
    const deps = {
      storage,
      catalog: players,
      id: randomUUID,
      clock: () => new Date(),
      randomSeed: () => 314159,
    };
    const original = createGuestStore(deps);
    const home = original.getSnapshot().lineups[0];
    original.saveDraft({ ...home, name: '保留初始化前的草稿' });
    const saved = readFileSync(file, 'utf8');
    writeFileSync(file, '{');
    const runtime = createGuestRuntime(async () => toDataStore(createGuestStore(deps)));
    const first = runtime.initialize();
    expect(runtime.initialize()).toBe(first);
    await expect(first).rejects.toBeInstanceOf(SyntaxError);
    expect(runtime.getSnapshot().status).toBe('failed');
    expect(readFileSync(file, 'utf8')).toBe('{');
    writeFileSync(file, saved);
    const retry = runtime.initialize();
    expect(retry).not.toBe(first);
    expect(runtime.getSnapshot().status).toBe('loading');
    await retry;
    const ready = runtime.getSnapshot();
    expect(ready.status).toBe('ready');
    if (ready.status !== 'ready') throw new Error('游客初始化未完成');
    expect(ready.store.readDraft(home.id)?.name).toBe('保留初始化前的草稿');
    const before = readFileSync(file, 'utf8');
    await runtime.initialize();
    expect(runtime.getSnapshot()).toBe(ready);
    expect(readFileSync(file, 'utf8')).toBe(before);
    const created = await ready.store.createLineup();
    const refreshed = runtime.getSnapshot();
    if (refreshed.status !== 'ready') throw new Error('游客服务状态错误');
    expect(refreshed.data.lineups[0].id).toBe(created.id);
  });

  it('切换数据源后，旧数据源的写入通知不会写回快照', async () => {
    const storageA = createDiskStorage().storage;
    const storageB = createDiskStorage().storage;
    const depsFor = (storage: typeof storageA) => ({
      storage,
      catalog: players,
      id: randomUUID,
      clock: () => new Date(),
      randomSeed: () => 314159,
    });
    const storeA = createGuestStore(depsFor(storageA));
    const storeB = createGuestStore(depsFor(storageB));
    const runtime = createGuestRuntime(async () => toDataStore(storeA));
    await runtime.initialize();
    expect(runtime.getSnapshot().status).toBe('ready');

    await runtime.swap(async () => toDataStore(storeB));
    const afterSwap = runtime.getSnapshot();
    if (afterSwap.status !== 'ready') throw new Error('数据源切换未完成');
    const idOnB = afterSwap.store.getSnapshot().lineups[0].id;

    // 旧数据源 A 继续写入并发出通知：快照必须保持为 B 的数据。
    storeA.saveLineup({ ...storeA.getSnapshot().lineups[0], name: 'A 的晚到写入' });
    const current = runtime.getSnapshot();
    if (current.status !== 'ready') throw new Error('数据源状态错误');
    expect(current.data.lineups[0].id).toBe(idOnB);
    expect(current.data.lineups[0].name).not.toBe('A 的晚到写入');
  });

  it('数据源切换失败后，重新读取按当前数据源重试', async () => {
    const { storage } = createDiskStorage();
    const deps = {
      storage,
      catalog: players,
      id: randomUUID,
      clock: () => new Date(),
      randomSeed: () => 314159,
    };
    const runtime = createGuestRuntime(async () => toDataStore(createGuestStore(deps)));
    await runtime.initialize();
    expect(runtime.getSnapshot().status).toBe('ready');

    let attempts = 0;
    const flaky = async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('首次加载失败');
      return toDataStore(createGuestStore(deps));
    };
    await expect(runtime.swap(flaky)).rejects.toThrow('首次加载失败');
    expect(runtime.getSnapshot().status).toBe('failed');

    await runtime.initialize();
    const recovered = runtime.getSnapshot();
    expect(recovered.status).toBe('ready');
    expect(attempts).toBe(2);
  });

  it('refreshAsync 等待数据源刷新并拿到服务器上的新数据', async () => {
    const { storage } = createDiskStorage();
    const server = await startTestApiServer();
    try {
      let lineups: unknown[] = [];
      server.respond('GET', '/api/v1/players', async () => ({ status: 200, body: players }));
      server.respond('GET', '/api/v1/lineups', async () => ({ status: 200, body: lineups }));
      server.respond('GET', '/api/v1/simulations?limit=30&offset=0', async () => ({
        status: 200,
        body: [],
      }));
      const api = createApiClient({
        baseUrl: server.baseUrl,
        http: createFetchHttpPort(),
        storage,
        clock: () => new Date(),
      });
      const store = await createAccountStore({
        api,
        storage,
        id: randomUUID,
        clock: () => new Date(),
        user: { id: 'user-1', username: '球员甲', displayName: '球员甲', admin: false },
        onUnauthorized: () => {},
      });
      const runtime = createGuestRuntime(async () => store);
      await runtime.initialize();
      const before = runtime.getSnapshot();
      if (before.status !== 'ready') throw new Error('账号数据源初始化未完成');
      expect(before.data.lineups).toHaveLength(0);

      lineups = [
        {
          id: 'lineup-imported',
          name: '导入的阵容',
          description: '',
          members: [],
          createdAt: '2026-10-14T00:00:00.000Z',
          updatedAt: '2026-10-14T00:00:00.000Z',
        },
      ];
      await runtime.refreshAsync();
      const after = runtime.getSnapshot();
      if (after.status !== 'ready') throw new Error('账号数据源状态错误');
      expect(after.data.lineups.map((item) => item.id)).toEqual(['lineup-imported']);
    } finally {
      await server.close();
    }
  });

  it('API 地址配置接受空值和完整地址，非法配置直接返回错误', () => {
    expect(() => validateApiBaseUrl('')).not.toThrow();
    expect(() => validateApiBaseUrl('https://api.example.com/api/v1')).not.toThrow();
    expect(() => validateApiBaseUrl('/api/v1')).toThrow('完整的 HTTP 或 HTTPS');
  });
});
