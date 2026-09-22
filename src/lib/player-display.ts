import type { AppLocale } from '@/i18n';
import type { Player } from '@/types';

/** 中文界面附加中文名称，英文界面保持英文名称。 */
export function displayPlayerName(player: Player, locale: AppLocale): string {
  const chineseName = player.chineseName?.trim();
  return locale === 'zh-CN' && chineseName ? `${player.name}(${chineseName})` : player.name;
}

/** 球员库与阵容候选列表共用的搜索文本。 */
export function playerSearchText(player: Player): string {
  return `${player.name} ${player.chineseName ?? ''} ${player.archetype}`.toLocaleLowerCase();
}
