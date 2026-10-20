import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createGuestImportRequest, createGuestRepositories } from '@dream-court/client';
import { players } from '@dream-court/core/catalog';
import {
  startTestApiServer,
  testApi,
  register,
  sql,
  type TestApiServer,
} from '@dream-court/client/testing/local-api-server';
import { createDiskStorage } from './testing/disk-storage';
import { createGuestStore, DRAFTS_KEY } from './guest-store';
import { importGuestSnapshot } from './guest-import';
let server: TestApiServer;
beforeEach(async () => {
  server = await startTestApiServer();
});
afterEach(async () => {
  await server.close();
});
async function environment() {
  const { storage } = createDiskStorage();
  const fixed = new Date();
  const deps = {
    storage,
    clock: () => fixed,
    id: randomUUID,
    catalog: players,
    randomSeed: () => 42,
  };
  const store = createGuestStore(deps);
  const lineup = store.getSnapshot().lineups[0];
  store.saveLineup({ ...lineup, name: '待导入' });
  const repositories = createGuestRepositories(deps);
  const api = testApi(server.baseUrl, storage);
  const session = await register(api);
  return { ...deps, api, store, repositories, session, lineup };
}
it('首次导入保存真实数据并清理已确认快照', async () => {
  const env = await environment();
  await expect(importGuestSnapshot(env)).resolves.toBe('imported');
  expect(env.repositories.workspace.peek()).toBeNull();
  expect((await env.api.listLineups()).some((l) => l.name === '待导入')).toBe(true);
});
it('同内容成功重试仍幂等，修改内容重试明确拒绝且不清理', async () => {
  const env = await environment();
  const workspace = env.repositories.workspace.peek()!;
  const request = createGuestImportRequest(workspace, players);
  expect((await env.api.importGuestWorkspace(request)).alreadyImported).toBe(false);
  expect((await env.api.importGuestWorkspace(request)).alreadyImported).toBe(true);
  env.store.saveLineup({ ...env.lineup, name: '新的编辑' });
  await expect(importGuestSnapshot(env)).rejects.toMatchObject({
    status: 409,
    code: 'GUEST_IMPORT_CONTENT_CONFLICT',
  });
  expect(env.repositories.workspace.peek()?.lineups.some((l) => l.name === '新的编辑')).toBe(true);
  expect((await env.api.listLineups()).some((l) => l.name === '新的编辑')).toBe(false);
});
it('未保存草稿阻止导入且原样保留', async () => {
  const env = await environment();
  env.store.saveDraft({ ...env.lineup, name: '未保存草稿' });
  const before = env.storage.getItem(DRAFTS_KEY);
  await expect(importGuestSnapshot(env)).rejects.toThrow('先保存');
  expect(env.storage.getItem(DRAFTS_KEY)).toBe(before);
  expect(server.requests.some((r) => r.path === '/api/v1/guest-imports')).toBe(false);
});
it.each(['workspace', 'draft', 'session'] as const)(
  '导入等待期间 %s 变化保留本地内容',
  async (change) => {
    const env = await environment();
    const gate = server.pauseResponse('POST', '/api/v1/guest-imports');
    const importing = importGuestSnapshot(env);
    await gate.arrived;
    if (change === 'workspace') env.store.saveLineup({ ...env.lineup, name: '同时间戳的新编辑' });
    if (change === 'draft') env.store.saveDraft({ ...env.lineup, name: '新的草稿' });
    if (change === 'session') {
      env.api.clearSession();
      await register(env.api);
    }
    gate.release();
    await importing;
    expect(env.repositories.workspace.peek()).not.toBeNull();
    if (change === 'draft') expect(env.store.readDraft(env.lineup.id)?.name).toBe('新的草稿');
    if (change === 'workspace')
      expect(
        env.repositories.workspace.peek()?.lineups.some((l) => l.name === '同时间戳的新编辑'),
      ).toBe(true);
  },
);
it('历史无内容记录和其他账号重试均拒绝，并保留本地内容', async () => {
  const env = await environment();
  const workspace = env.repositories.workspace.peek()!;
  const request = createGuestImportRequest(workspace, players);
  await env.api.importGuestWorkspace(request);
  sql(
    `UPDATE guest_imports SET request_payload = null WHERE guest_workspace_id = '${workspace.id}'`,
  );
  await expect(importGuestSnapshot(env)).rejects.toMatchObject({
    status: 409,
    code: 'GUEST_IMPORT_CONTENT_CONFLICT',
  });
  env.api.clearSession();
  await register(env.api);
  await expect(importGuestSnapshot(env)).rejects.toMatchObject({ status: 409 });
  expect(env.repositories.workspace.peek()).not.toBeNull();
  expect(await env.api.listLineups()).toHaveLength(0);
});
it('相同内容并发导入只写入一次', async () => {
  const env = await environment();
  const workspace = env.repositories.workspace.peek()!;
  const request = createGuestImportRequest(workspace, players);
  const responses = await Promise.all([
    env.api.importGuestWorkspace(request),
    env.api.importGuestWorkspace(request),
  ]);
  expect(responses.map((r) => r.alreadyImported).sort()).toEqual([false, true]);
  expect((await env.api.listLineups()).length).toBe(workspace.lineups.length);
});
it('已成功但本地保留的同内容重试可以清理，战报时间字段可持久化', async () => {
  const env = await environment();
  const lineups = env.store.getSnapshot().lineups;
  env.store.runBattle(lineups[0].id, lineups[1].id);
  const workspace = env.repositories.workspace.peek()!;
  const request = createGuestImportRequest(workspace, players);
  expect((await env.api.importGuestWorkspace(request)).simulationCount).toBe(1);
  await expect(importGuestSnapshot(env)).resolves.toBe('imported');
  expect(env.repositories.workspace.peek()).toBeNull();
  expect(await env.api.listSimulations()).toHaveLength(1);
});
it('不同内容并发导入只允许一个内容成功，失败内容不覆盖数据库', async () => {
  const env = await environment();
  const request = createGuestImportRequest(env.repositories.workspace.peek()!, players);
  const modified = {
    ...request,
    lineups: request.lineups.map((l) => ({ ...l, lineup: { ...l.lineup, name: '并发新内容' } })),
  };
  const results = await Promise.allSettled([
    env.api.importGuestWorkspace(request),
    env.api.importGuestWorkspace(modified),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  const failure = results.find((r) => r.status === 'rejected');
  expect(failure).toMatchObject({
    status: 'rejected',
    reason: { status: 409, code: 'GUEST_IMPORT_CONTENT_CONFLICT' },
  });
  expect(await env.api.listLineups()).toHaveLength(request.lineups.length);
  expect(env.repositories.workspace.peek()).not.toBeNull();
});
