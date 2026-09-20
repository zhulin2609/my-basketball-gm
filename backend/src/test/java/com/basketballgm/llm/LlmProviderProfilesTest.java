package com.basketballgm.llm;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

class LlmProviderProfilesTest {
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  void kimiK26DisablesThinking() {
    ObjectNode request = baseRequest("kimi-k2.6");

    LlmProviderProfiles.apply(request, "https://api.moonshot.cn/v1");

    assertThat(request.path("thinking").path("type").asText()).isEqualTo("disabled");
  }

  @Test
  void kimiInternationalHostUsesTheSameProfile() {
    ObjectNode request = baseRequest("kimi-k2.6");

    LlmProviderProfiles.apply(request, "https://api.moonshot.ai/v1");

    assertThat(request.path("thinking").path("type").asText()).isEqualTo("disabled");
  }

  @Test
  void kimiModelsThatRejectDisabledThinkingKeepTheirDefaults() {
    ObjectNode request = baseRequest("kimi-k3");

    LlmProviderProfiles.apply(request, "https://api.moonshot.cn/v1");

    assertThat(request.has("thinking")).isFalse();
  }

  @Test
  void openAiUsesJsonModeAndMaxCompletionTokens() {
    ObjectNode request = baseRequest("gpt-5");

    LlmProviderProfiles.apply(request, "https://api.openai.com/v1");

    assertThat(request.has("max_tokens")).isFalse();
    assertThat(request.path("max_completion_tokens").asInt()).isEqualTo(8000);
    assertThat(request.path("response_format").path("type").asText()).isEqualTo("json_object");
    assertThat(request.has("reasoning")).isFalse();
  }

  @Test
  void openRouterSuppressesVerboseReasoning() {
    ObjectNode request = baseRequest("moonshotai/kimi-k2.6");

    LlmProviderProfiles.apply(request, "https://openrouter.ai/api/v1");

    assertThat(request.path("reasoning").path("effort").asText()).isEqualTo("minimal");
    assertThat(request.path("reasoning").path("exclude").asBoolean()).isTrue();
    assertThat(request.has("response_format")).isFalse();
  }

  @Test
  void openRouterSubdomainsUseTheSameProfile() {
    ObjectNode request = baseRequest("moonshotai/kimi-k2.6");

    LlmProviderProfiles.apply(request, "https://beta.openrouter.ai/api/v1");

    assertThat(request.path("reasoning").path("effort").asText()).isEqualTo("minimal");
  }

  @Test
  void unknownHostKeepsTheConservativeSharedBody() {
    ObjectNode request = baseRequest("my-local-model");

    LlmProviderProfiles.apply(request, "http://192.168.1.10:8000/v1");

    assertThat(request.path("max_tokens").asInt()).isEqualTo(8000);
    assertThat(request.has("thinking")).isFalse();
    assertThat(request.has("response_format")).isFalse();
    assertThat(request.has("reasoning")).isFalse();
  }

  private ObjectNode baseRequest(String model) {
    ObjectNode request = objectMapper.createObjectNode();
    request.put("model", model);
    request.put("max_tokens", 8000);
    request.putArray("messages");
    return request;
  }
}
