import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createApiClient, createFetchHttpPort } from '@dream-court/client';
import { players } from '@dream-court/core/catalog';
import {
  startTestApiServer,
  register,
  type TestApiServer,
} from '@dream-court/client/testing/local-api-server';
import { createDiskStorage } from './testing/disk-storage';
import { createGuestRuntime, toDataStore } from './guest-runtime';
import { createGuestStore } from './guest-store';
import { createAccountStore } from './account-store';
import { recoverUnauthorizedSession, createSessionScopedApi } from './session-recovery';

let server: TestApiServer;
beforeEach(async () => {
  server = await startTestApiServer();
});
afterEach(async () => {
  await server.close();
});
async function environment() {
  const { storage } = createDiskStorage();
  let now = Date.now();
  const clock = () => new Date(now);
  const loadGuest = async () =>
    toDataStore(
      createGuestStore({ storage, clock, id: randomUUID, catalog: players, randomSeed: () => 42 }),
    );
  const runtime = createGuestRuntime(loadGuest);
  let notifications = 0;
  const api = createApiClient({
    baseUrl: server.baseUrl,
    storage,
    clock,
    http: createFetchHttpPort(),
    onUnauthorized: (token) => {
      notifications++;
      recoverUnauthorizedSession(token, api, runtime, loadGuest);
    },
  });
  const session = await register(api);
  const loadAccount = () =>
    createAccountStore({
      api,
      storage,
      clock,
      id: randomUUID,
      user: api.readSession()!.user,
      onUnauthorized: () => {},
    });
  await runtime.swap(loadAccount);
  return {
    api,
    runtime,
    session,
    loadAccount,
    storage,
    clock,
    loadGuest,
    advance: () => {
      now += 24 * 60 * 60 * 1000;
    },
    notifications: () => notifications,
  };
}
it.each(['identities', 'detail', 'save'] as const)(
  '真实 401 从 %s 路径立即隔离账号视图并恢复游客',
  async (path) => {
    const env = await environment();
    env.api.saveSession({ ...env.session, accessToken: randomUUID() });
    const before = env.runtime.getSnapshot();
    if (before.status !== 'ready') throw new Error('账号未加载');
    const request =
      path === 'identities'
        ? env.api.listIdentities()
        : path === 'detail'
          ? env.api.getSimulation(randomUUID())
          : before.store.createLineup();
    await expect(request).rejects.toMatchObject({ status: 401 });
    expect(env.api.readSession()).toBeNull();
    await expect
      .poll(() => env.runtime.getSnapshot())
      .toMatchObject({ status: 'ready', data: { source: 'guest' } });
    expect(env.notifications()).toBe(1);
  },
);
it('旧请求迟到 401 不清除新账号会话或快照', async () => {
  const env = await environment();
  env.api.saveSession({ ...env.session, accessToken: randomUUID() });
  const gate = server.pauseResponse('GET', '/api/v1/auth/identities');
  const old = env.api.listIdentities();
  const rejected = expect(old).rejects.toMatchObject({ status: 401 });
  await gate.arrived;
  env.api.clearSession();
  const next = await register(env.api);
  await env.runtime.swap(env.loadAccount);
  gate.release();
  await rejected;
  expect(env.api.readSession()?.user.id).toBe(next.user.id);
  expect(env.runtime.getSnapshot()).toMatchObject({
    status: 'ready',
    data: { source: 'account', user: { id: next.user.id } },
  });
  expect(env.notifications()).toBe(0);
});
it('同一会话并发 401 只触发一次恢复，匿名失败不清除后来登录的会话', async () => {
  const env = await environment();
  env.api.saveSession({ ...env.session, accessToken: randomUUID() });
  const results = await Promise.allSettled([
    env.api.listIdentities(),
    env.api.getSimulation(randomUUID()),
  ]);
  expect(results.every((r) => r.status === 'rejected')).toBe(true);
  expect(env.notifications()).toBe(1);
  const gate = server.pauseResponse('POST', '/api/v1/auth/login');
  const failed = expect(
    env.api.login({ username: 'missing', password: randomUUID() }),
  ).rejects.toMatchObject({ status: 401 });
  await gate.arrived;
  const next = await register(env.api);
  gate.release();
  await failed;
  expect(env.api.readSession()?.user.id).toBe(next.user.id);
  expect(env.notifications()).toBe(1);
});
it('在途请求跨过本地到期时间，401 仍通知运行时恢复游客', async () => {
  const env = await environment();
  env.api.saveSession({ ...env.session, accessToken: randomUUID() });
  const gate = server.pauseResponse('GET', '/api/v1/auth/identities');
  const failed = expect(env.api.listIdentities()).rejects.toMatchObject({ status: 401 });
  await gate.arrived;
  env.advance();
  gate.release();
  await failed;
  await expect
    .poll(() => env.runtime.getSnapshot())
    .toMatchObject({ status: 'ready', data: { source: 'guest' } });
  expect(env.notifications()).toBe(1);
});
it('账号专属客户端的迟到 401 不干扰已切换的新会话', async () => {
  const env = await environment();
  const stale = { ...env.session, accessToken: randomUUID() };
  env.api.saveSession(stale);
  const scoped = createSessionScopedApi(stale, {
    baseUrl: server.baseUrl,
    storage: env.storage,
    clock: env.clock,
    http: createFetchHttpPort(),
    onUnauthorized: (token) =>
      recoverUnauthorizedSession(token, env.api, env.runtime, env.loadGuest),
  });
  const gate = server.pauseResponse('GET', '/api/v1/auth/identities');
  const failed = expect(scoped.listIdentities()).rejects.toMatchObject({ status: 401 });
  await gate.arrived;
  env.api.clearSession();
  const next = await register(env.api);
  await env.runtime.swap(env.loadAccount);
  gate.release();
  await failed;
  expect(env.api.readSession()?.user.id).toBe(next.user.id);
  expect(env.runtime.getSnapshot()).toMatchObject({
    status: 'ready',
    data: { user: { id: next.user.id } },
  });
});
it('请求之前本机会话已到期，同步隔离账号视图并保留匿名 401', async () => {
  const env = await environment();
  env.advance();
  await expect(env.api.listIdentities()).rejects.toMatchObject({ status: 401 });
  await expect
    .poll(() => env.runtime.getSnapshot())
    .toMatchObject({ status: 'ready', data: { source: 'guest' } });
  expect(env.notifications()).toBe(1);
  expect(env.api.readSession()).toBeNull();
});
