import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { players } from '@dream-court/core/catalog';
import { createGuestRuntime } from './guest-runtime';
import { createGuestStore } from './guest-store';
import { createDiskStorage } from './testing/disk-storage';
import { validateApiBaseUrl } from '../config/env';

describe('游客初始化', () => {
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
