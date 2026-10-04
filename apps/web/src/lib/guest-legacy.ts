import {
  GUEST_WORKSPACE_SCHEMA_VERSION,
  LEGACY_LINEUPS_KEY,
  LEGACY_PLAYERS_KEY,
  LEGACY_SIMULATIONS_KEY,
  type Clock,
  type GuestWorkspace,
  type IdGenerator,
  type StoragePort,
} from '@dream-court/client';
import type { Lineup, Player, Simulation } from '@dream-court/core';

interface LegacyDeps {
  storage: StoragePort;
  id: IdGenerator;
  clock: Clock;
}

function readLegacyCollection<T>(storage: StoragePort, key: string): T[] {
  const saved = storage.getItem(key);
  return saved ? (JSON.parse(saved) as T[]) : [];
}

/**
 * 旧版本（分散的 localStorage 键）向统一游客工作区的一次性迁移。
 * 这是浏览器专属行为，因此留在 Web 应用内并通过注入交给 client。
 */
export function loadLegacyWorkspace(deps: LegacyDeps): GuestWorkspace {
  const players = readLegacyCollection<Player>(deps.storage, LEGACY_PLAYERS_KEY);
  const lineups = readLegacyCollection<Lineup>(deps.storage, LEGACY_LINEUPS_KEY);
  const simulations = readLegacyCollection<Simulation>(deps.storage, LEGACY_SIMULATIONS_KEY);
  // 先生成工作区身份再删除旧键：身份生成失败时旧数据保持原样，用户可重试迁移。
  const id = deps.id();
  const timestamp = deps.clock().toISOString();

  deps.storage.removeItem(LEGACY_PLAYERS_KEY);
  deps.storage.removeItem(LEGACY_LINEUPS_KEY);
  deps.storage.removeItem(LEGACY_SIMULATIONS_KEY);

  return {
    id,
    schemaVersion: GUEST_WORKSPACE_SCHEMA_VERSION,
    createdAt: timestamp,
    updatedAt: timestamp,
    hasUserProgress: players.length > 0 || lineups.length > 0 || simulations.length > 0,
    players,
    lineups,
    simulations,
  };
}
