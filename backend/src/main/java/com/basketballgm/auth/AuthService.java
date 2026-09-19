package com.basketballgm.auth;

import com.basketballgm.user.AdminRegistry;
import com.basketballgm.user.CurrentUser;
import com.basketballgm.user.UserMapper;
import com.basketballgm.user.UserRow;
import java.time.Duration;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** Owns password verification and signed token issuance; controllers never see password hashes. */
@Service
public class AuthService {
  private final UserMapper userMapper;
  private final PasswordEncoder passwordEncoder;
  private final JwtEncoder jwtEncoder;
  private final CurrentUser currentUser;
  private final AdminRegistry adminRegistry;
  private final Duration tokenTtl;

  public AuthService(
      UserMapper userMapper,
      PasswordEncoder passwordEncoder,
      JwtEncoder jwtEncoder,
      CurrentUser currentUser,
      AdminRegistry adminRegistry,
      @Value("${app.auth.token-ttl}") Duration tokenTtl
  ) {
    this.userMapper = userMapper;
    this.passwordEncoder = passwordEncoder;
    this.jwtEncoder = jwtEncoder;
    this.currentUser = currentUser;
    this.adminRegistry = adminRegistry;
    this.tokenTtl = tokenTtl;
  }

  public AuthResponse register(AuthRequest request) {
    if (userMapper.findByUsername(request.username()) != null) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "用户名已被占用。");
    }
    try {
      UserRow user = userMapper.insertRegistered(
          request.username(),
          passwordEncoder.encode(request.password()),
          request.username()
      );
      return issue(user);
    } catch (DataIntegrityViolationException exception) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "用户名已被占用。");
    }
  }

  public AuthResponse login(AuthRequest request) {
    UserRow user = userMapper.findByUsername(request.username());
    if (user == null || user.passwordHash() == null || !passwordEncoder.matches(request.password(), user.passwordHash())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户名或密码错误。");
    }
    return issue(user);
  }

  public AuthUserResponse current(Jwt jwt) {
    UserRow user = userMapper.findById(currentUser.id(jwt));
    if (user == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "账号不存在或已被删除。");
    }
    return toResponse(user);
  }

  private AuthResponse issue(UserRow user) {
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
