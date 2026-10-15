package com.basketballgm.auth;

/**
 * Username rule shared with the clients and the database constraint. Keep in sync with
 * `packages/core/src/username.ts` and the `users_username_format_check` constraint (V14).
 * All allowed characters are in the BMP, so Java char counting matches Unicode code points.
 */
public final class UsernameRules {
  public static final String PATTERN = "^[\\u4e00-\\u9fffA-Za-z0-9_\\-]{2,32}$";

  private UsernameRules() {}
}
