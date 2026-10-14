package com.basketballgm.auth;

import java.time.Instant;

/** Public binding status of the current user; never carries openid or session keys. */
public record IdentityResponse(String provider, String appid, Instant createdAt) {}
