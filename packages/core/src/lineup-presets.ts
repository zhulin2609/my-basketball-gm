import type { Lineup, Position } from './types';

/** 经典五人阵容的历史稳定键：旧存档与旧战报通过它关联，不得重新生成。 */
export const CLASSIC_LINEUP_CLIENT_KEY = 'classic-five';

const STARTER_MEMBER_IDS = ['curry', 'jordan', 'lebron', 'duncan', 'shaq'] as const;
const CLASSIC_MEMBER_IDS = ['magic', 'kobe', 'bird', 'garnett', 'olajuwon'] as const;

/**
 * 内置阵容纯工厂：名称、描述、ID 与创建时间全部由调用方提供。
 * Web 传入 i18n 文案与新 UUID；其他客户端传入各自的中文常量与 ID 生成结果。
 */
export interface LineupPresetInput {
  id: string;
  name: string;
  description: string;
  now: string;
}

function createPresetLineup(input: LineupPresetInput, memberIds: readonly string[]): Lineup {
  return {
    id: input.id,
    name: input.name,
    description: input.description,
    createdAt: input.now,
    updatedAt: input.now,
    members: memberIds.map((playerId, index) => ({
      playerId,
      position: ['PG', 'SG', 'SF', 'PF', 'C'][index] as Position,
      starter: true,
      inactive: false,
    })),
  };
}

export function createStarterLineup(input: LineupPresetInput): Lineup {
  return createPresetLineup(input, STARTER_MEMBER_IDS);
}

export function createClassicLineup(input: LineupPresetInput): Lineup {
  return createPresetLineup(input, CLASSIC_MEMBER_IDS);
}
