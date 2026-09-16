package com.links.basketballgm.user;

import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Keeps the existing local data reachable after authentication is enabled. This bootstrap account
 * does not exist outside the local profile.
 */
@Component
@Profile("local")
public class LocalDevelopmentUserInitializer implements ApplicationRunner {

  private final UserMapper userMapper;
  private final PasswordEncoder passwordEncoder;
  private final UUID id;
  private final String username;
  private final String password;

  public LocalDevelopmentUserInitializer(
      UserMapper userMapper,
      PasswordEncoder passwordEncoder,
      @Value("${app.local-bootstrap-user.id}") UUID id,
      @Value("${app.local-bootstrap-user.username}") String username,
      @Value("${app.local-bootstrap-user.password}") String password
  ) {
    this.userMapper = userMapper;
    this.passwordEncoder = passwordEncoder;
    this.id = id;
    this.username = username;
    this.password = password;
  }

  @Override
  public void run(ApplicationArguments args) {
    userMapper.upsertLocalUser(
        id,
        "local-dev@links.example",
        "Local Developer",
        username,
        passwordEncoder.encode(password)
    );
  }
}
