package com.basketballgm.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
 * Registration guards: fixed reserved names, case-insensitive matching, and the ordinary
 * duplicate-name conflict all answer against the real database.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthApiTest {
  private static final String USER_PREFIX = "auth-" + UUID.randomUUID().toString().substring(0, 8) + "-";

  @Autowired private MockMvc mockMvc;
  @Autowired private JdbcTemplate jdbcTemplate;

  private final ObjectMapper objectMapper = new ObjectMapper();

  @AfterEach
  void cleanUsers() {
    jdbcTemplate.update("delete from users where username like ?", USER_PREFIX + "%");
  }

  @Test
  void rejectsReservedUsername() throws Exception {
    register("admin", 409, "该用户名不可用。");
  }

  @Test
  void rejectsReservedUsernameRegardlessOfCase() throws Exception {
    register("ADMIN", 409, "该用户名不可用。");
    register("Administrator", 409, "该用户名不可用。");
  }

  @Test
  void registersNormalUsernameAndRejectsDuplicate() throws Exception {
    String username = USER_PREFIX + "ok";
    register(username, 201, null);
    register(username, 409, "用户名已被占用。");
    register(username.toUpperCase(), 409, "用户名已被占用。");
  }

  private void register(String username, int expectedStatus, String expectedMessage) throws Exception {
    var request = mockMvc.perform(post("/api/v1/auth/register")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(Map.of(
            "username", username,
            "password", "visitor-password-2026"
        ))))
        .andExpect(status().is(expectedStatus));
    if (expectedStatus == 201) {
      request.andExpect(jsonPath("$.accessToken").isString());
    } else {
      request.andExpect(jsonPath("$.message").value(expectedMessage));
    }
  }
}
