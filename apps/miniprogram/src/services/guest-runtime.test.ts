import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { players } from '@dream-court/core/catalog';
import { createGuestRuntime } from './guest-runtime';
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
    const runtime = createGuestRuntime(async () => store);
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
    const runtime = createGuestRuntime(async () => createGuestStore(deps));
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
    const created = ready.store.createLineup();
    const refreshed = runtime.getSnapshot();
    if (refreshed.status !== 'ready') throw new Error('游客服务状态错误');
    expect(refreshed.data.lineups[0].id).toBe(created.id);
  });

  it('API 地址配置接受空值和完整地址，非法配置直接返回错误', () => {
    expect(() => validateApiBaseUrl('')).not.toThrow();
    expect(() => validateApiBaseUrl('https://api.example.com/api/v1')).not.toThrow();
    expect(() => validateApiBaseUrl('/api/v1')).toThrow('完整的 HTTP 或 HTTPS');
  });
});
