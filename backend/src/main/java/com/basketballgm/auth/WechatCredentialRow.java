package com.basketballgm.auth;

import java.time.Instant;
import java.util.UUID;

public record WechatCredentialRow(
    String id,
    String provider,
    String appid,
    String openid,
    String unionid,
    int failedAttempts,
    Instant expiresAt,
    Instant consumedAt,
    UUID consumedByUserId,
    Instant createdAt
) {}
