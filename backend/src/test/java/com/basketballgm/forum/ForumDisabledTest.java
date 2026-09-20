package com.basketballgm.forum;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

/**
 * With app.forum.enabled=false the whole forum controller is unmapped: every read and write
 * endpoint answers 404 while the rest of the API keeps working.
 */
@SpringBootTest(properties = "app.forum.enabled=false")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ForumDisabledTest {
  @Autowired private MockMvc mockMvc;
  @Autowired private JdbcTemplate jdbcTemplate;

  private final ObjectMapper objectMapper = new ObjectMapper();
  private final String username = "forum-off-" + UUID.randomUUID().toString().substring(0, 8);

  @AfterEach
  void cleanUsers() {
    jdbcTemplate.update("delete from users where username = ?", username);
  }

  @Test
  void returns404ForEveryForumEndpointWhenDisabled() throws Exception {
    String postId = UUID.randomUUID().toString();
    String commentId = UUID.randomUUID().toString();

    mockMvc.perform(get("/api/v1/forum/posts")).andExpect(status().isNotFound());
    mockMvc.perform(get("/api/v1/forum/posts/" + postId)).andExpect(status().isNotFound());
    mockMvc.perform(get("/api/v1/forum/posts/" + postId + "/comments"))
        .andExpect(status().isNotFound());

    String token = register();
    mockMvc.perform(post("/api/v1/forum/posts")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("lineupId", postId))))
        .andExpect(status().isNotFound());
    mockMvc.perform(delete("/api/v1/forum/posts/" + postId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isNotFound());
    mockMvc.perform(post("/api/v1/forum/posts/" + postId + "/comments")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("content", "hello"))))
        .andExpect(status().isNotFound());
    mockMvc.perform(delete("/api/v1/forum/comments/" + commentId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isNotFound());
    mockMvc.perform(post("/api/v1/forum/posts/" + postId + "/copy")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isNotFound());

    mockMvc.perform(get("/api/v1/health")).andExpect(status().isOk());
  }

  private String register() throws Exception {
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
