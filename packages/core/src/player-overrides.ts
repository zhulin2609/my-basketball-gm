import type { Player } from './types';

/**
 * 合并公共目录与用户数据：目录条目按 ID 应用用户覆盖，用户创建的球员附加在目录之后。
 * 输入保持不变，返回新数组；目录缺失的旧覆盖条目保留在结果中，等待界面提示处理。
 */
export function mergePlayerCatalog(seedPlayers: Player[], savedPlayers: Player[]): Player[] {
  const savedById = new Map(savedPlayers.map((player) => [player.id, player]));
  const seedIds = new Set(seedPlayers.map((player) => player.id));

  return [
    ...seedPlayers.map((player) => savedById.get(player.id) ?? player),
    ...savedPlayers.filter((player) => !seedIds.has(player.id)),
  ];
}
