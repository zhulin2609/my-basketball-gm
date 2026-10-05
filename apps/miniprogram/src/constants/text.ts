import type { Ratings } from '@dream-court/core';

export const ratingLabels: Record<keyof Ratings, string> = {
  threePoint: '三分',
  layup: '上篮',
  midRange: '中距离',
  insideScoring: '内线得分',
  dunk: '扣篮',
  offensiveRebound: '进攻篮板',
  defensiveRebound: '防守篮板',
  handling: '控球',
  passing: '传球',
  defensiveIQ: '防守意识',
  offensiveIQ: '进攻意识',
  speed: '速度',
  agility: '敏捷',
  vertical: '弹跳',
  strength: '力量',
  freeThrow: '罚球',
  steal: '抢断',
  block: '盖帽',
  stamina: '体能',
  shotTendency: '出手倾向',
};

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'errMsg' in error) {
    return String(error.errMsg);
  }
  return String(error);
}
