package com.links.basketballgm.forum;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
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
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ForumApiTest {
  @Autowired private MockMvc mockMvc;
  @Autowired private JdbcTemplate jdbcTemplate;

  private final ObjectMapper objectMapper = new ObjectMapper();
  private final String usernamePrefix = "forum-" + UUID.randomUUID().toString().substring(0, 8);

  @AfterEach
  void cleanUsers() {
    jdbcTemplate.update(
        "delete from simulations where owner_id in (select id from users where username like ?)",
        usernamePrefix + "%"
    );
    jdbcTemplate.update(
        "delete from lineups where owner_id in (select id from users where username like ?)",
        usernamePrefix + "%"
    );
    jdbcTemplate.update("delete from users where username like ?", usernamePrefix + "%");
  }

  @Test
  void allowsAnonymousReadsAndRejectsAnonymousPublish() throws Exception {
    String token = register(usernamePrefix + "-anon");
    saveLineup(token, "anon-lineup", "Anon Lineup",
        List.of(member("curry", "PG", true), member("jordan", "SG", true)));
    String postId = publish(token, "anon-lineup", 201);

    mockMvc.perform(get("/api/v1/forum/posts"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[?(@.id == '" + postId + "')].mine", hasItem(false)));

    mockMvc.perform(get("/api/v1/forum/posts/" + postId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mine").value(false))
        .andExpect(jsonPath("$.memberCount").value(2))
        .andExpect(jsonPath("$.authorName").value(usernamePrefix + "-anon"))
        .andExpect(jsonPath("$.members", hasSize(2)))
        .andExpect(jsonPath("$.members[0].player.name").value("Stephen Curry"))
        .andExpect(jsonPath("$.members[0].player.isCustom").value(false))
        .andExpect(jsonPath("$.members[0].starter").value(true));

    mockMvc.perform(get("/api/v1/forum/posts/" + postId + "/comments"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items", hasSize(0)))
        .andExpect(jsonPath("$.total").value(0));

    mockMvc.perform(post("/api/v1/forum/posts")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("lineupId", "anon-lineup"))))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void publishesSnapshotAndRepublishKeepsCommentCount() throws Exception {
    String author = register(usernamePrefix + "-pub");
    String commenter = register(usernamePrefix + "-pub-c");
    saveLineup(author, "pub-lineup", "Public Lineup",
        List.of(member("curry", "PG", true), member("jordan", "SG", false)));
    String postId = publish(author, "pub-lineup", 201);

    mockMvc.perform(get("/api/v1/forum/posts/" + postId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.members[0].player.name").value("Stephen Curry"))
        .andExpect(jsonPath("$.members[1].player.name").value("Michael Jordan"));

    comment(commenter, postId, "Nice lineup!", null, 201);

    mockMvc.perform(post("/api/v1/forum/posts")
            .header("Authorization", "Bearer " + author)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("lineupId", "pub-lineup"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(postId))
        .andExpect(jsonPath("$.mine").value(true))
        .andExpect(jsonPath("$.commentCount").value(1));
  }

  @Test
  void rejectsCustomAndOverriddenPlayers() throws Exception {
    String token = register(usernamePrefix + "-blocks");
    String customId = createCustomPlayer(token, "Forum Custom Star");
    saveLineup(token, "blocked-lineup", "Blocked Lineup",
        List.of(member(customId, "PG", true), member("curry", "SG", true)));

    mockMvc.perform(post("/api/v1/forum/posts")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("lineupId", "blocked-lineup"))))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.message", containsString("Forum Custom Star")));

    mockMvc.perform(put("/api/v1/players/curry")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(playerPayload("Chef Curry"))))
        .andExpect(status().isOk());
    saveLineup(token, "override-lineup", "Override Lineup",
        List.of(member("curry", "PG", true), member("jordan", "SG", true)));

    mockMvc.perform(post("/api/v1/forum/posts")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("lineupId", "override-lineup"))))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.message", containsString("Stephen Curry")));
  }

  @Test
  void supportsOneLevelRepliesAndCascadingDeleteCounts() throws Exception {
    String author = register(usernamePrefix + "-c-a");
    String other = register(usernamePrefix + "-c-b");
    saveLineup(author, "comment-lineup", "Comment Lineup", List.of(member("curry", "PG", true)));
    String postId = publish(author, "comment-lineup", 201);

    String commentId = comment(other, postId, "Great five", null, 201);
    String replyId = comment(author, postId, "Thanks!", commentId, 201);

    mockMvc.perform(get("/api/v1/forum/posts/" + postId + "/comments")
            .header("Authorization", "Bearer " + author))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(2))
        .andExpect(jsonPath("$.items[0].mine").value(false))
        .andExpect(jsonPath("$.items[1].parentId").value(commentId))
        .andExpect(jsonPath("$.items[1].parentAuthorName").value(usernamePrefix + "-c-b"))
        .andExpect(jsonPath("$.items[1].mine").value(true));

    comment(other, postId, "second level", replyId, 400);
    deleteComment(other, replyId, 403);

    deleteComment(other, commentId, 204);
    mockMvc.perform(get("/api/v1/forum/posts/" + postId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.commentCount").value(0));
    mockMvc.perform(get("/api/v1/forum/posts/" + postId + "/comments"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items", hasSize(0)));
  }

  @Test
  void copyCreatesOwnedLineupAndIncrementsCopyCount() throws Exception {
    String author = register(usernamePrefix + "-cp-a");
    String copier = register(usernamePrefix + "-cp-b");
    saveLineup(author, "copy-lineup", "Copy Source",
        List.of(member("curry", "PG", true), member("jordan", "SG", false)));
    String postId = publish(author, "copy-lineup", 201);

    String copied = mockMvc.perform(post("/api/v1/forum/posts/" + postId + "/copy")
            .header("Authorization", "Bearer " + copier))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.name").value("Copy Source"))
        .andExpect(jsonPath("$.members", hasSize(2)))
        .andExpect(jsonPath("$.members[0].playerId").value("curry"))
        .andExpect(jsonPath("$.members[0].starter").value(true))
        .andExpect(jsonPath("$.shareBlockedPlayers", hasSize(0)))
        .andReturn()
        .getResponse()
        .getContentAsString();
    String copiedId = objectMapper.readTree(copied).get("id").asText();

    String lineups = mockMvc.perform(get("/api/v1/lineups")
            .header("Authorization", "Bearer " + copier))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();
    JsonNode copiedLineup = findById(objectMapper.readTree(lineups), copiedId);
    assertEquals(2, copiedLineup.get("members").size());
    assertEquals("curry", copiedLineup.get("members").get(0).get("playerId").asText());

    mockMvc.perform(get("/api/v1/forum/posts/" + postId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.copyCount").value(1));
  }

  @Test
  void deletePostCascadesComments() throws Exception {
    String author = register(usernamePrefix + "-del-a");
    String other = register(usernamePrefix + "-del-b");
    saveLineup(author, "del-lineup", "Delete Me", List.of(member("curry", "PG", true)));
    String postId = publish(author, "del-lineup", 201);
    comment(other, postId, "bye", null, 201);

    mockMvc.perform(delete("/api/v1/forum/posts/" + postId)
            .header("Authorization", "Bearer " + other))
        .andExpect(status().isForbidden());

    mockMvc.perform(delete("/api/v1/forum/posts/" + postId)
            .header("Authorization", "Bearer " + author))
        .andExpect(status().isNoContent());

    mockMvc.perform(get("/api/v1/forum/posts/" + postId))
        .andExpect(status().isNotFound());
    mockMvc.perform(get("/api/v1/forum/posts/" + postId + "/comments"))
        .andExpect(status().isNotFound());
    Integer remaining = jdbcTemplate.queryForObject(
        "select count(*) from lineup_comments where shared_lineup_id = cast(? as uuid)",
        Integer.class,
        postId
    );
    assertEquals(0, remaining);
  }

  @Test
  void paginatesPosts() throws Exception {
    String token = register(usernamePrefix + "-page");
    int baseline = totalPosts();
    saveLineup(token, "page-a", "Page A", List.of(member("curry", "PG", true)));
    publish(token, "page-a", 201);
    saveLineup(token, "page-b", "Page B", List.of(member("jordan", "SG", true)));
    publish(token, "page-b", 201);

    mockMvc.perform(get("/api/v1/forum/posts?page=1&pageSize=1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items", hasSize(1)))
        .andExpect(jsonPath("$.total").value(baseline + 2))
        .andExpect(jsonPath("$.page").value(1))
        .andExpect(jsonPath("$.pageSize").value(1));

    mockMvc.perform(get("/api/v1/forum/posts?page=-3&pageSize=99"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.page").value(1))
        .andExpect(jsonPath("$.pageSize").value(50));
  }

  @Test
  void lineupsExposeSharedPostIdAndShareBlockedPlayers() throws Exception {
    String token = register(usernamePrefix + "-shape");
    saveLineup(token, "shape-lineup", "Shape Lineup",
        List.of(member("curry", "PG", true), member("jordan", "SG", true)));
    String postId = publish(token, "shape-lineup", 201);

    String customId = createCustomPlayer(token, "Blocked Custom");
    saveLineup(token, "blocked-lineup", "Blocked Lineup",
        List.of(member(customId, "PG", true), member("jordan", "SG", true)));

    String lineups = mockMvc.perform(get("/api/v1/lineups")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();
    JsonNode all = objectMapper.readTree(lineups);

    JsonNode shared = findById(all, "shape-lineup");
    assertEquals(postId, shared.get("sharedPostId").asText());
    assertEquals(0, shared.get("shareBlockedPlayers").size());

    JsonNode blocked = findById(all, "blocked-lineup");
    assertTrue(blocked.get("sharedPostId") == null || blocked.get("sharedPostId").isNull());
    assertEquals("Blocked Custom", blocked.get("shareBlockedPlayers").get(0).asText());
  }

  private JsonNode findById(JsonNode lineups, String id) {
    for (JsonNode lineup : lineups) {
      if (lineup.get("id").asText().equals(id)) return lineup;
    }
    throw new IllegalStateException("阵容列表里找不到 " + id);
  }

  private int totalPosts() throws Exception {
    String body = mockMvc.perform(get("/api/v1/forum/posts"))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();
    return objectMapper.readTree(body).get("total").asInt();
  }

  private void saveLineup(String token, String lineupId, String name, List<Map<String, Object>> members)
      throws Exception {
    Map<String, Object> payload = Map.of(
        "name", name,
        "description", "Forum test lineup",
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

  private String comment(String token, String postId, String content, String parentId, int expectedStatus)
      throws Exception {
    Map<String, Object> body = parentId == null
        ? Map.of("content", content)
        : Map.of("content", content, "parentId", parentId);
    var result = mockMvc.perform(post("/api/v1/forum/posts/" + postId + "/comments")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().is(expectedStatus))
        .andReturn();
    if (expectedStatus >= 400) return null;
    return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
  }

  private void deleteComment(String token, String commentId, int expectedStatus) throws Exception {
    mockMvc.perform(delete("/api/v1/forum/comments/" + commentId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().is(expectedStatus));
  }

  private String createCustomPlayer(String token, String name) throws Exception {
    var result = mockMvc.perform(post("/api/v1/players")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(playerPayload(name))))
        .andExpect(status().isCreated())
        .andReturn();
    return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
  }

  private Map<String, Object> playerPayload(String name) {
    Map<String, Object> player = new LinkedHashMap<>();
    player.put("name", name);
    player.put("initials", "FT");
    player.put("peakSeason", "2025-26");
    player.put("peakTeam", "Dream Court");
    player.put("defaultPosition", "PG");
    player.put("heightFeet", 6);
    player.put("heightInches", 3);
    player.put("weightLbs", 195);
    player.put("salaryUsd", 0);
    player.put("archetype", "Creator");
    player.put("bio", "Forum test player.");
    player.put("accent", "#c3ec8b");
    for (String rating : List.of(
        "threePoint", "layup", "midRange", "insideScoring", "dunk",
        "offensiveRebound", "defensiveRebound", "handling", "passing",
        "defensiveIQ", "offensiveIQ", "speed", "agility", "vertical",
        "strength", "freeThrow", "steal", "block", "stamina", "shotTendency"
    )) {
      player.put(rating, 80);
    }
    return player;
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
