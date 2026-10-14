package com.basketballgm.auth;

import java.time.Instant;

/**
 * Result of a WeChat code exchange: either the identity is already bound and carries a session,
 * or the client must ask the user to bind an existing account or create a new one.
 */
public record WechatExchangeResponse(
    String status,
    AuthResponse session,
    String credentialToken,
    Instant credentialExpiresAt
) {
  public static WechatExchangeResponse authenticated(AuthResponse session) {
    return new WechatExchangeResponse("authenticated", session, null, null);
  }

  public static WechatExchangeResponse confirmationRequired(String credentialToken, Instant expiresAt) {
    return new WechatExchangeResponse("confirmation_required", null, credentialToken, expiresAt);
  }
}
