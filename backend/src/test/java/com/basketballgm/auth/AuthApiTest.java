package com.basketballgm.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
import org.springframework.dao.DataIntegrityViolationException;
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
    // acceptsTwoCharacterUsernames 的用例名无法携带随机前缀（那会使长度不再是 2），按名精确清理。
    jdbcTemplate.update("delete from users where username in ('张三', 'ab')");
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

  @Test
  void acceptsHanUsernames() throws Exception {
    register("球员" + USER_PREFIX, 201, null);
    register("球员鿿" + USER_PREFIX, 201, null);
  }

  @Test
  void acceptsTwoCharacterUsernames() throws Exception {
    // 真实边界：恰好两个字符的中文与 ASCII 用户名，注册成功且记录持久化。
    jdbcTemplate.update("delete from users where username in ('张三', 'ab')");
    register("张三", 201, null);
    register("ab", 201, null);
    Integer persisted = jdbcTemplate.queryForObject(
        "select count(*) from users where username in ('张三', 'ab')", Integer.class);
    assertEquals(2, persisted.intValue());
    register("张三", 409, "用户名已被占用。");
  }

  @Test
  void rejectsUsernamesOutsideTheAllowedCharacterSet() throws Exception {
    register("한국어用户", 400, "username 字段不合法。");
    register("张三😀", 400, "username 字段不合法。");
    register("张 三", 400, "username 字段不合法。");
    register("éclair用户", 400, "username 字段不合法。");
    register("短", 400, "username 字段不合法。");
    register("超长".repeat(16) + "名", 400, "username 字段不合法。");
  }

  @Test
  void databaseConstraintMatchesTheApiRule() {
    String hanUsername = "库级" + UUID.randomUUID().toString().substring(0, 8);
    jdbcTemplate.update("insert into users (username, display_name) values (?, ?)", hanUsername, hanUsername);
    jdbcTemplate.update("delete from users where username = ?", hanUsername);

    String boundary = "球员鿿" + UUID.randomUUID().toString().substring(0, 6);
    jdbcTemplate.update("insert into users (username, display_name) values (?, ?)", boundary, boundary);
    jdbcTemplate.update("delete from users where username = ?", boundary);

    org.junit.jupiter.api.Assertions.assertThrows(
        DataIntegrityViolationException.class,
        () -> jdbcTemplate.update("insert into users (username) values (?)", "한국어")
    );
    org.junit.jupiter.api.Assertions.assertThrows(
        DataIntegrityViolationException.class,
        () -> jdbcTemplate.update("insert into users (username) values (?)", "张 三")
    );
    org.junit.jupiter.api.Assertions.assertThrows(
        DataIntegrityViolationException.class,
        () -> jdbcTemplate.update("insert into users (username) values (?)", "球员ꀀ鿿")
    );

    // 数据库直接覆盖长度边界：2 与 32 合法，1 与 33 非法。
    org.junit.jupiter.api.Assertions.assertThrows(
        DataIntegrityViolationException.class,
        () -> jdbcTemplate.update("insert into users (username) values (?)", "两")
    );
    String longest = "长".repeat(32);
    jdbcTemplate.update("insert into users (username) values (?)", longest);
    jdbcTemplate.update("delete from users where username = ?", longest);
    org.junit.jupiter.api.Assertions.assertThrows(
        DataIntegrityViolationException.class,
        () -> jdbcTemplate.update("insert into users (username) values (?)", "长".repeat(33))
    );

    // 恰好两个字符的注册值在数据库层合法；使用后精确清理。
    jdbcTemplate.update("delete from users where username in ('张三', 'ab')");
    jdbcTemplate.update("insert into users (username) values (?)", "张三");
    jdbcTemplate.update("insert into users (username) values (?)", "ab");
    jdbcTemplate.update("delete from users where username in ('张三', 'ab')");
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
