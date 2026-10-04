import type { Lineup, Player, Simulation } from '@dream-court/core';
import {
  createGuestWorkspaceRepository,
  type GuestWorkspace,
  type GuestWorkspaceDeps,
  type GuestWorkspaceRepository,
  type GuestWorkspaceSummary,
} from './guest-workspace';

export interface GuestRepositories {
  workspace: GuestWorkspaceRepository;
  lineups: {
    list(): Lineup[];
    save(lineup: Lineup, markUserProgress?: boolean): Lineup;
    remove(id: string): void;
  };
  simulations: {
    list(): Simulation[];
    save(game: Simulation): Simulation;
  };
  players: {
    list(): Player[];
    save(player: Player): Player;
  };
  /** 仅在没有任何阵容时写入内置示例；示例不计入用户实际进度。 */
  bootstrap(presets: Lineup[]): Lineup[];
}

/** 战报上限：与既有协议保持一致，最新 20 场。 */
const MAX_LOCAL_SIMULATIONS = 20;
const SIMULATION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export function createGuestRepositories(deps: GuestWorkspaceDeps): GuestRepositories {
  const workspace = createGuestWorkspaceRepository(deps);

  const lineups = {
    // repository 是 UI 和本地存储之间的边界；组件不直接访问存储。
    list(): Lineup[] {
      return workspace.load().lineups;
    },
    save(lineup: Lineup, markUserProgress = true): Lineup {
      const all = this.list();
      const index = all.findIndex((item) => item.id === lineup.id);
      if (index < 0) all.unshift(lineup);
      else all[index] = lineup;
      workspace.saveLineups(all, markUserProgress);
      return lineup;
    },
    remove(id: string) {
      workspace.saveLineups(this.list().filter((item) => item.id !== id));
    },
  };

  const simulations = {
    list(): Simulation[] {
      const reports = workspace.load().simulations as Array<
        Omit<Simulation, 'expiresAt'> & { expiresAt?: string }
      >;
      const now = deps.clock().getTime();
      const activeReports = reports
        .map((report) => ({
          ...report,
          expiresAt:
            report.expiresAt ??
            new Date(new Date(report.createdAt).getTime() + SIMULATION_RETENTION_MS).toISOString(),
        }))
        .filter((report) => new Date(report.expiresAt).getTime() > now);

      // 读取时移除已过期的本地战报；API 模式从不写入这份存储。
      if (activeReports.length !== reports.length) {
        workspace.saveSimulations(activeReports, false);
      }
      return activeReports;
    },
    save(game: Simulation): Simulation {
      workspace.saveSimulations([game, ...this.list()].slice(0, MAX_LOCAL_SIMULATIONS));
      return game;
    },
  };

  const players = {
    // 仅保存用户创建的球员或对种子档案的覆盖，避免把整份默认球员库重复写入本地存储。
    list(): Player[] {
      return workspace.load().players;
    },
    save(player: Player): Player {
      const all = this.list();
      const index = all.findIndex((item) => item.id === player.id);
      if (index < 0) all.unshift(player);
      else all[index] = player;
      workspace.savePlayers(all);
      return player;
    },
  };

  function bootstrap(presets: Lineup[]): Lineup[] {
    if (lineups.list().length) return lineups.list();
    workspace.saveLineups(presets, false);
    return lineups.list();
  }

  return { workspace, lineups, simulations, players, bootstrap };
}

export type { GuestWorkspace, GuestWorkspaceRepository, GuestWorkspaceSummary };
