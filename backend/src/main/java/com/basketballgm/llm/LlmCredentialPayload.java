package com.basketballgm.llm;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** The API key is accepted only on write and never appears in a response DTO. */
public record LlmCredentialPayload(
    @NotBlank @Pattern(regexp = "^https://.+") @Size(max = 500) String baseUrl,
    @NotBlank @Size(max = 128) String model,
    @NotBlank @Size(max = 512) String apiKey
) {}
