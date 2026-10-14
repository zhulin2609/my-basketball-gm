package com.basketballgm.auth;

import java.time.Instant;
import java.util.UUID;

public record UserIdentityRow(
    String id,
    UUID userId,
    String provider,
    String appid,
    String openid,
    String unionid,
    Instant createdAt
) {}
