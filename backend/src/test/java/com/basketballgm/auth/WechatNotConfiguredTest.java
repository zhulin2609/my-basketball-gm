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

/** 未配置微信凭据时，扫码登录与微信交换都必须明确失败，且不影响密码登录。 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WechatNotConfiguredTest {
  private static final String USER_PREFIX = "nocfg-" + UUID.randomUUID().toString().substring(0, 8) + "-";

  @Autowired private MockMvc mockMvc;
  @Autowired private JdbcTemplate jdbcTemplate;

  private final ObjectMapper objectMapper = new ObjectMapper();

  @AfterEach
  void cleanUsers() {
    jdbcTemplate.update("delete from users where username like ?", USER_PREFIX + "%");
    jdbcTemplate.update("delete from web_login_tickets");
  }

  @Test
  void ticketCreationFailsClearlyWithoutWechatConfiguration() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/auth/web-login-tickets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(Map.of("browserBinding", UUID.randomUUID().toString()))))
        .andExpect(status().isServiceUnavailable())
        .andExpect(jsonPath("$.code").value("WECHAT_NOT_CONFIGURED"));
  }

  @Test
  void wechatExchangeFailsClearlyWithoutWechatConfiguration() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/auth/wechat/exchange")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("code", "any-code"))))
        .andExpect(status().isServiceUnavailable())
        .andExpect(jsonPath("$.code").value("WECHAT_NOT_CONFIGURED"));
  }

  @Test
  void passwordLoginKeepsWorkingWithoutWechatConfiguration() throws Exception {
    String username = USER_PREFIX + "ok";
    String body = objectMapper.writeValueAsString(Map.of("username", username, "password", "visitor-password-2026"));
    mockMvc
        .perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isCreated());
    mockMvc
        .perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accessToken").isString());
  }
}
