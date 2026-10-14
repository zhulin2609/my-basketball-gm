/**
 * 两端统一的用户名规则：中文汉字、英文字母、数字、下划线和连字符，3–32 个字符。
 * 与后端 `UsernameRules.PATTERN` 及数据库 `users_username_format_check` 约束保持一致；
 * 允许字符均在基本多文种平面内，字符计数与 Unicode code point 计数一致。
 * 规则只做判定，不静默改写候选值。
 */
export const USERNAME_PATTERN = /^[一-龥A-Za-z0-9_\-]{3,32}$/;

/** HTML 表单 pattern 属性使用的字符串形式（pattern 以 v 模式编译，连字符必须转义）。 */
export const USERNAME_PATTERN_SOURCE = '[一-龥A-Za-z0-9_\\-]{3,32}';

export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value);
}
