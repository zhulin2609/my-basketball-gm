package com.basketballgm.auth;

import com.basketballgm.user.AdminRegistry;
import com.basketballgm.user.UserRow;
import java.time.Duration;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Component;

/** Signs the project's own JWT for a user row; shared by the password and WeChat flows. */
@Component
class AuthTokenIssuer {
  private final JwtEncoder jwtEncoder;
  private final AdminRegistry adminRegistry;
  private final Duration tokenTtl;

  AuthTokenIssuer(
      JwtEncoder jwtEncoder,
      AdminRegistry adminRegistry,
      @Value("${app.auth.token-ttl}") Duration tokenTtl
  ) {
    this.jwtEncoder = jwtEncoder;
    this.adminRegistry = adminRegistry;
    this.tokenTtl = tokenTtl;
  }

  AuthResponse issue(UserRow user) {
    Instant issuedAt = Instant.now();
    Instant expiresAt = issuedAt.plus(tokenTtl);
    JwtClaimsSet claims = JwtClaimsSet.builder()
        .subject(user.id().toString())
        .issuedAt(issuedAt)
        .expiresAt(expiresAt)
        .claim("username", user.username())
        .build();
    // Nimbus needs the explicit HMAC algorithm to select the symmetric signing key.
    JwsHeader headers = JwsHeader.with(MacAlgorithm.HS256).build();
    String token = jwtEncoder.encode(JwtEncoderParameters.from(headers, claims)).getTokenValue();
    return new AuthResponse(token, "Bearer", expiresAt, toResponse(user));
  }

  private AuthUserResponse toResponse(UserRow user) {
    return new AuthUserResponse(user.id(), user.username(), user.displayName(), adminRegistry.isAdmin(user.username()));
  }
}
