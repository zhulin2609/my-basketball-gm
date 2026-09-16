package com.links.basketballgm.llm;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class LlmSimulationClientProviderOptionsTest {
  private final ObjectMapper objectMapper = new ObjectMapper();
  private final LlmSimulationClient client = new LlmSimulationClient();

  @Test
  void suppressesVerboseReasoningForOpenRouterOnly() {
    var openRouterRequest = objectMapper.createObjectNode();
    var openAiRequest = objectMapper.createObjectNode();

    client.addProviderOptions(openRouterRequest, "https://openrouter.ai/api/v1");
    client.addProviderOptions(openAiRequest, "https://api.openai.com/v1");

    assertThat(openRouterRequest.path("reasoning").path("effort").asText()).isEqualTo("minimal");
    assertThat(openRouterRequest.path("reasoning").path("exclude").asBoolean()).isTrue();
    assertThat(openRouterRequest.has("response_format")).isFalse();
    assertThat(openAiRequest.has("reasoning")).isFalse();
    assertThat(openAiRequest.path("response_format").path("type").asText()).isEqualTo("json_object");
  }
}
