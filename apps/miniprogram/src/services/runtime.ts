import { useSyncExternalStore } from 'react';
import { players as catalogPlayers } from '@dream-court/core/catalog';
import { mergePlayerCatalog } from '@dream-court/core';
import {
  ApiError,
  createApiClient,
  createGuestImportRequest,
  createGuestRepositories,
  SESSION_STORAGE_KEY,
  type ApiClient,
  type AuthSession,
  type StoragePort,
} from '@dream-court/client';
import { miniStorage } from '@/platform/storage';
import { miniHttp } from '@/platform/http';
import { createIdentifier, prepareIdentifiers } from '@/platform/identifier';
import { clearGuestDrafts, createGuestStore } from '@/services/guest-store';
import { createAccountStore } from '@/services/account-store';
import { createGuestRuntime, toDataStore, type RuntimeSnapshot } from '@/services/guest-runtime';
import type { DataStore } from '@/services/data-store';
import { getApiBaseUrl } from '@/config/env';

const clock = () => new Date();

/** 小程序端的公共 API 客户端；会话读写使用本机存储，401 时由 client 清除会话。 */
export const api = createApiClient({
  baseUrl: getApiBaseUrl(),
  http: miniHttp,
  storage: miniStorage,
  clock,
});

/**
 * 绑定到单个会话的 API 客户端：请求始终携带创建时的会话；
 * 401 清理只在全局会话仍是该会话时生效，旧会话的失败不会影响新会话。
 */
function createSessionScopedApi(session: AuthSession): ApiClient {
  const sessionJson = JSON.stringify(session);
  const scopedStorage: StoragePort = {
    getItem: (key) => (key === SESSION_STORAGE_KEY ? sessionJson : miniStorage.getItem(key)),
    setItem: (key, value) => {
      if (key !== SESSION_STORAGE_KEY) miniStorage.setItem(key, value);
    },
    removeItem: (key) => {
      if (key === SESSION_STORAGE_KEY) {
        if (api.readSession()?.accessToken === session.accessToken) api.clearSession();
        return;
      }
      miniStorage.removeItem(key);
    },
  };
  return createApiClient({
    baseUrl: getApiBaseUrl(),
    http: miniHttp,
    storage: scopedStorage,
    clock,
  });
}

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
    api: createSessionScopedApi(session),
    storage: miniStorage,
    id: createIdentifier,
    clock,
    user: session.user,
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
      await runtime.swap(loadGuestStore);
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

/** 导入本机游客工作区；成功后清空游客存档与对应的本地草稿。没有游客进度时直接返回。 */
export async function importGuestProgress(): Promise<'empty' | 'imported'> {
  const repositories = createGuestRepositories({
    storage: miniStorage,
    id: createIdentifier,
    clock,
  });
  const workspace = repositories.workspace.peek();
  if (!workspace || !workspace.hasUserProgress) return 'empty';
  const players = mergePlayerCatalog(catalogPlayers, repositories.players.list());
  await api.importGuestWorkspace(createGuestImportRequest(workspace, players));
  repositories.workspace.clear();
  clearGuestDrafts(miniStorage);
  return 'imported';
}
