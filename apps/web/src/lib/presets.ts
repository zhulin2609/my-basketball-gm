import {
  CLASSIC_LINEUP_CLIENT_KEY,
  createClassicLineup,
  createStarterLineup,
  type Lineup,
} from '@dream-court/core';
import i18n from '@/i18n';
import { createIdentifier } from '@/lib/identifier';

/**
 * 内置示例阵容的 Web 构造：文案来自 i18n，ID 与时间由平台能力提供。
 * 纯工厂在 core，语言相关的部分留在 Web。
 */
export function makeStarterLineup(): Lineup {
  return createStarterLineup({
    id: createIdentifier(),
    name: i18n.t('defaults.dreamTeam'),
    description: i18n.t('defaults.dreamTeamDescription'),
    now: new Date().toISOString(),
  });
}

export function makeClassicLineup(): Lineup {
  return createClassicLineup({
    id: CLASSIC_LINEUP_CLIENT_KEY,
    name: i18n.t('defaults.classicFive'),
    description: i18n.t('defaults.classicDescription'),
    now: new Date().toISOString(),
  });
}
