export type AppLocale = 'zh-CN' | 'en';

export const LANGUAGE_STORAGE_KEY = 'dream-court.language.v1';

export function normalizeLocale(value: string | null | undefined): AppLocale {
  if (!value) return 'zh-CN';

  return value.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}
