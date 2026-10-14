package com.basketballgm.simulation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Timestamp;
import java.time.Instant;
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

/** 历史战报的分页与按 ID 详情读取：覆盖全部有效记录、所有权与到期边界。 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SimulationApiTest {
  private static final String USER_PREFIX = "sim-" + UUID.randomUUID().toString().substring(0, 8) + "-";

  @Autowired private MockMvc mockMvc;
  @Autowired private JdbcTemplate jdbcTemplate;

  private final ObjectMapper objectMapper = new ObjectMapper();

  @AfterEach
  void cleanUsers() {
    jdbcTemplate.update(
        "delete from users where username like ?", USER_PREFIX + "%");
  }

  @Test
  void paginatesAllActiveReportsAndReadsDetailsById() throws Exception {
    String token = register(USER_PREFIX + "pages");
    saveLineup(token, "home-alpha", "主队");
    saveLineup(token, "away-alpha", "客队");
    String first = createSimulation(token, "home-alpha", "away-alpha");
    String second = createSimulation(token, "home-alpha", "away-alpha");

    String pageOne = listBody(token, 1, 0);
    String pageTwo = listBody(token, 1, 1);
    JsonNode firstPage = objectMapper.readTree(pageOne);
    JsonNode secondPage = objectMapper.readTree(pageTwo);
    assertEquals(1, firstPage.size());
    assertEquals(1, secondPage.size());
    assertNotEquals(firstPage.get(0).get("id").asText(), secondPage.get(0).get("id").asText());

    mockMvc
        .perform(get("/api/v1/simulations/" + first).header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(first))
        .andExpect(jsonPath("$.homeStats[0].playerId").isString());

    mockMvc
        .perform(get("/api/v1/simulations/" + second).header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.engineVersion").value("v1"));
  }

  @Test
  void detailRejectsOtherUsersAndExpiredReports() throws Exception {
    String owner = register(USER_PREFIX + "owner");
    saveLineup(owner, "home-owner", "主队");
    saveLineup(owner, "away-owner", "客队");
    String report = createSimulation(owner, "home-owner", "away-owner");

    String stranger = register(USER_PREFIX + "stranger");
    mockMvc
        .perform(get("/api/v1/simulations/" + report).header("Authorization", "Bearer " + stranger))
        .andExpect(status().isNotFound());

    jdbcTemplate.update(
        "update simulations set created_at = ?, expires_at = ? where id = cast(? as uuid)",
        Timestamp.from(Instant.now().minusSeconds(31L * 86_400)),
        Timestamp.from(Instant.now().minusSeconds(31L * 86_400).plusSeconds(29L * 86_400)),
        report);
    mockMvc
        .perform(get("/api/v1/simulations/" + report).header("Authorization", "Bearer " + owner))
        .andExpect(status().isNotFound());
    mockMvc
        .perform(get("/api/v1/simulations/" + UUID.randomUUID())
            .header("Authorization", "Bearer " + owner))
        .andExpect(status().isNotFound());
  }

  private String register(String username) throws Exception {
    String response = mockMvc
        .perform(
            post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of("username", username, "password", "visitor-password-2026"))))
        .andExpect(status().isCreated())
        .andReturn()
        .getResponse()
        .getContentAsString();
    return objectMapper.readTree(response).get("accessToken").asText();
  }

  private void saveLineup(String token, String clientKey, String name) throws Exception {
    List<Map<String, Object>> members = List.of(
        member("curry", "PG"),
        member("jordan", "SG"),
        member("durant", "SF"),
        member("duncan", "PF"),
        member("jokic", "C"));
    mockMvc
        .perform(
            put("/api/v1/lineups/" + clientKey)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of("name", name, "description", "", "members", members))))
        .andExpect(status().isOk());
  }

  private Map<String, Object> member(String playerId, String position) {
    return Map.of("playerId", playerId, "position", position, "starter", true, "inactive", false);
  }

  private String createSimulation(String token, String home, String away) throws Exception {
    String response = mockMvc
        .perform(
            post("/api/v1/simulations")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of(
                            "homeLineupId", home,
                            "awayLineupId", away,
                            "simulationMode", "local"))))
        .andReturn()
        .getResponse()
        .getContentAsString();
    return objectMapper.readTree(response).get("id").asText();
  }

  private String listBody(String token, int limit, int offset) throws Exception {
    return mockMvc
        .perform(
            get("/api/v1/simulations?limit=" + limit + "&offset=" + offset)
                .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();
  }
}
