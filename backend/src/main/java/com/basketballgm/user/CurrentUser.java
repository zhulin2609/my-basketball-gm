package com.basketballgm.user;

import java.util.UUID;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/** Converts the JWT subject into the internal user identifier used by ownership queries. */
@Component
public class CurrentUser {

  public UUID id(Jwt jwt) {
    try {
      return UUID.fromString(jwt.getSubject());
    } catch (IllegalArgumentException exception) {
      throw new IllegalStateException("登录凭证无效。", exception);
    }
  }
}
