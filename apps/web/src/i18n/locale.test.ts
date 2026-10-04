import { describe, expect, it } from 'vitest';
import { normalizeLocale } from '@/i18n/locale';

describe('normalizeLocale', () => {
  it('keeps Chinese browsers on the Simplified Chinese experience', () => {
    expect(normalizeLocale('zh-CN')).toBe('zh-CN');
    expect(normalizeLocale('zh-TW')).toBe('zh-CN');
  });

  it('uses English for non-Chinese browsers and Chinese as the safe fallback', () => {
    expect(normalizeLocale('en-US')).toBe('en');
    expect(normalizeLocale(null)).toBe('zh-CN');
  });
});
