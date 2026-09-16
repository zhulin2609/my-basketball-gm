package com.links.basketballgm.user;

import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * 本地 profile 使用固定用户以便在没有认证服务时验证外键与归属逻辑。
 * 生产 profile 不加载此组件，届时由 Spring Security 的已认证用户替代。
 */
@Component
@Profile("local")
public class LocalDevelopmentUserInitializer implements ApplicationRunner {

  private final UserMapper userMapper;
  private final UUID ownerId;

  public LocalDevelopmentUserInitializer(
      UserMapper userMapper,
      @Value("${app.local-dev-owner-id}") UUID ownerId
  ) {
    this.userMapper = userMapper;
    this.ownerId = ownerId;
  }

  @Override
  public void run(ApplicationArguments args) {
    userMapper.createIfAbsent(ownerId, "local-dev@links.example", "Local Developer");
  }
}
