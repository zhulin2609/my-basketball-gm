import type { DataSnapshot, DataStore } from './data-store';
import type { GuestStore } from './guest-store';

export type RuntimeSnapshot =
  | { status: 'loading' }
  | { status: 'failed'; error: unknown }
  | { status: 'ready'; store: DataStore; data: DataSnapshot };

/** 游客的同步数据源包装成统一的异步接口，页面因此无需区分两种模式。 */
export function toDataStore(store: GuestStore): DataStore {
  return {
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    refresh: async () => store.refresh(),
    createLineup: async () => store.createLineup(),
    saveLineup: async (lineup) => store.saveLineup(lineup),
    readDraft: (id) => store.readDraft(id),
    saveDraft: (lineup) => store.saveDraft(lineup),
    runBattle: async (homeId, awayId) => store.runBattle(homeId, awayId),
  };
}

export function createGuestRuntime(loadStore: () => Promise<DataStore>) {
  let snapshot: RuntimeSnapshot = { status: 'loading' };
  let initializing: Promise<void> | undefined;
  let currentLoader = loadStore;
  let generation = 0;
  let attached: { store: DataStore; unsubscribe: () => void } | undefined;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());

  const attach = (store: DataStore) => {
    attached?.unsubscribe();
    const entry = { store, unsubscribe: () => {} };
    entry.unsubscribe = store.subscribe(() => {
      // 已切换数据源后，旧数据源的通知不再写回全局快照。
      if (attached !== entry) return;
      snapshot = { status: 'ready', store, data: store.getSnapshot() };
      notify();
    });
    attached = entry;
    snapshot = { status: 'ready', store, data: store.getSnapshot() };
    notify();
  };

  const load = (loader: () => Promise<DataStore>): Promise<void> => {
    const current = ++generation;
    snapshot = { status: 'loading' };
    notify();
    return Promise.resolve()
      .then(loader)
      .then((store) => {
        // 加载期间发生了更新的切换时，丢弃迟到的结果。
        if (current !== generation) return;
        attach(store);
      })
      .catch((error: unknown) => {
        if (current !== generation) return;
        snapshot = { status: 'failed', error };
        notify();
        throw error;
      });
  };

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    initialize(): Promise<void> {
      if (snapshot.status === 'ready') return Promise.resolve();
      if (initializing) return initializing;
      // 完成后释放进行中的 Promise：失败后的重试会按当前需要的数据源重新加载。
      initializing = load(currentLoader).then(
        () => {
          initializing = undefined;
        },
        (error: unknown) => {
          initializing = undefined;
          throw error;
        },
      );
      return initializing;
    },
    /** 切换数据源（登录、退出）：记录当前需要的数据源并加载；加载失败可经 initialize 重试。 */
    swap(loader: () => Promise<DataStore>): Promise<void> {
      currentLoader = loader;
      return load(loader);
    },
    /** 将运行期失败同步到页面状态，由 Screen 提供重新读取入口。 */
    fail(error: unknown) {
      snapshot = { status: 'failed', error };
      notify();
    },
    refresh() {
      if (snapshot.status === 'ready') {
        void snapshot.store.refresh().catch((error: unknown) => console.error(error));
      }
    },
    /** 等待数据源刷新完成；用于导入等绕过数据源自身的写入之后。 */
    refreshAsync(): Promise<void> {
      if (snapshot.status !== 'ready') return Promise.resolve();
      return snapshot.store.refresh();
    },
  };
}
