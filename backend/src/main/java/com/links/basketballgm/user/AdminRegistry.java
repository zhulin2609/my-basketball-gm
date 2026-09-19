package com.links.basketballgm.user;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Operator accounts allowed to remove any community post or comment. Membership comes from
 * configuration (FORUM_ADMIN_USERNAMES) so it can change without a database migration. Matching
 * is case-insensitive, same as username lookup at login.
 */
@Component
public class AdminRegistry {
  private final Set<String> usernames;

  public AdminRegistry(@Value("${app.admin.usernames:}") String configured) {
    this.usernames = Arrays.stream(configured.split(","))
        .map(String::trim)
        .filter(name -> !name.isEmpty())
        .map(name -> name.toLowerCase(Locale.ROOT))
        .collect(Collectors.toUnmodifiableSet());
  }

  public boolean isAdmin(String username) {
    return username != null && usernames.contains(username.toLowerCase(Locale.ROOT));
  }
}
