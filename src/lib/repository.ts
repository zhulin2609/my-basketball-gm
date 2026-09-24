import { players as seedPlayers } from '@/data/players';
import i18n from '@/i18n';
import { guestWorkspaceRepository } from '@/lib/guest-workspace';
import { createIdentifier } from '@/lib/identifier';
import type { Lineup, Player, Position, Simulation } from '@/types';

export const lineupRepository = {
  // repository 是 UI 和浏览器存储之间的边界；组件不直接访问 localStorage。
  list(): Lineup[] {
    return guestWorkspaceRepository.load().lineups;
  },
  save(lineup: Lineup, markUserProgress = true) {
    const all = this.list();
    const index = all.findIndex((item) => item.id === lineup.id);
    if (index < 0) all.unshift(lineup);
    else all[index] = lineup;
    guestWorkspaceRepository.saveLineups(all, markUserProgress);
    return lineup;
  },
  remove(id: string) {
    guestWorkspaceRepository.saveLineups(this.list().filter((item) => item.id !== id));
  },
};

export const simulationRepository = {
  list(): Simulation[] {
    const reports = guestWorkspaceRepository.load().simulations as Array<
      Omit<Simulation, 'expiresAt'> & { expiresAt?: string }
    >;
    const now = Date.now();
    const activeReports = reports
      .map((report) => ({
        ...report,
        expiresAt:
          report.expiresAt ??
          new Date(new Date(report.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }))
      .filter((report) => new Date(report.expiresAt).getTime() > now);

    // Reading also removes expired offline-demo reports; API mode never writes this repository.
    if (activeReports.length !== reports.length) {
      guestWorkspaceRepository.saveSimulations(activeReports, false);
    }
    return activeReports;
  },
  save(game: Simulation) {
    guestWorkspaceRepository.saveSimulations([game, ...this.list()].slice(0, 20));
    return game;
  },
};

export const playerRepository = {
  // 仅保存用户创建的球员或对种子档案的覆盖，避免把整份默认球员库重复写入浏览器。
  list(): Player[] {
    return guestWorkspaceRepository.load().players;
  },
  save(player: Player): Player {
    const all = this.list();
    const index = all.findIndex((item) => item.id === player.id);
    if (index < 0) all.unshift(player);
    else all[index] = player;
    guestWorkspaceRepository.savePlayers(all);
    return player;
  },
};

export function listPlayers(): Player[] {
  const savedPlayers = playerRepository.list();
  const savedById = new Map(savedPlayers.map((player) => [player.id, player]));
  const seedIds = new Set(seedPlayers.map((player) => player.id));

  return [
    ...seedPlayers.map((player) => savedById.get(player.id) ?? player),
    ...savedPlayers.filter((player) => !seedIds.has(player.id)),
  ];
}

export function starterLineup(): Lineup {
  const now = new Date().toISOString();
  return {
    id: createIdentifier(),
    name: i18n.t('defaults.dreamTeam'),
    description: i18n.t('defaults.dreamTeamDescription'),
    createdAt: now,
    updatedAt: now,
    members: ['curry', 'jordan', 'lebron', 'duncan', 'shaq'].map((playerId, index) => ({
      playerId,
      position: ['PG', 'SG', 'SF', 'PF', 'C'][index] as Position,
      starter: true,
      inactive: false,
    })),
  };
}

export function classicLineup(): Lineup {
  const now = new Date().toISOString();
  return {
    id: 'classic-five',
    name: i18n.t('defaults.classicFive'),
    description: i18n.t('defaults.classicDescription'),
    createdAt: now,
    updatedAt: now,
    members: ['magic', 'kobe', 'bird', 'garnett', 'olajuwon'].map((playerId, index) => ({
      playerId,
      position: ['PG', 'SG', 'SF', 'PF', 'C'][index] as Position,
      starter: true,
      inactive: false,
    })),
  };
}

export function bootstrapLineups() {
  // 仅在第一次使用时写入示例阵容，后续刷新不会覆盖用户编辑过的存档。
  if (!lineupRepository.list().length) {
    lineupRepository.save(classicLineup(), false);
    lineupRepository.save(starterLineup(), false);
  }
  return lineupRepository.list();
}
