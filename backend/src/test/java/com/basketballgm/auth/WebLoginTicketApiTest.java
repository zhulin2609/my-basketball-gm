package com.basketballgm.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Scan-code ticket lifecycle against the real database: browser binding, confirm/reject by the
 * authenticated mini program session, expiry, single claim, and the generated mini program code.
 *
 * 边界说明：数据库与 HTTP 传输均为真实；小程序码内容来自本地测试服务器代替的微信接口，
 * 只验证本系统的票据状态机与图片透传，不验证微信的真实图片格式或 scene 行为，平台验收保持
 * NOT RUN。
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WebLoginTicketApiTest {
  private static final byte[] QR_PNG = new byte[] {
      (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, (byte) 0xC4,
      (byte) 0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x78, (byte) 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, (byte) 0xB4,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
      (byte) 0xAE, 0x42, 0x60, (byte) 0x82
  };
  private static final HttpServer wechatStub = startStub();
  private static final java.util.concurrent.atomic.AtomicInteger qrCodeCalls =
      new java.util.concurrent.atomic.AtomicInteger();
  private static final String USER_PREFIX = "ticket-" + UUID.randomUUID().toString().substring(0, 8) + "-";

  @Autowired private MockMvc mockMvc;
  @Autowired private JdbcTemplate jdbcTemplate;

  private final ObjectMapper objectMapper = new ObjectMapper();

  private static HttpServer startStub() {
    try {
      HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
      server.createContext("/cgi-bin/token", exchange -> {
        byte[] bytes = "{\"access_token\":\"stub-access-token\",\"expires_in\":7200}".getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
      });
      server.createContext("/wxa/getwxacodeunlimit", exchange -> {
        qrCodeCalls.incrementAndGet();
        exchange.getResponseHeaders().set("Content-Type", "image/png");
        exchange.sendResponseHeaders(200, QR_PNG.length);
        exchange.getResponseBody().write(QR_PNG);
        exchange.close();
      });
      server.start();
      return server;
    } catch (IOException exception) {
      throw new IllegalStateException("无法启动微信接口测试服务器。", exception);
    }
  }

  @DynamicPropertySource
  static void wechatProperties(DynamicPropertyRegistry registry) {
    registry.add("app.wechat.api-base-url", () -> "http://127.0.0.1:" + wechatStub.getAddress().getPort());
    registry.add("app.wechat.appid", () -> "test-appid");
    registry.add("app.wechat.secret", () -> "test-secret");
  }

  @AfterAll
  static void stopStub() {
    wechatStub.stop(0);
  }

  @AfterEach
  void cleanUp() {
    jdbcTemplate.update("delete from users where username like ?", USER_PREFIX + "%");
    jdbcTemplate.update("delete from web_login_tickets");
  }

  @Test
  void runsTheFullConfirmAndClaimFlow() throws Exception {
    String binding = UUID.randomUUID().toString();
    String ticket = createTicket(binding);
    String session = register(USER_PREFIX + "confirm");

    expectTicketStatus(ticket, "wrong-" + binding, 404, null);
    expectTicketStatus(ticket, binding, 200, "pending");

    expectClaim(ticket, binding, 409, "TICKET_NOT_APPROVED");

    mockMvc.perform(post("/api/v1/auth/web-login-tickets/" + ticket + "/confirm"))
        .andExpect(status().isUnauthorized());

    mockMvc.perform(post("/api/v1/auth/web-login-tickets/" + ticket + "/confirm")
            .header("Authorization", "Bearer " + session))
        .andExpect(status().isNoContent());

    expectTicketStatus(ticket, binding, 200, "approved");
    expectClaim(ticket, "wrong-" + binding, 404, null);

    MvcResult claimed = mockMvc.perform(post("/api/v1/auth/web-login-tickets/" + ticket + "/claim")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("browserBinding", binding))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accessToken").isString())
        .andExpect(jsonPath("$.user.username").value(USER_PREFIX + "confirm"))
        .andReturn();
    String claimedToken = objectMapper.readTree(claimed.getResponse().getContentAsString())
        .get("accessToken").asText();
    mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + claimedToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value(USER_PREFIX + "confirm"));

    expectClaim(ticket, binding, 410, "TICKET_CONSUMED");
    expectTicketStatus(ticket, binding, 200, "consumed");
  }

  @Test
  void rejectedTicketCannotBeClaimed() throws Exception {
    String binding = UUID.randomUUID().toString();
    String ticket = createTicket(binding);
    String session = register(USER_PREFIX + "reject");

    mockMvc.perform(post("/api/v1/auth/web-login-tickets/" + ticket + "/reject")
            .header("Authorization", "Bearer " + session))
        .andExpect(status().isNoContent());

    expectTicketStatus(ticket, binding, 200, "rejected");
    expectClaim(ticket, binding, 409, "TICKET_REJECTED");

    mockMvc.perform(post("/api/v1/auth/web-login-tickets/" + ticket + "/confirm")
            .header("Authorization", "Bearer " + session))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("TICKET_RESOLVED"));
  }

  @Test
  void expiredTicketEndsTheFlow() throws Exception {
    String binding = UUID.randomUUID().toString();
    String ticket = createTicket(binding);
    String session = register(USER_PREFIX + "expired");

    jdbcTemplate.update(
        "update web_login_tickets set expires_at = ? where ticket_digest = ?",
        Timestamp.from(Instant.now().minusSeconds(60)),
        TokenSupport.digest(ticket)
    );

    expectTicketStatus(ticket, binding, 200, "expired");
    mockMvc
        .perform(
            post("/api/v1/auth/web-login-tickets/" + ticket + "/confirm")
                .header("Authorization", "Bearer " + session))
        .andExpect(status().isGone())
        .andExpect(jsonPath("$.code").value("TICKET_EXPIRED"));
    expectClaim(ticket, binding, 410, "TICKET_EXPIRED");
  }

  @Test
  void expiredApprovedTicketCannotBeClaimed() throws Exception {
    String binding = UUID.randomUUID().toString();
    String ticket = createTicket(binding);
    String session = register(USER_PREFIX + "approved-expired");

    mockMvc
        .perform(
            post("/api/v1/auth/web-login-tickets/" + ticket + "/confirm")
                .header("Authorization", "Bearer " + session))
        .andExpect(status().isNoContent());

    jdbcTemplate.update(
        "update web_login_tickets set expires_at = ? where ticket_digest = ?",
        Timestamp.from(Instant.now().minusSeconds(60)),
        TokenSupport.digest(ticket)
    );

    expectTicketStatus(ticket, binding, 200, "expired");
    expectClaim(ticket, binding, 410, "TICKET_EXPIRED");
  }

  @Test
  void qrCodeIsNotServedForExpiredTickets() throws Exception {
    String binding = UUID.randomUUID().toString();
    String ticket = createTicket(binding);
    jdbcTemplate.update(
        "update web_login_tickets set expires_at = ? where ticket_digest = ?",
        Timestamp.from(Instant.now().minusSeconds(60)),
        TokenSupport.digest(ticket)
    );
    mockMvc
        .perform(get("/api/v1/auth/web-login-tickets/" + ticket + "/qrcode"))
        .andExpect(status().isGone());
  }

  @Test
  void ticketExpiringDuringRowLockWaitCannotBeConsumed() throws Exception {
    // 复现条件：领取请求等待行锁期间跨越到期时间；服务在取得锁后按实际时刻核验，必须拒绝。
    String binding = UUID.randomUUID().toString();
    String ticket = createTicket(binding);
    String session = register(USER_PREFIX + "lockwait");
    mockMvc
        .perform(
            post("/api/v1/auth/web-login-tickets/" + ticket + "/confirm")
                .header("Authorization", "Bearer " + session))
        .andExpect(status().isNoContent());
    String digest = TokenSupport.digest(ticket);
    jdbcTemplate.update(
        "update web_login_tickets set expires_at = ? where ticket_digest = ?",
        Timestamp.from(Instant.now().plusSeconds(2)),
        digest);

    javax.sql.DataSource dataSource = jdbcTemplate.getDataSource();
    try (java.sql.Connection locker = dataSource.getConnection()) {
      locker.setAutoCommit(false);
      try (java.sql.PreparedStatement lock = locker.prepareStatement(
          "select id from web_login_tickets where ticket_digest = ? for update")) {
        lock.setString(1, digest);
        lock.execute();
      }
      var claimStatus = java.util.concurrent.CompletableFuture.supplyAsync(() -> {
        try {
          return mockMvc
              .perform(
                  post("/api/v1/auth/web-login-tickets/" + ticket + "/claim")
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(Map.of("browserBinding", binding))))
              .andReturn()
              .getResponse()
              .getStatus();
        } catch (Exception exception) {
          throw new IllegalStateException(exception);
        }
      });
      Thread.sleep(4000);
      locker.commit();
      assertEquals(410, claimStatus.get());
    }
  }

  @Test
  void servesTheMiniProgramCodeForTheTicket() throws Exception {
    String binding = UUID.randomUUID().toString();
    String ticket = createTicket(binding);

    mockMvc.perform(get("/api/v1/auth/web-login-tickets/" + ticket + "/qrcode"))
        .andExpect(status().isOk())
        .andExpect(content().contentType(MediaType.IMAGE_PNG))
        .andExpect(content().bytes(QR_PNG));

    mockMvc.perform(get("/api/v1/auth/web-login-tickets/" + "0".repeat(32) + "/qrcode"))
        .andExpect(status().isNotFound());
  }

  @Test
  void rateLimitsTicketCreationPerBrowser() throws Exception {
    String binding = UUID.randomUUID().toString();
    for (int created = 0; created < 30; created++) {
      createTicket(binding);
    }
    mockMvc.perform(post("/api/v1/auth/web-login-tickets")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("browserBinding", binding))))
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
  }

  @Test
  void concurrentCreationCannotExceedTheBindingQuota() throws Exception {
    String binding = UUID.randomUUID().toString();
    var results = new java.util.concurrent.CopyOnWriteArrayList<Integer>();
    var threads = new java.util.ArrayList<Thread>();
    for (int index = 0; index < 35; index++) {
      threads.add(Thread.ofVirtual().start(() -> {
        try {
          int statusCode = mockMvc.perform(post("/api/v1/auth/web-login-tickets")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(Map.of("browserBinding", binding))))
              .andReturn()
              .getResponse()
              .getStatus();
          results.add(statusCode);
        } catch (Exception exception) {
          throw new IllegalStateException(exception);
        }
      }));
    }
    for (Thread thread : threads) thread.join();
    long created = results.stream().filter(code -> code == 201).count();
    long limited = results.stream().filter(code -> code == 429).count();
    assertEquals(30, created);
    assertEquals(5, limited);
  }

  @Test
  void concurrentQrCodeRequestsShareOneUpstreamCall() throws Exception {
    String binding = UUID.randomUUID().toString();
    String ticket = createTicket(binding);
    qrCodeCalls.set(0);
    var first = java.util.concurrent.CompletableFuture.supplyAsync(() -> qrCodeStatus(ticket));
    var second = java.util.concurrent.CompletableFuture.supplyAsync(() -> qrCodeStatus(ticket));
    assertEquals(200, first.join());
    assertEquals(200, second.join());
    assertEquals(1, qrCodeCalls.get());
  }

  private int qrCodeStatus(String ticket) {
    try {
      return mockMvc.perform(get("/api/v1/auth/web-login-tickets/" + ticket + "/qrcode"))
          .andReturn()
          .getResponse()
          .getStatus();
    } catch (Exception exception) {
      throw new IllegalStateException(exception);
    }
  }

  private String createTicket(String binding) throws Exception {
    MvcResult result = mockMvc.perform(post("/api/v1/auth/web-login-tickets")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("browserBinding", binding))))
        .andExpect(status().isCreated())
        .andReturn();
    return objectMapper.readTree(result.getResponse().getContentAsString()).get("ticket").asText();
  }

  private void expectTicketStatus(String ticket, String binding, int httpStatus, String ticketStatus)
      throws Exception {
    var request = mockMvc
        .perform(
            get("/api/v1/auth/web-login-tickets/" + ticket).header("X-Login-Ticket-Binding", binding))
        .andExpect(status().is(httpStatus));
    if (ticketStatus != null) {
      request.andExpect(jsonPath("$.status").value(ticketStatus));
    }
  }

  private void expectClaim(String ticket, String binding, int httpStatus, String code) throws Exception {
    var request = mockMvc.perform(post("/api/v1/auth/web-login-tickets/" + ticket + "/claim")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("browserBinding", binding))))
        .andExpect(status().is(httpStatus));
    if (code != null) {
      request.andExpect(jsonPath("$.code").value(code));
    }
  }

  private String register(String username) throws Exception {
    MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "username", username,
                "password", "visitor-password-2026"
            ))))
        .andExpect(status().isCreated())
        .andReturn();
    return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
  }
}
