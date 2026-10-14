import type { Lineup, Player, Simulation } from '@dream-court/core';
import type { AuthUser } from '@dream-court/client';

/**
 * 页面统一面对的数据源快照：游客模式读取本机工作区，账号模式读取服务器数据。
 * `user` 仅在账号模式下存在；`hasUserProgress` 在账号模式下恒为 true。
 */
export interface DataSnapshot {
  source: 'guest' | 'account';
  players: Player[];
  lineups: Lineup[];
  reports: Simulation[];
  hasUserProgress: boolean;
  user: AuthUser | null;
}

/**
 * 统一数据源接口。账号模式的操作是真实网络请求，因此修改类方法全部返回 Promise；
 * 游客模式由运行时包装为立即解决的 Promise。草稿始终是本机同步读写。
 */
export interface DataStore {
  getSnapshot(): DataSnapshot;
  subscribe(listener: () => void): () => void;
  refresh(): Promise<void>;
  createLineup(): Promise<Lineup>;
  saveLineup(lineup: Lineup): Promise<void>;
  readDraft(id: string): Lineup | null;
  saveDraft(lineup: Lineup): void;
  runBattle(homeId: string, awayId: string): Promise<Simulation>;
}

/** 战报类型标示：规则引擎为 v1 或更早的空值，AI 战报的引擎版本为 llm:<模型>。 */
export function reportTypeLabel(engineVersion: string | undefined): string {
  return engineVersion?.startsWith('llm:') ? 'AI 对战' : '规则对战';
}
