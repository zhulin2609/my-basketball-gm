package com.links.basketballgm.llm;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class LlmResponseContentExtractorTest {
  private final ObjectMapper objectMapper = new ObjectMapper();
  private final LlmResponseContentExtractor extractor = new LlmResponseContentExtractor(objectMapper);

  @Test
  void extractsAJsonObjectSurroundedByReasoningAndMarkdown() throws Exception {
    String report = """
        I will now produce the requested report.
        ```json
        {"schemaVersion":1,"homeStats":[],"awayStats":[]}
        ```
        Finished.
        """;
    String providerBody = providerBodyWithTextContent(report);

    JsonNode result = extractor.extractReport(providerBody);

    assertThat(result.path("schemaVersion").asInt()).isEqualTo(1);
    assertThat(result.path("homeStats").isArray()).isTrue();
    assertThat(result.path("awayStats").isArray()).isTrue();
  }

  @Test
  void joinsTextFromArrayContentUsedBySomeCompatibleProviders() throws Exception {
    String providerBody = """
        {
          "choices": [{
            "message": {
              "content": [
                {"type":"text","text":"prefix "},
                {"type":"text","text":"{\\"schemaVersion\\":1,\\"homeStats\\":[],\\"awayStats\\":[]}"}
              ]
            }
          }]
        }
        """;

    JsonNode result = extractor.extractReport(providerBody);

    assertThat(result.path("schemaVersion").asInt()).isEqualTo(1);
  }

  @Test
  void rejectsAnObjectThatWasTruncatedBeforeItsClosingBrace() throws Exception {
    String providerBody = providerBodyWithTextContent(
        "reasoning before an incomplete result {\"schemaVersion\":1,\"homeStats\":["
    );

    assertThatThrownBy(() -> extractor.extractReport(providerBody))
        .isInstanceOf(LlmResponseFormatException.class)
        .hasMessageContaining("完整 JSON");
  }

  private String providerBodyWithTextContent(String content) throws Exception {
    var root = objectMapper.createObjectNode();
    var choice = root.putArray("choices").addObject();
    choice.set("message", objectMapper.createObjectNode().put("content", content));
    return objectMapper.writeValueAsString(root);
  }
}
