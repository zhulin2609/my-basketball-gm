import {
  createApiClient,
  createBattleService,
  createFetchHttpPort,
  createGuestRepositories,
  createLineupSaveQueue,
  type Clock,
  type HttpPort,
  type IdGenerator,
  type RandomSeed,
  type StoragePort,
} from '@dream-court/client';
import { mergePlayerCatalog, type Player } from '@dream-court/core';
import { players as catalogPlayers } from '@dream-court/core/catalog';
import { loadLegacyWorkspace } from '@/lib/guest-legacy';
import { createIdentifier } from '@/lib/identifier';

/** Web 平台的 API 地址；未配置时保持原有的离线演示行为。 */
const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

/** When unset, the product keeps the original offline demo storage behavior. */
export const isApiEnabled = Boolean(baseUrl);

/** Web 的同步存储实现。 */
export const browserStorage: StoragePort = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
};

/** Web 的 HTTP 传输实现（fetch）；协议细节（请求头、错误解析）由 client 统一处理。 */
export const fetchHttp: HttpPort = createFetchHttpPort();

interface WebPorts {
  storage: StoragePort;
  id: IdGenerator;
  clock: Clock;
  randomSeed: RandomSeed;
}

export const ports: WebPorts = {
  storage: browserStorage,
  id: createIdentifier,
  clock: () => new Date(),
  // 与原实现保持一致的种子取值范围，保证旧战报的 seed 语义不变。
  randomSeed: () => Math.floor(Math.random() * 2 ** 31),
};

export const api = createApiClient({
  baseUrl: baseUrl ?? '',
  http: fetchHttp,
  storage: browserStorage,
  clock: ports.clock,
});

export const repositories = createGuestRepositories({
  ...ports,
  loadLegacyWorkspace: () => loadLegacyWorkspace(ports),
});

export const lineupSaveQueue = createLineupSaveQueue((lineup) => api.saveLineup(lineup));

export const battleService = createBattleService({
  api,
  repositories,
  ...ports,
});

/** 游客模式的完整球员列表：公共目录套用用户覆盖，用户创建的球员附加在后。 */
export const listPlayers = (): Player[] =>
  mergePlayerCatalog(catalogPlayers, repositories.players.list());
