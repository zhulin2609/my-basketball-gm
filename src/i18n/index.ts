import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LANGUAGE_STORAGE_KEY, normalizeLocale, type AppLocale } from '@/i18n/locale';
import { resources } from '@/i18n/resources';

function getInitialLocale(): AppLocale {
  if (typeof window === 'undefined') return 'zh-CN';

  return normalizeLocale(window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? navigator.language);
}

void i18n.use(initReactI18next).init({
  fallbackLng: 'zh-CN',
  interpolation: { escapeValue: false },
  lng: getInitialLocale(),
  resources,
  react: { useSuspense: false },
});

export const supportedLocales: AppLocale[] = ['zh-CN', 'en'];

export function changeLocale(locale: AppLocale): Promise<unknown> {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
  return i18n.changeLanguage(locale);
}

export { normalizeLocale, type AppLocale };
export default i18n;
