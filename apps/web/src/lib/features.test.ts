import { describe, expect, it } from 'vitest';
import { readForumEnabled, readWebAuthEnabled } from '@/lib/features';

describe('社区配置', () => {
  it('默认关闭，只接受明确的 true 或 false', () => {
    expect(readForumEnabled(undefined)).toBe(false);
    expect(readForumEnabled('false')).toBe(false);
    expect(readForumEnabled('true')).toBe(true);
    for (const value of ['', 'TRUE', '0', '1', ' false ']) {
      expect(() => readForumEnabled(value)).toThrow('VITE_FORUM_ENABLED must be true or false');
    }
  });
});

describe('Web 认证入口配置', () => {
  it('默认关闭，只接受明确的 true 或 false', () => {
    expect(readWebAuthEnabled(undefined)).toBe(false);
    expect(readWebAuthEnabled('false')).toBe(false);
    expect(readWebAuthEnabled('true')).toBe(true);
    for (const value of ['', 'TRUE', '0', '1', ' false ']) {
      expect(() => readWebAuthEnabled(value)).toThrow(
        'VITE_WEB_AUTH_ENABLED must be true or false',
      );
    }
  });
});
