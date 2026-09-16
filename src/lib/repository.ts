import { players as seedPlayers } from '@/data/players';
import type { Lineup, Player, Position, Simulation } from '@/types';

// key 带版本号，未来本地存档结构升级时可执行迁移，而不是覆盖旧数据。
const LINEUPS_KEY = 'dream-court.lineups.v1';
const GAMES_KEY = 'dream-court.games.v1';
const PLAYERS_KEY = 'dream-court.players.v1';

export const lineupRepository = {
  // repository 是 UI 和浏览器存储之间的边界；组件不直接访问 localStorage。
  list(): Lineup[] {
    return JSON.parse(localStorage.getItem(LINEUPS_KEY) || '[]');
  },
  save(lineup: Lineup) {
    const all = this.list();
    const index = all.findIndex((item) => item.id === lineup.id);
    if (index < 0) all.unshift(lineup);
    else all[index] = lineup;
    localStorage.setItem(LINEUPS_KEY, JSON.stringify(all));
    return lineup;
  },
  remove(id: string) {
    localStorage.setItem(LINEUPS_KEY, JSON.stringify(this.list().filter((item) => item.id !== id)));
  },
};

export const simulationRepository = {
  list(): Simulation[] {
    const reports = JSON.parse(localStorage.getItem(GAMES_KEY) || '[]') as Array<
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
      localStorage.setItem(GAMES_KEY, JSON.stringify(activeReports));
    }
    return activeReports;
  },
  save(game: Simulation) {
    localStorage.setItem(GAMES_KEY, JSON.stringify([game, ...this.list()].slice(0, 20)));
    return game;
  },
};

export const playerRepository = {
  // 仅保存用户创建的球员或对种子档案的覆盖，避免把整份默认球员库重复写入浏览器。
  list(): Player[] {
    return JSON.parse(localStorage.getItem(PLAYERS_KEY) || '[]') as Player[];
  },
  save(player: Player): Player {
    const all = this.list();
    const index = all.findIndex((item) => item.id === player.id);
    if (index < 0) all.unshift(player);
    else all[index] = player;
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(all));
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
    id: crypto.randomUUID(),
    name: '我的梦之队',
    description: '从这里开始搭建你的历史最佳阵容。',
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
    name: '经典五人',
    description: '一套可立即用于对战的示例阵容。',
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
    lineupRepository.save(classicLineup());
    lineupRepository.save(starterLineup());
  }
  return lineupRepository.list();
}
