package com.links.basketballgm.llm;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Normalizes the small response-shape differences found across OpenAI-compatible providers.
 * It accepts text or text-block content and finds a complete report object even when a model
 * surrounds the JSON with reasoning or Markdown.
 */
final class LlmResponseContentExtractor {
  private final ObjectMapper objectMapper;

  LlmResponseContentExtractor(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  JsonNode extractReport(String providerBody) {
    JsonNode provider = readJson(providerBody, "模型服务没有返回有效 JSON 响应。");
    JsonNode contentNode = provider.path("choices").path(0).path("message").path("content");
    String content = extractText(contentNode).trim();
    if (content.isEmpty()) {
      throw new LlmResponseFormatException("模型响应中没有可读取的文本内容。");
    }

    JsonNode direct = tryReadReport(content);
    if (direct != null) return direct;

    for (int start = content.indexOf('{'); start >= 0; start = content.indexOf('{', start + 1)) {
      int end = matchingObjectEnd(content, start);
      if (end < 0) continue;
      JsonNode candidate = tryReadReport(content.substring(start, end + 1));
      if (candidate != null) return candidate;
    }

    throw new LlmResponseFormatException("模型响应中没有找到完整 JSON 战报对象。");
  }

  private JsonNode readJson(String value, String errorMessage) {
    try {
      return objectMapper.readTree(value);
    } catch (JsonProcessingException exception) {
      throw new LlmResponseFormatException(errorMessage, exception);
    }
  }

  private String extractText(JsonNode contentNode) {
    if (contentNode.isTextual()) return contentNode.textValue();
    if (!contentNode.isArray()) return "";

    StringBuilder text = new StringBuilder();
    for (JsonNode block : contentNode) {
      if (block.isTextual()) {
        text.append(block.textValue());
      } else if (block.path("text").isTextual()) {
        text.append(block.path("text").textValue());
      } else if (block.path("content").isTextual()) {
        text.append(block.path("content").textValue());
      }
    }
    return text.toString();
  }

  private JsonNode tryReadReport(String candidate) {
    try {
      JsonNode parsed = objectMapper.readTree(candidate.trim());
      if (parsed != null
          && parsed.isObject()
          && parsed.path("homeStats").isArray()
          && parsed.path("awayStats").isArray()) {
        return parsed;
      }
      return null;
    } catch (JsonProcessingException exception) {
      return null;
    }
  }

  /** Finds a balanced JSON object while respecting braces and escapes inside JSON strings. */
  private int matchingObjectEnd(String value, int start) {
    int depth = 0;
    boolean insideString = false;
    boolean escaped = false;

    for (int index = start; index < value.length(); index++) {
      char character = value.charAt(index);
      if (insideString) {
        if (escaped) {
          escaped = false;
        } else if (character == '\\') {
          escaped = true;
        } else if (character == '"') {
          insideString = false;
        }
        continue;
      }

      if (character == '"') {
        insideString = true;
      } else if (character == '{') {
        depth++;
      } else if (character == '}' && --depth == 0) {
        return index;
      }
    }
    return -1;
  }
}
