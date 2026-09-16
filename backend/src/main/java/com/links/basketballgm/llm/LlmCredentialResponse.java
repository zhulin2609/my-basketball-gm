package com.links.basketballgm.llm;

/** Safe browser representation; the encrypted key itself is deliberately never returned. */
public record LlmCredentialResponse(boolean configured, String baseUrl, String model, String apiKeyHint) {
  static LlmCredentialResponse notConfigured() {
    return new LlmCredentialResponse(false, null, null, null);
  }
}
