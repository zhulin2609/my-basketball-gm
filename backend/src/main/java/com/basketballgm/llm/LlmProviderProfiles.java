package com.basketballgm.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.net.URI;
import java.util.List;

/**
 * Provider-specific request profiles for the chat-completions call. The shared request body carries only
 * model, messages and max_tokens, which every OpenAI-compatible service accepts; sampling and reasoning
 * knobs differ per provider and live here, so supporting a new provider is one registry entry instead of
 * a change to the request pipeline. Unknown hosts keep the conservative shared body untouched.
 */
public final class LlmProviderProfiles {

  private LlmProviderProfiles() {}

  @FunctionalInterface
  private interface RequestCustomizer {
    void customize(ObjectNode request);
  }

  private record Profile(String host, boolean includeSubdomains, RequestCustomizer customizer) {
    boolean matches(String candidate) {
      return candidate.equals(host) || (includeSubdomains && candidate.endsWith("." + host));
    }
  }

  private static final List<Profile> PROFILES = List.of(
      new Profile("api.moonshot.cn", false, LlmProviderProfiles::customizeKimi),
      new Profile("api.moonshot.ai", false, LlmProviderProfiles::customizeKimi),
      new Profile("api.openai.com", false, LlmProviderProfiles::customizeOpenAi),
      new Profile("openrouter.ai", true, LlmProviderProfiles::customizeOpenRouter)
  );

  public static void apply(ObjectNode request, String baseUrl) {
    String host = URI.create(baseUrl).getHost();
    if (host == null) return;
    PROFILES.stream()
        .filter(profile -> profile.matches(host))
        .findFirst()
        .ifPresent(profile -> profile.customizer.customize(request));
  }

  // kimi-k2.5/kimi-k2.6 are hybrid reasoning models with fixed temperatures; disabling thinking keeps the
  // box-score JSON from sharing the output budget with a reasoning trace. kimi-k3 and kimi-k2.7-code reject
  // a disabled thinking block, so those models are left at their defaults.
  private static void customizeKimi(ObjectNode request) {
    String model = request.path("model").asText();
    if (model.startsWith("kimi-k2.5") || model.startsWith("kimi-k2.6")) {
      request.putObject("thinking").put("type", "disabled");
    }
  }

  // OpenAI reasoning models reject max_tokens; max_completion_tokens is accepted across the lineup.
  private static void customizeOpenAi(ObjectNode request) {
    JsonNode maxTokens = request.remove("max_tokens");
    if (maxTokens != null) {
      request.set("max_completion_tokens", maxTokens);
    }
    request.putObject("response_format").put("type", "json_object");
  }

  private static void customizeOpenRouter(ObjectNode request) {
    request.putObject("reasoning").put("effort", "minimal").put("exclude", true);
  }
}
