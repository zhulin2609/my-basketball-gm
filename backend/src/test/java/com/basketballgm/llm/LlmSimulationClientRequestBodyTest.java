package com.basketballgm.llm;

import static org.assertj.core.api.Assertions.assertThat;

import com.basketballgm.lineup.LineupMemberRow;
import com.basketballgm.player.PlayerResponse;
import com.basketballgm.simulation.SimulationResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;

class LlmSimulationClientRequestBodyTest {
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  void sharedBodyCarriesOnlyPortableFields() throws Exception {
    AtomicReference<String> capturedBody = new AtomicReference<>();
    AtomicReference<String> capturedAuthorization = new AtomicReference<>();
    HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
    server.createContext("/v1/chat/completions", exchange -> {
      capturedBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
      capturedAuthorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
      byte[] payload = reportJson().getBytes(StandardCharsets.UTF_8);
      exchange.getResponseHeaders().add("Content-Type", "application/json");
      exchange.sendResponseHeaders(200, payload.length);
      exchange.getResponseBody().write(payload);
      exchange.close();
    });
    server.start();

    try {
      LlmSimulationClient client = new LlmSimulationClient(HttpClient.newHttpClient(), Duration.ofSeconds(5));
      LlmCredentialRow credential = new LlmCredentialRow(
          "http://localhost:" + server.getAddress().getPort() + "/v1",
          "test-model", new byte[0], new byte[0], null
      );
      PlayerResponse player = testPlayer("p1");
      LineupMemberRow member = new LineupMemberRow("lineup-1", "p1", "PG", "starter", 0);

      SimulationResult result = client.simulate(
          credential, "sk-test", List.of(member), List.of(member), Map.of("p1", player)
      );

      JsonNode body = objectMapper.readTree(capturedBody.get());
      assertThat(body.path("model").asText()).isEqualTo("test-model");
      assertThat(body.has("temperature")).isFalse();
      assertThat(body.path("max_tokens").isInt()).isTrue();
      assertThat(body.path("messages").size()).isEqualTo(2);
      assertThat(body.has("thinking")).isFalse();
      assertThat(body.has("response_format")).isFalse();
      assertThat(body.path("messages").path(0).path("content").asText())
          .contains("Minutes for each team must sum to exactly 240 plus 25 per overtime period.")
          .contains("No player may exceed 48 minutes plus 5 per overtime period.");
      assertThat(capturedAuthorization.get()).isEqualTo("Bearer sk-test");
      assertThat(result.homeScore()).isEqualTo(20);
      assertThat(result.awayScore()).isEqualTo(12);
    } finally {
      server.stop(0);
    }
  }

  private String reportJson() {
    return """
        {"choices":[{"message":{"role":"assistant","content":
        "{\\"schemaVersion\\":1,\\"homeStats\\":[{\\"playerId\\":\\"p1\\",\\"minutes\\":30,\\"points\\":20,\\"rebounds\\":5,\\"assists\\":4,\\"steals\\":1,\\"blocks\\":0,\\"fgMade\\":8,\\"fgAttempted\\":15,\\"threeMade\\":2,\\"threeAttempted\\":5}],\\"awayStats\\":[{\\"playerId\\":\\"p1\\",\\"minutes\\":28,\\"points\\":12,\\"rebounds\\":4,\\"assists\\":3,\\"steals\\":0,\\"blocks\\":1,\\"fgMade\\":5,\\"fgAttempted\\":12,\\"threeMade\\":1,\\"threeAttempted\\":4}]}"}}]}
        """;
  }

  private PlayerResponse testPlayer(String id) {
    return new PlayerResponse(
        id, false, "Test Player", "TP", "2020", "TST", "PG",
        6, 3, 200, 10_000_000, "Playmaker", "bio", "#777",
        80, 80, 80, 80, 80, 80,
        80, 80, 80, 80, 80, 80, 80,
        80, 80, 80, 80, 80, 80, 80
    );
  }
}
