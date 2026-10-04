import type { AuthSession } from './contracts';
import type { Clock, StoragePort } from './ports';

export const SESSION_STORAGE_KEY = 'dream-court.auth-session.v1';

export interface SessionStoreDeps {
  storage: StoragePort;
  clock: Clock;
}

export interface SessionStore {
  read(): AuthSession | null;
  save(session: AuthSession): void;
  clear(): void;
}

/**
 * 会话凭据的读写与过期校验。键名保持历史值，旧浏览器存档无需迁移；
 * 解析失败或已过期的会话被立即清除并视为未登录。
 * 过期判断使用注入的时钟，client 不直接访问平台时间。
 */
export function createSessionStore(deps: SessionStoreDeps): SessionStore {
  const read = (): AuthSession | null => {
    try {
      const raw = deps.storage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as AuthSession;
      const expiresAt = Date.parse(session.expiresAt);
      const isUsable =
        session.tokenType === 'Bearer' &&
        typeof session.accessToken === 'string' &&
        Boolean(session.user?.id) &&
        Number.isFinite(expiresAt) &&
        expiresAt > deps.clock().getTime();
      if (!isUsable) {
        clear();
        return null;
      }
      return session;
    } catch {
      clear();
      return null;
    }
  };

  const save = (session: AuthSession) => {
    deps.storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  };

  const clear = () => {
    deps.storage.removeItem(SESSION_STORAGE_KEY);
  };

  return { read, save, clear };
}
