package com.basketballgm.auth;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

/** Random token generation and SHA-256 digests for credentials and login tickets. */
final class TokenSupport {
  private static final SecureRandom RANDOM = new SecureRandom();

  private TokenSupport() {}

  /** URL-safe random credential token; only its digest is stored server-side. */
  static String newCredentialToken() {
    byte[] bytes = new byte[32];
    RANDOM.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  /** Ticket identifier carried by the mini program code scene; 32 chars to fit the scene limit. */
  static String newTicket() {
    return UUID.randomUUID().toString().replace("-", "");
  }

  static String digest(String value) {
    try {
      byte[] hashed = MessageDigest.getInstance("SHA-256").digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
      StringBuilder hex = new StringBuilder(hashed.length * 2);
      for (byte b : hashed) hex.append(Character.forDigit((b >> 4) & 0xF, 16)).append(Character.forDigit(b & 0xF, 16));
      return hex.toString();
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-256 不可用。", exception);
    }
  }
}
