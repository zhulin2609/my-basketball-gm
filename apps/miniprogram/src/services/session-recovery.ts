import {
  createApiClient,
  SESSION_STORAGE_KEY,
  type ApiClient,
  type ApiTransport,
  type AuthSession,
} from '@dream-court/client';
import type { DataStore } from './data-store';
import type { createGuestRuntime } from './guest-runtime';

/** 账号数据源始终携带自己的会话；失效通知由宿主核验当前会话。 */
export function createSessionScopedApi(session: AuthSession, transport: ApiTransport): ApiClient {
  const sessionJson = JSON.stringify(session);
  return createApiClient({
    ...transport,
    storage: {
      getItem: (key) =>
        key === SESSION_STORAGE_KEY ? sessionJson : transport.storage.getItem(key),
      setItem: (key, value) => {
        if (key !== SESSION_STORAGE_KEY) transport.storage.setItem(key, value);
      },
      removeItem: (key) => {
        if (key !== SESSION_STORAGE_KEY) transport.storage.removeItem(key);
      },
    },
  });
}

/** 同步隔离旧视图；后续游客加载失败由 runtime 的 failed 状态呈现。 */
export function recoverUnauthorizedSession(
  token: string,
  api: ApiClient,
  runtime: ReturnType<typeof createGuestRuntime>,
  loadGuest: () => Promise<DataStore>,
): void {
  if (!api.isCurrentSession(token)) return;
  api.clearSession();
  void runtime.swap(loadGuest).catch((error: unknown) => console.error(error));
}
