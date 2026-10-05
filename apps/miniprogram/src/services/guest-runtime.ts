import type { GuestSnapshot, GuestStore } from './guest-store';

export type RuntimeSnapshot =
  | { status: 'loading' }
  | { status: 'failed'; error: unknown }
  | { status: 'ready'; store: GuestStore; data: GuestSnapshot };

export function createGuestRuntime(loadStore: () => Promise<GuestStore>) {
  let snapshot: RuntimeSnapshot = { status: 'loading' };
  let initializing: Promise<void> | undefined;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    initialize(): Promise<void> {
      if (snapshot.status === 'ready') return Promise.resolve();
      if (initializing) return initializing;
      snapshot = { status: 'loading' };
      notify();
      initializing = Promise.resolve()
        .then(loadStore)
        .then((store) => {
          store.subscribe(() => {
            snapshot = { status: 'ready', store, data: store.getSnapshot() };
            notify();
          });
          snapshot = { status: 'ready', store, data: store.getSnapshot() };
          notify();
        })
        .catch((error: unknown) => {
          initializing = undefined;
          snapshot = { status: 'failed', error };
          notify();
          throw error;
        });
      return initializing;
    },
    refresh() {
      if (snapshot.status === 'ready') snapshot.store.refresh();
    },
  };
}
