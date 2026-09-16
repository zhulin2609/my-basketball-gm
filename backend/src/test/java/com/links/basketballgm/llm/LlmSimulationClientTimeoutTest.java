package com.links.basketballgm.llm;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class LlmSimulationClientTimeoutTest {

  @Test
  void cancelsAProviderThatDoesNotFinishWithinTheConfiguredDeadline() throws Exception {
    HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
    server.createContext("/slow", exchange -> {
      try {
        Thread.sleep(1_000);
        exchange.sendResponseHeaders(200, 0);
      } catch (InterruptedException exception) {
        Thread.currentThread().interrupt();
      } finally {
        exchange.close();
      }
    });
    server.start();

    try {
      LlmSimulationClient client = new LlmSimulationClient(
          HttpClient.newHttpClient(),
          Duration.ofMillis(100)
      );
      HttpRequest request = HttpRequest.newBuilder(URI.create(
          "http://localhost:" + server.getAddress().getPort() + "/slow"
      )).GET().build();

      assertThatThrownBy(() -> client.sendRequest(request))
          .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
              assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.GATEWAY_TIMEOUT)
          )
          .hasMessageContaining("模型生成超时");
    } finally {
      server.stop(0);
    }
  }
}
