import type { GuestImportRequest, GuestSimulationStat, PlayerWriteRequest } from '@/lib/api';
import type { GuestWorkspace } from '@/lib/guest-workspace';
import type { Player, PlayerStat } from '@/types';

function toPlayerPayload(player: Player): PlayerWriteRequest {
  const { id: _id, isCustom: _isCustom, ...payload } = player;
  return payload;
}

function requiredText(value: string | undefined, field: string): string {
  if (!value?.trim()) {
    throw new Error(`游客战报缺少${field}，请保留本地存档后重新生成该场比赛。`);
  }
  return value;
}

function toStat(stat: PlayerStat, playersById: Map<string, Player>): GuestSimulationStat {
  const player = playersById.get(stat.playerId);
  return {
    playerId: stat.playerId,
    playerName: requiredText(stat.playerName ?? player?.name, '球员名称'),
    playerInitials: requiredText(stat.playerInitials ?? player?.initials, '球员缩写'),
    playerAccent: requiredText(stat.playerAccent ?? player?.accent, '球员颜色'),
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
        '主队阵容名称',
      ),
      awayLineupName: requiredText(
        simulation.awayLineupName ?? lineupsById.get(simulation.awayLineupId)?.name,
        '客队阵容名称',
      ),
      seed: simulation.seed,
      homeScore: simulation.homeScore,
      awayScore: simulation.awayScore,
      homeStats: simulation.homeStats.map((stat) => toStat(stat, playersById)),
      awayStats: simulation.awayStats.map((stat) => toStat(stat, playersById)),
      engineVersion: simulation.engineVersion ?? 'local-rules-v1',
      createdAt: simulation.createdAt,
      expiresAt: simulation.expiresAt,
    })),
  };
}
