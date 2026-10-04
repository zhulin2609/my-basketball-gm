import { SIMULATION_ENGINE_VERSION } from '@dream-court/core';
import type { GuestImportRequest, GuestSimulationStat, PlayerWriteRequest } from './contracts';
import type { GuestWorkspace } from './guest-workspace';
import type { Player, PlayerStat } from '@dream-court/core';

/** 旧战报快照缺失且无法恢复的字段；界面据此生成各客户端自己的提示文案。 */
export type GuestImportErrorField =
  'playerName' | 'playerInitials' | 'playerAccent' | 'homeLineupName' | 'awayLineupName';

export class GuestImportDataError extends Error {
  readonly field: GuestImportErrorField;

  constructor(field: GuestImportErrorField) {
    super(`guest report is missing ${field}`);
    this.name = 'GuestImportDataError';
    this.field = field;
  }
}

function toPlayerPayload(player: Player): PlayerWriteRequest {
  const { id: _id, isCustom: _isCustom, ...payload } = player;
  return payload;
}

function requiredText(value: string | undefined, field: GuestImportErrorField): string {
  if (!value?.trim()) {
    throw new GuestImportDataError(field);
  }
  return value;
}

function toStat(stat: PlayerStat, playersById: Map<string, Player>): GuestSimulationStat {
  const player = playersById.get(stat.playerId);
  return {
    playerId: stat.playerId,
    playerName: requiredText(stat.playerName ?? player?.name, 'playerName'),
    playerInitials: requiredText(stat.playerInitials ?? player?.initials, 'playerInitials'),
    playerAccent: requiredText(stat.playerAccent ?? player?.accent, 'playerAccent'),
    minutes: stat.minutes,
    points: stat.points,
    rebounds: stat.rebounds,
    assists: stat.assists,
    steals: stat.steals,
    blocks: stat.blocks,
    fgMade: stat.fgMade,
    fgAttempted: stat.fgAttempted,
    threeMade: stat.threeMade,
    threeAttempted: stat.threeAttempted,
  };
}

/**
 * 导入前补齐旧版本地战报缺失的展示快照，并在数据无法恢复时中止导入。
 * 失败时调用方不会清空游客存档，用户仍可回到游客模式处理数据。
 */
export function createGuestImportRequest(
  workspace: GuestWorkspace,
  availablePlayers: Player[],
): GuestImportRequest {
  const playersById = new Map(availablePlayers.map((player) => [player.id, player]));
  const lineupsById = new Map(workspace.lineups.map((lineup) => [lineup.id, lineup]));

  return {
    guestWorkspaceId: workspace.id,
    players: workspace.players.map((player) => ({
      id: player.id,
      custom: player.isCustom === true,
      player: toPlayerPayload(player),
    })),
    lineups: workspace.lineups.map((lineup) => ({
      id: lineup.id,
      lineup: {
        name: lineup.name,
        description: lineup.description,
        members: lineup.members,
      },
    })),
    simulations: workspace.simulations.map((simulation) => ({
      id: simulation.id,
      homeLineupId: simulation.homeLineupId,
      awayLineupId: simulation.awayLineupId,
      homeLineupName: requiredText(
        simulation.homeLineupName ?? lineupsById.get(simulation.homeLineupId)?.name,
        'homeLineupName',
      ),
      awayLineupName: requiredText(
        simulation.awayLineupName ?? lineupsById.get(simulation.awayLineupId)?.name,
        'awayLineupName',
      ),
      seed: simulation.seed,
      homeScore: simulation.homeScore,
      awayScore: simulation.awayScore,
      homeStats: simulation.homeStats.map((stat) => toStat(stat, playersById)),
      awayStats: simulation.awayStats.map((stat) => toStat(stat, playersById)),
      engineVersion: simulation.engineVersion ?? SIMULATION_ENGINE_VERSION,
      createdAt: simulation.createdAt,
      expiresAt: simulation.expiresAt,
    })),
  };
}
