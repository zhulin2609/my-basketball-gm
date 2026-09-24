import type { Lineup, Player, Simulation } from '@/types';
import { createIdentifier } from '@/lib/identifier';

const GUEST_WORKSPACE_KEY = 'dream-court.guest-workspace.v1';
const GUEST_WORKSPACE_SCHEMA_VERSION = 1;
const LEGACY_LINEUPS_KEY = 'dream-court.lineups.v1';
const LEGACY_PLAYERS_KEY = 'dream-court.players.v1';
const LEGACY_SIMULATIONS_KEY = 'dream-court.games.v1';

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

function createWorkspace(): GuestWorkspace {
  const timestamp = new Date().toISOString();
  return {
    id: createIdentifier(),
    schemaVersion: GUEST_WORKSPACE_SCHEMA_VERSION,
    createdAt: timestamp,
    updatedAt: timestamp,
    hasUserProgress: false,
    players: [],
    lineups: [],
    simulations: [],
  };
}

function readLegacyCollection<T>(key: string): T[] {
  const saved = localStorage.getItem(key);
  return saved ? (JSON.parse(saved) as T[]) : [];
}

function migrateLegacyWorkspace(): GuestWorkspace {
  const players = readLegacyCollection<Player>(LEGACY_PLAYERS_KEY);
  const lineups = readLegacyCollection<Lineup>(LEGACY_LINEUPS_KEY);
  const simulations = readLegacyCollection<Simulation>(LEGACY_SIMULATIONS_KEY);
  const workspace = {
    ...createWorkspace(),
    players,
    lineups,
    simulations,
    hasUserProgress: players.length > 0 || lineups.length > 0 || simulations.length > 0,
  };

  localStorage.removeItem(LEGACY_PLAYERS_KEY);
  localStorage.removeItem(LEGACY_LINEUPS_KEY);
  localStorage.removeItem(LEGACY_SIMULATIONS_KEY);
  return workspace;
}

function persistWorkspace(workspace: GuestWorkspace): GuestWorkspace {
  localStorage.setItem(GUEST_WORKSPACE_KEY, JSON.stringify(workspace));
  return workspace;
}

function updateWorkspace(
  changes: Partial<Pick<GuestWorkspace, 'players' | 'lineups' | 'simulations'>>,
  markUserProgress: boolean,
): GuestWorkspace {
  const workspace = guestWorkspaceRepository.load();
  return persistWorkspace({
    ...workspace,
    ...changes,
    hasUserProgress: workspace.hasUserProgress || markUserProgress,
    updatedAt: new Date().toISOString(),
  });
}

export const guestWorkspaceRepository = {
  load(): GuestWorkspace {
    const saved = localStorage.getItem(GUEST_WORKSPACE_KEY);
    if (saved) return JSON.parse(saved) as GuestWorkspace;

    const workspace = migrateLegacyWorkspace();
    return persistWorkspace(workspace);
  },
  savePlayers(players: Player[], markUserProgress = true): GuestWorkspace {
    return updateWorkspace({ players }, markUserProgress);
  },
  saveLineups(lineups: Lineup[], markUserProgress = true): GuestWorkspace {
    return updateWorkspace({ lineups }, markUserProgress);
  },
  saveSimulations(simulations: Simulation[], markUserProgress = true): GuestWorkspace {
    return updateWorkspace({ simulations }, markUserProgress);
  },
  summary(): GuestWorkspaceSummary {
    const workspace = this.load();
    return {
      playerCount: workspace.players.length,
      lineupCount: workspace.lineups.length,
      simulationCount: workspace.simulations.length,
      updatedAt: workspace.updatedAt,
    };
  },
  clear(): void {
    localStorage.removeItem(GUEST_WORKSPACE_KEY);
  },
};
