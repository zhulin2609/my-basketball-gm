package com.basketballgm.forum;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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

/**
 * Community governance: local word filter, rate limits, new-account link restriction and the
 * admin deletion channel. Limits are tightened through properties so every check is exercised
 * against the real database within a single request flow.
 */
@SpringBootTest(properties = {
    "app.forum.rate-limit.comment-per-second=1",
    "app.forum.rate-limit.comment-per-day=3",
    "app.forum.rate-limit.publish-per-hour=1",
    "app.forum.new-account-link-hours=24"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ForumModerationTest {
  private static final String USER_PREFIX = "forum-mod-" + UUID.randomUUID().toString().substring(0, 8) + "-";
  private static final String ADMIN_USERNAME = USER_PREFIX + "admin";

  @DynamicPropertySource
  static void forumProperties(DynamicPropertyRegistry registry) {
    registry.add("app.admin.usernames", () -> ADMIN_USERNAME);
  }

  @Autowired private MockMvc mockMvc;
  @Autowired private JdbcTemplate jdbcTemplate;

  private final ObjectMapper objectMapper = new ObjectMapper();

  @AfterEach
  void cleanUsers() {
    jdbcTemplate.update(
        "delete from simulations where owner_id in (select id from users where username like ?)",
        USER_PREFIX + "%"
    );
    jdbcTemplate.update(
        "delete from lineups where owner_id in (select id from users where username like ?)",
        USER_PREFIX + "%"
    );
    jdbcTemplate.update("delete from users where username like ?", USER_PREFIX + "%");
  }

  @Test
  void rejectsSensitiveWordInCommentWithoutEchoingIt() throws Exception {
    String author = register(USER_PREFIX + "sw-a");
    saveLineup(author, "sw-lineup", "Word Filter Lineup", "Forum test lineup",
        List.of(member("curry", "PG", true)));
    String postId = publish(author, "sw-lineup", 201);

    mockMvc.perform(post("/api/v1/forum/posts/" + postId + "/comments")
            .header("Authorization", "Bearer " + author)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("content", "这个阵容是在赌博"))))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.code").value("CONTENT_REJECTED"))
        .andExpect(jsonPath("$.message", not(containsString("赌博"))));
  }

  @Test
  void rejectsSensitiveWordInPublishText() throws Exception {
    String author = register(USER_PREFIX + "sw-p");
    saveLineup(author, "sw-pub", "赌博阵容", "Forum test lineup",
        List.of(member("curry", "PG", true)));

    mockMvc.perform(post("/api/v1/forum/posts")
            .header("Authorization", "Bearer " + author)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("lineupId", "sw-pub"))))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.code").value("CONTENT_REJECTED"))
        .andExpect(jsonPath("$.message", not(containsString("赌博"))));
  }

  @Test
  void rateLimitsCommentsPerSecond() throws Exception {
    String author = register(USER_PREFIX + "rl-a");
    String commenter = register(USER_PREFIX + "rl-c");
    saveLineup(author, "rl-lineup", "Rate Limit Lineup", "Forum test lineup",
        List.of(member("curry", "PG", true)));
    String postId = publish(author, "rl-lineup", 201);

    comment(commenter, postId, "第一条评论", 201);

    mockMvc.perform(post("/api/v1/forum/posts/" + postId + "/comments")
            .header("Authorization", "Bearer " + commenter)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("content", "同一秒内第二条"))))
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
  }

  @Test
  void rateLimitsCommentsPerDay() throws Exception {
    String author = register(USER_PREFIX + "rd-a");
    String commenter = register(USER_PREFIX + "rd-c");
    saveLineup(author, "rd-lineup", "Daily Limit Lineup", "Forum test lineup",
        List.of(member("curry", "PG", true)));
    String postId = publish(author, "rd-lineup", 201);

    // Two hours old: outside the per-second window, inside the per-day window.
    String commenterId = userId(USER_PREFIX + "rd-c");
    for (int index = 0; index < 3; index++) {
      jdbcTemplate.update(
          "insert into lineup_comments (shared_lineup_id, author_id, content, created_at) "
              + "values (cast(? as uuid), cast(? as uuid), ?, now() - interval '2 hours')",
          postId, commenterId, "历史评论 " + index
      );
    }

    mockMvc.perform(post("/api/v1/forum/posts/" + postId + "/comments")
            .header("Authorization", "Bearer " + commenter)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("content", "超出当天额度的一条"))))
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
  }

  @Test
  void rateLimitsNewPostsPerHourButAllowsUpdates() throws Exception {
    String author = register(USER_PREFIX + "rp-a");
    saveLineup(author, "rp-lineup-a", "First Lineup", "Forum test lineup",
        List.of(member("curry", "PG", true)));
    publish(author, "rp-lineup-a", 201);

    saveLineup(author, "rp-lineup-b", "Second Lineup", "Forum test lineup",
        List.of(member("jordan", "SG", true)));
    mockMvc.perform(post("/api/v1/forum/posts")
            .header("Authorization", "Bearer " + author)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("lineupId", "rp-lineup-b"))))
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.code").value("RATE_LIMITED"));

    // Updating an already public lineup cannot bump list order, so it stays exempt.
    publish(author, "rp-lineup-a", 200);
  }

  @Test
  void blocksLinksForNewAccountsAndAllowsThemAfterOneDay() throws Exception {
    String author = register(USER_PREFIX + "lk-a");
    String newcomer = register(USER_PREFIX + "lk-n");
    saveLineup(author, "lk-lineup", "Link Lineup", "Forum test lineup",
        List.of(member("curry", "PG", true)));
    String postId = publish(author, "lk-lineup", 201);

    mockMvc.perform(post("/api/v1/forum/posts/" + postId + "/comments")
            .header("Authorization", "Bearer " + newcomer)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("content", "看这个 https://example.com 阵容分析"))))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("LINK_RESTRICTED"));

    jdbcTemplate.update(
        "update users set created_at = now() - interval '2 days' where username = ?",
        USER_PREFIX + "lk-n"
    );

    comment(newcomer, postId, "看这个 https://example.com 阵容分析", 201);
  }

  @Test
  void blocksLinksInPublishTextForNewAccounts() throws Exception {
    String newcomer = register(USER_PREFIX + "lp-n");
    saveLineup(newcomer, "lp-lineup", "Link Publish Lineup", "攻略见 www.example.com",
        List.of(member("curry", "PG", true)));

    mockMvc.perform(post("/api/v1/forum/posts")
            .header("Authorization", "Bearer " + newcomer)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("lineupId", "lp-lineup"))))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("LINK_RESTRICTED"));
  }

  @Test
  void adminCanDeleteAnyContentAndIsFlaggedInProfile() throws Exception {
    String admin = register(ADMIN_USERNAME);
    String author = register(USER_PREFIX + "ad-a");
    String commenter = register(USER_PREFIX + "ad-c");
    saveLineup(author, "ad-lineup", "Admin Lineup", "Forum test lineup",
        List.of(member("curry", "PG", true)));
    String postId = publish(author, "ad-lineup", 201);
    String commentId = comment(commenter, postId, "待管理员删除", 201);

    mockMvc.perform(get("/api/v1/auth/me")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.admin").value(true));
    mockMvc.perform(get("/api/v1/auth/me")
            .header("Authorization", "Bearer " + author))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.admin").value(false));

    mockMvc.perform(delete("/api/v1/forum/comments/" + commentId)
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isNoContent());
    mockMvc.perform(delete("/api/v1/forum/posts/" + postId)
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isNoContent());
    mockMvc.perform(get("/api/v1/forum/posts/" + postId))
        .andExpect(status().isNotFound());
  }

  private String userId(String username) {
    return jdbcTemplate.queryForObject(
        "select id::text from users where username = ?", String.class, username);
  }

  private void saveLineup(String token, String lineupId, String name, String description,
      List<Map<String, Object>> members) throws Exception {
    Map<String, Object> payload = Map.of(
        "name", name,
        "description", description,
        "members", members
    );
    mockMvc.perform(put("/api/v1/lineups/" + lineupId)
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(payload)))
        .andExpect(status().isOk());
  }

  private Map<String, Object> member(String playerId, String position, boolean starter) {
    return Map.of("playerId", playerId, "position", position, "starter", starter, "inactive", false);
  }

  private String publish(String token, String lineupId, int expectedStatus) throws Exception {
    var result = mockMvc.perform(post("/api/v1/forum/posts")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("lineupId", lineupId))))
        .andExpect(status().is(expectedStatus))
        .andReturn();
    if (expectedStatus >= 400) return null;
    return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
  }

  private String comment(String token, String postId, String content, int expectedStatus) throws Exception {
    var result = mockMvc.perform(post("/api/v1/forum/posts/" + postId + "/comments")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("content", content))))
        .andExpect(status().is(expectedStatus))
        .andReturn();
    if (expectedStatus >= 400) return null;
    return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
  }

  private String register(String username) throws Exception {
    String response = mockMvc.perform(post("/api/v1/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "username", username,
                "password", "visitor-password-2026"
            ))))
        .andExpect(status().isCreated())
        .andReturn()
        .getResponse()
        .getContentAsString();
    JsonNode json = objectMapper.readTree(response);
    return json.get("accessToken").asText();
  }
}
