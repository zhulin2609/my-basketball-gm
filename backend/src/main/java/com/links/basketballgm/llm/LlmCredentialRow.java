package com.links.basketballgm.llm;

/**
 * Persistence view returned by MyBatis. It is public because a generated JDK proxy invokes mapper methods
 * outside this package; callers must still keep it inside the LLM module.
 */
public record LlmCredentialRow(
    String baseUrl,
    String model,
    byte[] apiKeyCiphertext,
    byte[] apiKeyIv,
    String apiKeyHint
) {}
