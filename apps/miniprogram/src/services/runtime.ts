import { useSyncExternalStore } from 'react';
import { players } from '@dream-court/core/catalog';
import { miniStorage } from '@/platform/storage';
import { createIdentifier, prepareIdentifiers } from '@/platform/identifier';
import { createGuestStore } from '@/services/guest-store';
import { createGuestRuntime, type RuntimeSnapshot } from '@/services/guest-runtime';
import { getApiBaseUrl } from '@/config/env';

const runtime = createGuestRuntime(async () => {
  getApiBaseUrl();
  await prepareIdentifiers();
  return createGuestStore({
    storage: miniStorage,
    id: createIdentifier,
    clock: () => new Date(),
    randomSeed: () => Math.floor(Math.random() * 2 ** 31),
    catalog: players,
  });
});

export const initializeRuntime = runtime.initialize;
export const refreshRuntime = runtime.refresh;

export function useGuestRuntime(): RuntimeSnapshot {
  return useSyncExternalStore(runtime.subscribe, runtime.getSnapshot);
}
