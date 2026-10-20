package com.basketballgm.forum;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

// 不覆盖社区开关，验证 application.yml 的默认关闭及真实 HTTP / PostgreSQL 行为。
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class ForumDisabledHttpTest {
  @LocalServerPort private int port;
  @Autowired private JdbcTemplate jdbc;
  @Autowired private Environment environment;
  private final ObjectMapper json = new ObjectMapper();
  private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
  private final String username = "forum-http-" + UUID.randomUUID().toString().substring(0, 8);
  private UUID owner;

  @AfterEach
  void cleanup() {
    if (owner != null) {
      jdbc.update("delete from simulations where owner_id = ?", owner);
      jdbc.update("delete from lineups where owner_id = ?", owner);
      jdbc.update("delete from users where id = ?", owner);
    }
  }

  @Test
  void defaultDisabledRejectsAllForumOperationsAndPreservesDataAndPersonalFeatures() throws Exception {
    assertFalse(environment.getProperty("app.forum.enabled", Boolean.class, true));
    JsonNode session = body(request("POST", "/auth/register", null,
        Map.of("username", username, "password", "forum-http-password-2026")), 201);
    owner = UUID.fromString(session.path("user").path("id").asText());
    String token = session.path("accessToken").asText();
    body(request("POST", "/auth/login", null,
        Map.of("username", username, "password", "forum-http-password-2026")), 200);
    assertEquals(username, body(request("GET", "/auth/me", token, null), 200).path("username").asText());
    List<Map<String, Object>> members = List.of(
        member("curry", "PG"), member("jordan", "SG"), member("lebron", "SF"),
        member("duncan", "PF"), member("shaq", "C"));
    Map<String, Object> lineup = Map.of("name", "保留阵容", "description", "", "members", members);
    body(request("PUT", "/lineups/home", token, lineup), 200);
    body(request("PUT", "/lineups/away", token, lineup), 200);
    UUID source = jdbc.queryForObject(
        "select id from lineups where owner_id = ? and client_key = 'home'", UUID.class, owner);
    UUID post = UUID.randomUUID();
    UUID comment = UUID.randomUUID();
    // 直接建立停用前的持久化记录；本轮不启动开放的社区接口。
    jdbc.update(
        "insert into shared_lineups(id, owner_id, source_lineup_id, name, members, comment_count) "
            + "values (?, ?, ?, '保留帖子', '[]'::jsonb, 1)", post, owner, source);
    jdbc.update(
        "insert into lineup_comments(id, shared_lineup_id, author_id, content) values (?, ?, ?, '保留评论')",
        comment, post, owner);
    var postsBefore = jdbc.queryForList("select * from shared_lineups where id = ?", post);
    var commentsBefore = jdbc.queryForList("select * from lineup_comments where id = ?", comment);

    for (String path : List.of("/forum/posts", "/forum/posts/" + post, "/forum/posts/" + post + "/comments")) {
      assertEquals(404, request("GET", path, null, null).statusCode(), path);
      assertEquals(404, request("GET", path, token, null).statusCode(), path);
    }
    for (String path : List.of("/forum/posts", "/forum/posts/" + post + "/comments",
        "/forum/posts/" + post + "/copy")) {
      Map<String, String> payload = Map.of("lineupId", "home", "content", "拒绝发布");
      assertEquals(404, request("POST", path, token, payload).statusCode(), path);
      assertEquals(401, request("POST", path, null, payload).statusCode(), path);
    }
    for (String path : List.of("/forum/posts/" + post, "/forum/comments/" + comment)) {
      assertEquals(404, request("DELETE", path, token, null).statusCode(), path);
      assertEquals(401, request("DELETE", path, null, null).statusCode(), path);
    }
    body(request("PUT", "/lineups/home", token,
        Map.of("name", "关闭社区后编辑", "description", "", "members", members)), 200);
    JsonNode lineups = body(request("GET", "/lineups", token, null), 200);
    assertEquals(2, lineups.size());
    JsonNode home = null;
    for (JsonNode item : lineups) if (item.path("id").asText().equals("home")) home = item;
    assertEquals("关闭社区后编辑", home.path("name").asText());
    assertEquals(post.toString(), home.path("sharedPostId").asText());
    body(request("POST", "/simulations", token,
        Map.of("homeLineupId", "home", "awayLineupId", "away", "seed", 42, "simulationMode", "local")), 201);
    assertEquals(1, jdbc.queryForObject("select count(*) from simulations where owner_id = ?", Integer.class, owner));
    assertEquals(postsBefore, jdbc.queryForList("select * from shared_lineups where id = ?", post));
    assertEquals(commentsBefore, jdbc.queryForList("select * from lineup_comments where id = ?", comment));
    assertEquals(200, request("GET", "/health", null, null).statusCode());
  }

  private Map<String, Object> member(String id, String position) {
    return Map.of("playerId", id, "position", position, "starter", true, "inactive", false);
  }

  private HttpResponse<String> request(String method, String path, String token, Object payload) throws Exception {
    var builder = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api/v1" + path))
        .timeout(Duration.ofSeconds(30));
    if (token != null) builder.header("Authorization", "Bearer " + token);
    if (payload != null) builder.header("Content-Type", "application/json");
    return http.send(builder.method(method, payload == null
        ? HttpRequest.BodyPublishers.noBody()
        : HttpRequest.BodyPublishers.ofString(json.writeValueAsString(payload))).build(),
        HttpResponse.BodyHandlers.ofString());
  }

  private JsonNode body(HttpResponse<String> response, int status) throws Exception {
    assertEquals(status, response.statusCode(), response.body());
    return json.readTree(response.body());
  }
}
