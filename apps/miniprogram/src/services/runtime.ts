import { useSyncExternalStore } from 'react';
import { players as catalogPlayers } from '@dream-court/core/catalog';
import {
  ApiError,
  createApiClient,
  createGuestRepositories,
  type AuthSession,
} from '@dream-court/client';
import { miniStorage } from '@/platform/storage';
import { miniHttp } from '@/platform/http';
import { createIdentifier, prepareIdentifiers } from '@/platform/identifier';
import { createGuestStore } from '@/services/guest-store';
import { createAccountStore } from '@/services/account-store';
import { createGuestRuntime, toDataStore, type RuntimeSnapshot } from '@/services/guest-runtime';
import type { DataStore } from '@/services/data-store';
import { getApiBaseUrl } from '@/config/env';
import { recoverUnauthorizedSession, createSessionScopedApi } from '@/services/session-recovery';
import { importGuestSnapshot } from '@/services/guest-import';

const clock = () => new Date();

/** 小程序端的公共 API 客户端；会话读写使用本机存储，401 时由 client 清除会话。 */
export const api = createApiClient({
  baseUrl: getApiBaseUrl(),
  http: miniHttp,
  storage: miniStorage,
  clock,
  onUnauthorized: (token) => recoverUnauthorizedSession(token, api, runtime, loadGuestStore),
});

const loadGuestStore = async (): Promise<DataStore> => {
  await prepareIdentifiers();
  return toDataStore(
    createGuestStore({
      storage: miniStorage,
      id: createIdentifier,
      clock,
      randomSeed: () => Math.floor(Math.random() * 2 ** 31),
      catalog: catalogPlayers,
    }),
  );
};

const loadAccountStore = async (): Promise<DataStore> => {
  const session = api.readSession();
  if (!session) return loadGuestStore();
  return createAccountStore({
    api: createSessionScopedApi(session, {
      baseUrl: getApiBaseUrl(),
      http: miniHttp,
      storage: miniStorage,
      clock,
      onUnauthorized: (token) => recoverUnauthorizedSession(token, api, runtime, loadGuestStore),
    }),
    storage: miniStorage,
    id: createIdentifier,
    clock,
    user: session.user,
    onUnauthorized: () => {
      // 仅当全局会话没有切换到其他账号时才恢复游客工作区；旧会话的迟到 401 在此丢弃。
      recoverUnauthorizedSession(session.accessToken, api, runtime, loadGuestStore);
    },
  });
};

const runtime = createGuestRuntime(async () => {
  getApiBaseUrl();
  if (!api.readSession()) return loadGuestStore();
  try {
    return await loadAccountStore();
  } catch (error: unknown) {
    // 会话失效由 client 清除，回到游客工作区；其他错误原样展示并提供重试。
    if (error instanceof ApiError && error.status === 401) return loadGuestStore();
    throw error;
  }
});

export const initializeRuntime = runtime.initialize;

/** 页面切回时的后台刷新：401 恢复游客工作区，其他失败进入可重试的失败状态。 */
export const refreshRuntime = () => {
  void refreshRuntimeAsync();
};

export const refreshRuntimeAsync = async (): Promise<void> => {
  try {
    await runtime.refreshAsync();
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
      return;
    }
    runtime.fail(error);
  }
};

export function useGuestRuntime(): RuntimeSnapshot {
  return useSyncExternalStore(runtime.subscribe, runtime.getSnapshot);
}

/** 登录成功：保存会话并切换到绑定该会话的账号数据源。 */
export async function loginWithSession(session: AuthSession): Promise<void> {
  api.saveSession(session);
  await runtime.swap(loadAccountStore);
}

/** 退出登录：清除会话与账号内存数据，恢复独立游客工作区。 */
export async function logoutAccount(): Promise<void> {
  api.clearSession();
  await runtime.swap(loadGuestStore);
}

/** 只读判断本机是否存在游客进度；没有已保存的工作区时不创建。 */
export function hasGuestProgress(): boolean {
  const repositories = createGuestRepositories({
    storage: miniStorage,
    id: createIdentifier,
    clock,
  });
  return repositories.workspace.peek()?.hasUserProgress ?? false;
}

/**
 * 导入已保存的游客工作区；服务端确认内容一致，且本地快照、草稿、会话均未变化时清理。
 * 未保存的草稿阻止导入；请求等待期间出现的新内容保留在本机。
 */
export async function importGuestProgress(): Promise<'empty' | 'imported'> {
  return importGuestSnapshot({
    api,
    storage: miniStorage,
    id: createIdentifier,
    clock,
    catalog: catalogPlayers,
  });
}
