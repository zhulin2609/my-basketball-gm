package com.basketballgm.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * WeChat passwordless flows against the real database and a real local HTTP server playing the
 * WeChat API. The stub maps js_code "code-<name>" to openid "openid-<name>" so each test controls
 * the identity it works with; any other code returns errcode 40029.
 *
 * 边界说明：传输是真实 HTTP，数据库是真实 PostgreSQL，被替代的只有微信上游接口的请求响应内容。
 * 这些测试验证本系统的认证、绑定、凭证与事务行为；真实微信合同（jscode2session 实际字段、
 * 小程序码生成、扫码与确认链路）需要配置真实凭据后以开发者工具和真机验收，当前保持 NOT RUN，
 * 不以本测试通过冒充平台验收。
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WechatAuthApiTest {
  private static final HttpServer wechatStub = startStub();
  private static final String USER_PREFIX = "wx-" + UUID.randomUUID().toString().substring(0, 8) + "-";

  @Autowired private MockMvc mockMvc;
  @Autowired private JdbcTemplate jdbcTemplate;
  @LocalServerPort private int port;

  private final ObjectMapper objectMapper = new ObjectMapper();

  private static HttpServer startStub() {
    try {
      HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
      server.createContext("/sns/jscode2session", exchange -> {
        String query = exchange.getRequestURI().getRawQuery();
        String code = java.util.Arrays.stream(query.split("&"))
            .filter(part -> part.startsWith("js_code="))
            .map(part -> part.substring("js_code=".length()))
            .findFirst()
            .orElse("");
        String body = code.startsWith("code-")
            ? "{\"openid\":\"openid-" + code.substring("code-".length()) + "\",\"session_key\":\"stub-session-key\",\"unionid\":\"union-" + code.substring("code-".length()) + "\"}"
            : "{\"errcode\":40029,\"errmsg\":\"invalid code\"}";
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
      });
      server.createContext("/cgi-bin/token", exchange -> {
        byte[] bytes = "{\"access_token\":\"stub-access-token\",\"expires_in\":7200}".getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, bytes.length);
        exchange.getResponseBody().write(bytes);
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
  void cleanUsers() {
    jdbcTemplate.update("delete from users where username like ?", USER_PREFIX + "%");
    jdbcTemplate.update("delete from wechat_auth_credentials where appid = 'test-appid'");
  }

  @Test
  void exchangeForUnboundIdentityReturnsCredentialAndRegisterCreatesPasswordlessAccount() throws Exception {
    JsonNode exchange = exchange("code-alpha");
    assertEquals("confirmation_required", exchange.get("status").asText());
    String credentialToken = exchange.get("credentialToken").asText();

    String username = USER_PREFIX + "球员甲";
    MvcResult registered = mockMvc.perform(post("/api/v1/auth/wechat/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "credentialToken", credentialToken,
                "username", username
            ))))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.newAccount").value(true))
        .andExpect(jsonPath("$.session.accessToken").isString())
        .andReturn();

    String token = objectMapper.readTree(registered.getResponse().getContentAsString())
        .get("session").get("accessToken").asText();
    mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value(username));

    mockMvc.perform(get("/api/v1/auth/identities").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].provider").value("wechat"))
        .andExpect(jsonPath("$[0].appid").value("test-appid"));

    // A passwordless account cannot sign in with a password.
    mockMvc.perform(post("/api/v1/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "username", username,
                "password", "some-password-2026"
            ))))
        .andExpect(status().isUnauthorized());

    // The next exchange for the same WeChat identity signs in directly.
    JsonNode again = exchange("code-alpha");
    assertEquals("authenticated", again.get("status").asText());
    assertEquals(username, again.get("session").get("user").get("username").asText());
  }

  @Test
  void registerRetryWithTheConsumedCredentialReturnsTheSameSession() throws Exception {
    JsonNode exchange = exchange("code-bravo");
    String credentialToken = exchange.get("credentialToken").asText();
    String username = USER_PREFIX + "bravo";

    mockMvc.perform(post("/api/v1/auth/wechat/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "credentialToken", credentialToken,
                "username", username
            ))))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.newAccount").value(true));

    mockMvc.perform(post("/api/v1/auth/wechat/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "credentialToken", credentialToken,
                "username", username
            ))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.newAccount").value(false))
        .andExpect(jsonPath("$.session.user.username").value(username));

    Integer userCount = jdbcTemplate.queryForObject(
        "select count(*) from users where username = ?", Integer.class, username);
    assertEquals(1, userCount);
  }

  @Test
  void registerRejectsReservedAndDuplicateUsernames() throws Exception {
    String existing = USER_PREFIX + "taken";
    registerPasswordAccount(existing);

    JsonNode exchange = exchange("code-carol");
    String credentialToken = exchange.get("credentialToken").asText();
    mockMvc.perform(post("/api/v1/auth/wechat/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "credentialToken", credentialToken,
                "username", existing
            ))))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.message").value("用户名已被占用。"));

    exchange = exchange("code-carol");
    credentialToken = exchange.get("credentialToken").asText();
    mockMvc.perform(post("/api/v1/auth/wechat/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "credentialToken", credentialToken,
                "username", "admin"
            ))))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.message").value("该用户名不可用。"));
  }

  @Test
  void bindsAnExistingPasswordAccountAfterPasswordVerification() throws Exception {
    String username = USER_PREFIX + "dave";
    registerPasswordAccount(username);

    JsonNode exchange = exchange("code-dave");
    String credentialToken = exchange.get("credentialToken").asText();

    mockMvc.perform(post("/api/v1/auth/wechat/bind")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "credentialToken", credentialToken,
                "username", username,
                "password", "wrong-password-2026"
            ))))
        .andExpect(status().isUnauthorized());

    mockMvc.perform(post("/api/v1/auth/wechat/bind")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "credentialToken", credentialToken,
                "username", username,
                "password", "visitor-password-2026"
            ))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.user.username").value(username));

    // Binding retry with the consumed credential stays successful.
    mockMvc.perform(post("/api/v1/auth/wechat/bind")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "credentialToken", credentialToken,
                "username", username,
                "password", "visitor-password-2026"
            ))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.user.username").value(username));

    JsonNode again = exchange("code-dave");
    assertEquals("authenticated", again.get("status").asText());
    assertEquals(username, again.get("session").get("user").get("username").asText());
  }

  @Test
  void rejectsBindingConflictsInBothDirections() throws Exception {
    String first = USER_PREFIX + "erin-first";
    String second = USER_PREFIX + "erin-second";
    registerPasswordAccount(first);
    registerPasswordAccount(second);

    // Two users hold credentials for the same WeChat identity; the first bind wins.
    String firstCredential = exchange("code-erin").get("credentialToken").asText();
    String secondCredential = exchange("code-erin").get("credentialToken").asText();
    bind(firstCredential, first, 200);
    bind(secondCredential, second, 409);

    // One account cannot bind a second WeChat identity for the same appid.
    String anotherCredential = exchange("code-frank").get("credentialToken").asText();
    bind(anotherCredential, first, 409);
  }

  @Test
  void rejectsInvalidExpiredAndExhaustedCredentials() throws Exception {
    mockMvc.perform(post("/api/v1/auth/wechat/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "credentialToken", "not-a-real-credential",
                "username", USER_PREFIX + "grace"
            ))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("CREDENTIAL_INVALID"));

    String credentialToken = exchange("code-heidi").get("credentialToken").asText();
    jdbcTemplate.update(
        "update wechat_auth_credentials set expires_at = ? where token_digest = ?",
        java.sql.Timestamp.from(Instant.now().minusSeconds(60)),
        TokenSupport.digest(credentialToken)
    );
    mockMvc.perform(post("/api/v1/auth/wechat/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "credentialToken", credentialToken,
                "username", USER_PREFIX + "heidi"
            ))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("CREDENTIAL_INVALID"));

    String username = USER_PREFIX + "ivan";
    registerPasswordAccount(username);
    String bindCredential = exchange("code-ivan").get("credentialToken").asText();
    for (int attempt = 0; attempt < 5; attempt++) {
      bindWithPassword(bindCredential, username, "wrong-password-2026", attempt == 4 ? 400 : 401);
    }
    bindWithPassword(bindCredential, username, "visitor-password-2026", 400);
  }

  @Test
  void rejectsInvalidWechatCode() throws Exception {
    mockMvc.perform(post("/api/v1/auth/wechat/exchange")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("code", "definitely-invalid"))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("WECHAT_CODE_INVALID"));
  }

  @Test
  void realHttpWrongPasswordCanBeCorrectedWithoutReplacingCredential() throws Exception {
    String username = USER_PREFIX + "http-retry";
    registerPasswordAccount(username);
    String credential = exchange("code-http-retry").get("credentialToken").asText();
    HttpResponse<String> wrong = bindOverHttp(credential, username, "wrong-password-2026");
    assertEquals(401, wrong.statusCode());
    assertEquals("INVALID_ACCOUNT_CREDENTIALS", objectMapper.readTree(wrong.body()).get("code").asText());
    HttpResponse<String> correct = bindOverHttp(credential, username, "visitor-password-2026");
    assertEquals(200, correct.statusCode());
    assertEquals(username, objectMapper.readTree(correct.body()).get("user").get("username").asText());
    assertEquals(1, jdbcTemplate.queryForObject(
        "select count(*) from user_identities where appid = 'test-appid' and openid = 'openid-http-retry'", Integer.class));
  }

  @Test
  void realHttpFinalWrongAttemptImmediatelyRequiresRenewalAndFreshCredentialWorks() throws Exception {
    String username = USER_PREFIX + "http-limit";
    registerPasswordAccount(username);
    String credential = exchange("code-http-limit").get("credentialToken").asText();
    for (int attempt = 1; attempt <= 5; attempt++) {
      HttpResponse<String> response = bindOverHttp(credential, username, "wrong-password-2026");
      assertEquals(attempt == 5 ? 400 : 401, response.statusCode());
      assertEquals(attempt == 5 ? "CREDENTIAL_ATTEMPTS_EXCEEDED" : "INVALID_ACCOUNT_CREDENTIALS",
          objectMapper.readTree(response.body()).get("code").asText());
    }
    HttpResponse<String> exhausted = bindOverHttp(credential, username, "visitor-password-2026");
    assertEquals(400, exhausted.statusCode());
    assertEquals("CREDENTIAL_ATTEMPTS_EXCEEDED", objectMapper.readTree(exhausted.body()).get("code").asText());
    assertEquals(5, jdbcTemplate.queryForObject(
        "select failed_attempts from wechat_auth_credentials where token_digest = ?",
        Integer.class, TokenSupport.digest(credential)));
    assertEquals(0, jdbcTemplate.queryForObject(
        "select count(*) from user_identities where appid = 'test-appid' and openid = 'openid-http-limit'", Integer.class));
    String fresh = exchange("code-http-limit").get("credentialToken").asText();
    assertEquals(200, bindOverHttp(fresh, username, "visitor-password-2026").statusCode());
  }

  @Test
  void realHttpConcurrentWrongAttemptsCannotExceedTheLimit() throws Exception {
    String username = USER_PREFIX + "http-race";
    registerPasswordAccount(username);
    String credential = exchange("code-http-race").get("credentialToken").asText();
    for (int attempt = 0; attempt < 4; attempt++) {
      assertEquals(401, bindOverHttp(credential, username, "wrong-password-2026").statusCode());
    }
    try (var executor = java.util.concurrent.Executors.newFixedThreadPool(2)) {
      var first = executor.submit(() -> bindOverHttp(credential, username, "wrong-password-2026"));
      var second = executor.submit(() -> bindOverHttp(credential, username, "wrong-password-2026"));
      assertEquals(400, first.get().statusCode());
      assertEquals(400, second.get().statusCode());
    }
    assertEquals(5, jdbcTemplate.queryForObject(
        "select failed_attempts from wechat_auth_credentials where token_digest = ?",
        Integer.class, TokenSupport.digest(credential)));
    assertEquals(400, bindOverHttp(credential, username, "visitor-password-2026").statusCode());
  }

  private HttpResponse<String> bindOverHttp(String credential, String username, String password) throws Exception {
    HttpRequest request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api/v1/auth/wechat/bind"))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(Map.of(
            "credentialToken", credential, "username", username, "password", password))))
        .build();
    try (HttpClient client = HttpClient.newHttpClient()) {
      return client.send(request, HttpResponse.BodyHandlers.ofString());
    }
  }

  @Test
  void rateLimitsCredentialIssuancePerIdentity() throws Exception {
    for (int issued = 0; issued < 10; issued++) {
      exchange("code-judy");
    }
    mockMvc
        .perform(
            post("/api/v1/auth/wechat/exchange")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("code", "code-judy"))))
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
  }

  @Test
  void concurrentBindsOfTheSameCredentialCompleteIdempotently() throws Exception {
    String username = USER_PREFIX + "kate";
    registerPasswordAccount(username);
    String credentialToken = exchange("code-kate").get("credentialToken").asText();

    var first = java.util.concurrent.CompletableFuture.supplyAsync(() -> bindStatus(credentialToken, username));
    var second = java.util.concurrent.CompletableFuture.supplyAsync(() -> bindStatus(credentialToken, username));
    int firstStatus = first.join();
    int secondStatus = second.join();
    assertEquals(200, firstStatus);
    assertEquals(200, secondStatus);

    Integer identityCount = jdbcTemplate.queryForObject(
        "select count(*) from user_identities where provider = 'wechat' and appid = 'test-appid' and openid = 'openid-kate'",
        Integer.class);
    assertEquals(1, identityCount);
  }

  @Test
  void sequentialBindsWithFreshCredentialsForTheSameIdentityStayIdempotent() throws Exception {
    String username = USER_PREFIX + "liam";
    registerPasswordAccount(username);
    // 身份未绑定时连续签发的两个有效凭证，依次绑定同一账号：均为幂等成功。
    String firstCredential = exchange("code-liam").get("credentialToken").asText();
    String secondCredential = exchange("code-liam").get("credentialToken").asText();
    bind(firstCredential, username, 200);
    bind(secondCredential, username, 200);

    // 幂等成功路径也必须消费对应凭证，不能留可重放的未消费凭证。
    Integer unconsumed = jdbcTemplate.queryForObject(
        "select count(*) from wechat_auth_credentials where appid = 'test-appid' and openid = 'openid-liam' and consumed_at is null",
        Integer.class);
    assertEquals(0, unconsumed);
  }

  @Test
  void concurrentRegistersWithTheSameCredentialCreateOneAccount() throws Exception {
    String credentialToken = exchange("code-mia").get("credentialToken").asText();
    String username = USER_PREFIX + "mia";
    var first = java.util.concurrent.CompletableFuture.supplyAsync(() -> registerStatus(credentialToken, username));
    var second = java.util.concurrent.CompletableFuture.supplyAsync(() -> registerStatus(credentialToken, username));
    int firstStatus = first.join();
    int secondStatus = second.join();
    assertEquals(java.util.Set.of(200, 201), java.util.Set.of(firstStatus, secondStatus));

    Integer userCount = jdbcTemplate.queryForObject(
        "select count(*) from users where username = ?", Integer.class, username);
    assertEquals(1, userCount);
  }

  private int bindStatus(String credentialToken, String username) {
    try {
      return mockMvc
          .perform(
              post("/api/v1/auth/wechat/bind")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(
                      objectMapper.writeValueAsString(
                          Map.of(
                              "credentialToken", credentialToken,
                              "username", username,
                              "password", "visitor-password-2026"))))
          .andReturn()
          .getResponse()
          .getStatus();
    } catch (Exception exception) {
      throw new IllegalStateException(exception);
    }
  }

  private int registerStatus(String credentialToken, String username) {
    try {
      return mockMvc
          .perform(
              post("/api/v1/auth/wechat/register")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(
                      objectMapper.writeValueAsString(
                          Map.of("credentialToken", credentialToken, "username", username))))
          .andReturn()
          .getResponse()
          .getStatus();
    } catch (Exception exception) {
      throw new IllegalStateException(exception);
    }
  }

  private JsonNode exchange(String code) throws Exception {
    MvcResult result = mockMvc.perform(post("/api/v1/auth/wechat/exchange")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("code", code))))
        .andExpect(status().isOk())
        .andReturn();
    JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
    assertNotNull(body.get("status"));
    return body;
  }

  private void bind(String credentialToken, String username, int expectedStatus) throws Exception {
    bindWithPassword(credentialToken, username, "visitor-password-2026", expectedStatus);
  }

  private void bindWithPassword(
      String credentialToken, String username, String password, int expectedStatus
  ) throws Exception {
    mockMvc.perform(post("/api/v1/auth/wechat/bind")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "credentialToken", credentialToken,
                "username", username,
                "password", password
            ))))
        .andExpect(status().is(expectedStatus));
  }

  private void registerPasswordAccount(String username) throws Exception {
    mockMvc.perform(post("/api/v1/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "username", username,
                "password", "visitor-password-2026"
            ))))
        .andExpect(status().isCreated());
  }
}
