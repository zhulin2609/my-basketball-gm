import type { Lineup, Player, Simulation } from '@dream-court/core';
import type { Clock, IdGenerator, StoragePort } from './ports';

export const GUEST_WORKSPACE_KEY = 'dream-court.guest-workspace.v1';
export const GUEST_WORKSPACE_SCHEMA_VERSION = 1;
/** 旧版本分散存储的键名；迁移逻辑由 Web 应用提供并注入，键名集中在这里维护。 */
export const LEGACY_LINEUPS_KEY = 'dream-court.lineups.v1';
export const LEGACY_PLAYERS_KEY = 'dream-court.players.v1';
export const LEGACY_SIMULATIONS_KEY = 'dream-court.games.v1';

export interface GuestWorkspace {
  id: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  hasUserProgress: boolean;
  players: Player[];
  lineups: Lineup[];
  simulations: Simulation[];
}

export interface GuestWorkspaceSummary {
  playerCount: number;
  lineupCount: number;
  simulationCount: number;
  updatedAt: string;
}

/**
 * 没有可读工作区时的兜底来源：Web 注入旧浏览器存储键的迁移实现，
 * 其他客户端可以不提供，此时创建全新工作区。
 */
export type LegacyWorkspaceLoader = () => GuestWorkspace | null;

export interface GuestWorkspaceDeps {
  storage: StoragePort;
  id: IdGenerator;
  clock: Clock;
  loadLegacyWorkspace?: LegacyWorkspaceLoader;
}

export interface GuestWorkspaceRepository {
  load(): GuestWorkspace;
  savePlayers(players: Player[], markUserProgress?: boolean): GuestWorkspace;
  saveLineups(lineups: Lineup[], markUserProgress?: boolean): GuestWorkspace;
  saveSimulations(simulations: Simulation[], markUserProgress?: boolean): GuestWorkspace;
  summary(): GuestWorkspaceSummary;
  clear(): void;
}

export function createGuestWorkspaceRepository(deps: GuestWorkspaceDeps): GuestWorkspaceRepository {
  const createWorkspace = (): GuestWorkspace => {
    const timestamp = deps.clock().toISOString();
    return {
      id: deps.id(),
      schemaVersion: GUEST_WORKSPACE_SCHEMA_VERSION,
      createdAt: timestamp,
      updatedAt: timestamp,
      hasUserProgress: false,
      players: [],
      lineups: [],
      simulations: [],
    };
  };

  const persistWorkspace = (workspace: GuestWorkspace): GuestWorkspace => {
    deps.storage.setItem(GUEST_WORKSPACE_KEY, JSON.stringify(workspace));
    return workspace;
  };

  const updateWorkspace = (
    changes: Partial<Pick<GuestWorkspace, 'players' | 'lineups' | 'simulations'>>,
    markUserProgress: boolean,
  ): GuestWorkspace => {
    const workspace = load();
    return persistWorkspace({
      ...workspace,
      ...changes,
      hasUserProgress: workspace.hasUserProgress || markUserProgress,
      updatedAt: deps.clock().toISOString(),
    });
  };

  function load(): GuestWorkspace {
    const saved = deps.storage.getItem(GUEST_WORKSPACE_KEY);
    if (saved) return JSON.parse(saved) as GuestWorkspace;
    return persistWorkspace(deps.loadLegacyWorkspace?.() ?? createWorkspace());
  }

  return {
    load,
    savePlayers(players, markUserProgress = true) {
      return updateWorkspace({ players }, markUserProgress);
    },
    saveLineups(lineups, markUserProgress = true) {
      return updateWorkspace({ lineups }, markUserProgress);
    },
    saveSimulations(simulations, markUserProgress = true) {
      return updateWorkspace({ simulations }, markUserProgress);
    },
    summary() {
      const workspace = load();
      return {
        playerCount: workspace.players.length,
        lineupCount: workspace.lineups.length,
        simulationCount: workspace.simulations.length,
        updatedAt: workspace.updatedAt,
      };
    },
    clear(): void {
      deps.storage.removeItem(GUEST_WORKSPACE_KEY);
    },
  };
}
