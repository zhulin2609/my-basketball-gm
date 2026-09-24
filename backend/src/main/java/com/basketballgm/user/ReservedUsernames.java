/*
 * @Author: linkzhu 380533073@qq.com
 * @Date: 2026-09-24 16:11:50
 * @Description: 请输入brook链接
 * @FilePath: /backend/src/main/java/com/basketballgm/user/ReservedUsernames.java
 */
package com.basketballgm.user;

import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * Usernames that registration must refuse because they read as official operator accounts.
 * Matching is exact and case-insensitive, same as username lookup at login. Configured admin
 * accounts (FORUM_ADMIN_USERNAMES) are deliberately not blocked: admins register their own
 * account first, and username uniqueness protects it afterwards.
 */
@Component
public class ReservedUsernames {
  private static final Set<String> BLOCKLIST = Set.of(
      "admin",
      "administrator",
      "root",
      "system",
      "support",
      "official",
      "moderator",
      "staff"
  );

  public boolean isReserved(String username) {
    return username != null && BLOCKLIST.contains(username.toLowerCase(Locale.ROOT));
  }
}
