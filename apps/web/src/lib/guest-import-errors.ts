import { GuestImportDataError, type GuestImportErrorField } from '@dream-court/client';

/** 游客导入结构化错误的中文文案映射；结构化错误码由 client 产生。 */
const FIELD_LABELS: Record<GuestImportErrorField, string> = {
  playerName: '球员名称',
  playerInitials: '球员缩写',
  playerAccent: '球员颜色',
  homeLineupName: '主队阵容名称',
  awayLineupName: '客队阵容名称',
};

export function guestImportFailureMessage(error: unknown, fallback: string): string {
  if (error instanceof GuestImportDataError) {
    return `游客战报缺少${FIELD_LABELS[error.field]}，请保留本地存档后重新生成该场比赛。`;
  }
  return error instanceof Error ? error.message : fallback;
}
