package com.links.basketballgm.auth;

import java.time.Instant;

/** Access token and its expiry are returned only by registration and login endpoints. */
public record AuthResponse(
    String accessToken,
    String tokenType,
    Instant expiresAt,
    AuthUserResponse user
) {}
