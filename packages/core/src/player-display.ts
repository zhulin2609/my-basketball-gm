import type { Player } from './types';

/** 显示语言的展示选项：core 不依赖任何应用的 i18n 类型，使用同值的字符串字面量。 */
export type DisplayNameLocale = 'zh-CN' | 'en';

/** 中文界面附加中文名称，英文界面保持英文名称。 */
export function displayPlayerName(player: Player, locale: DisplayNameLocale): string {
  const chineseName = player.chineseName?.trim();
  return locale === 'zh-CN' && chineseName ? `${player.name}(${chineseName})` : player.name;
}

/** 球员库与阵容候选列表共用的搜索文本。 */
export function playerSearchText(player: Player): string {
  return `${player.name} ${player.chineseName ?? ''} ${player.archetype}`.toLocaleLowerCase();
}
