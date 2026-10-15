import { describe, expect, it } from 'vitest';
import { isValidUsername, USERNAME_PATTERN_SOURCE } from './username';

describe('isValidUsername', () => {
  it('接受汉字、英文字母、数字、下划线和连字符', () => {
    expect(isValidUsername('张三丰')).toBe(true);
    expect(isValidUsername('player_one-2')).toBe(true);
    expect(isValidUsername('球员Player_01-甲')).toBe(true);
  });

  it('按字符数执行 2–32 长度规则', () => {
    expect(isValidUsername('张')).toBe(false);
    expect(isValidUsername('a')).toBe(false);
    expect(isValidUsername('张三')).toBe(true);
    expect(isValidUsername('ab')).toBe(true);
    expect(isValidUsername('张'.repeat(32))).toBe(true);
    expect(isValidUsername('张'.repeat(33))).toBe(false);
  });

  it('拒绝 emoji、空格与其他文字', () => {
    expect(isValidUsername('张三😀')).toBe(false);
    expect(isValidUsername('张 三')).toBe(false);
    expect(isValidUsername('한국어用户')).toBe(false);
    expect(isValidUsername('éclair用户')).toBe(false);
    expect(isValidUsername('')).toBe(false);
  });

  it('覆盖汉字范围上下边界，与后端和数据库约束一致', () => {
    // 统一范围为 U+4E00–U+9FFF：下边界、上边界接受，紧邻范围外拒绝。
    expect(isValidUsername('球员一')).toBe(true);
    expect(isValidUsername('球员鿿')).toBe(true);
    expect(isValidUsername('球员龦')).toBe(true);
    expect(isValidUsername('球员ꀀ')).toBe(false);
  });

  it('HTML pattern 字符串与判定函数行为一致', () => {
    const htmlPattern = new RegExp(`^(?:${USERNAME_PATTERN_SOURCE})$`, 'v');
    for (const value of ['张三丰', 'player_one-2', '张三😀', '张 三', 'ab']) {
      expect(htmlPattern.test(value)).toBe(isValidUsername(value));
    }
  });
});
