package com.basketballgm.guest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.LinkedHashMap;
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
class GuestImportApiTest {
  @Autowired private MockMvc mockMvc;
  @Autowired private JdbcTemplate jdbcTemplate;

  private final ObjectMapper objectMapper = new ObjectMapper();
  private final String usernamePrefix = "guest-" + UUID.randomUUID().toString().substring(0, 8);

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
  void importsOnceForTheOwnerAndRejectsASecondOwner() throws Exception {
    String firstToken = register(usernamePrefix + "-first");
    String secondToken = register(usernamePrefix + "-second");
    String workspaceId = UUID.randomUUID().toString();
    Map<String, Object> request = Map.of(
        "guestWorkspaceId", workspaceId,
        "players", List.of(),
        "lineups", List.of(Map.of(
            "id", "guest-five",
            "lineup", Map.of(
                "name", "Guest Five",
                "description", "Imported from this browser",
                "members", List.of()
            )
        )),
        "simulations", List.of()
    );
    String body = objectMapper.writeValueAsString(request);

    mockMvc.perform(post("/api/v1/guest-imports")
            .header("Authorization", "Bearer " + firstToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.guestWorkspaceId").value(workspaceId))
        .andExpect(jsonPath("$.alreadyImported").value(false))
        .andExpect(jsonPath("$.lineupCount").value(1));

    mockMvc.perform(post("/api/v1/guest-imports")
            .header("Authorization", "Bearer " + firstToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.alreadyImported").value(true))
        .andExpect(jsonPath("$.lineupCount").value(1));

    mockMvc.perform(get("/api/v1/lineups")
            .header("Authorization", "Bearer " + firstToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.id == 'guest-five')]").isNotEmpty());

    mockMvc.perform(post("/api/v1/guest-imports")
            .header("Authorization", "Bearer " + secondToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isConflict());
  }

  @Test
  void importsCustomPlayersAndRemapsTheirLineupReferences() throws Exception {
    String token = register(usernamePrefix + "-custom");
    String workspaceId = UUID.randomUUID().toString();
    Map<String, Object> request = Map.of(
        "guestWorkspaceId", workspaceId,
        "players", List.of(Map.of(
            "id", "guest-custom-player",
            "custom", true,
            "player", customPlayer()
        )),
        "lineups", List.of(Map.of(
            "id", "custom-lineup",
            "lineup", Map.of(
                "name", "Custom lineup",
                "description", "Includes a visitor-created player",
                "members", List.of(Map.of(
                    "playerId", "guest-custom-player",
                    "position", "PG",
                    "starter", false,
                    "inactive", false
                ))
            )
        )),
        "simulations", List.of()
    );

    mockMvc.perform(post("/api/v1/guest-imports")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.playerCount").value(1))
        .andExpect(jsonPath("$.lineupCount").value(1));

    mockMvc.perform(get("/api/v1/players").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.name == 'Visitor Star')]").isNotEmpty());

    mockMvc.perform(get("/api/v1/lineups").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.id == 'custom-lineup')].members[0]").isNotEmpty());
  }

  @Test
  void importsActiveReportsAndSkipsReportsThatAlreadyExpired() throws Exception {
    String token = register(usernamePrefix + "-reports");
    String workspaceId = UUID.randomUUID().toString();
    List<Map<String, Object>> lineups = List.of(
        importedLineup("home-team", "Home Team"),
        importedLineup("away-team", "Away Team")
    );
    Map<String, Object> request = Map.of(
        "guestWorkspaceId", workspaceId,
        "players", List.of(),
        "lineups", lineups,
        "simulations", List.of(
            importedSimulation("active-report", Instant.now().minusSeconds(86_400)),
            importedSimulation("expired-report", Instant.now().minusSeconds(31L * 86_400))
        )
    );

    mockMvc.perform(post("/api/v1/guest-imports")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.simulationCount").value(1));

    mockMvc.perform(get("/api/v1/simulations?limit=30")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].homeScore").value(108))
        .andExpect(jsonPath("$[0].awayScore").value(104))
        .andExpect(jsonPath("$[0].homeStats[0].playerId").value("curry"));
  }

  private Map<String, Object> importedLineup(String id, String name) {
    return Map.of(
        "id", id,
        "lineup", Map.of("name", name, "description", "Guest report team", "members", List.of())
    );
  }

  private Map<String, Object> importedSimulation(String id, Instant createdAt) {
    Map<String, Object> simulation = new LinkedHashMap<>();
    simulation.put("id", id);
    simulation.put("homeLineupId", "home-team");
    simulation.put("awayLineupId", "away-team");
    simulation.put("homeLineupName", "Home Team");
    simulation.put("awayLineupName", "Away Team");
    simulation.put("seed", 20260917);
    simulation.put("homeScore", 108);
    simulation.put("awayScore", 104);
    simulation.put("homeStats", List.of(importedStat("curry", "Stephen Curry")));
    simulation.put("awayStats", List.of(importedStat("jordan", "Michael Jordan")));
    simulation.put("engineVersion", "local-v1");
    simulation.put("createdAt", createdAt.toString());
    simulation.put("expiresAt", createdAt.plusSeconds(30L * 86_400).toString());
    return simulation;
  }

  private Map<String, Object> importedStat(String playerId, String playerName) {
    Map<String, Object> stat = new LinkedHashMap<>();
    stat.put("playerId", playerId);
    stat.put("playerName", playerName);
    stat.put("playerInitials", playerName.equals("Stephen Curry") ? "SC" : "MJ");
    stat.put("playerAccent", "#c3ec8b");
    stat.put("minutes", 36);
    stat.put("points", 30);
    stat.put("rebounds", 5);
    stat.put("assists", 8);
    stat.put("steals", 2);
    stat.put("blocks", 1);
    stat.put("fgMade", 11);
    stat.put("fgAttempted", 22);
    stat.put("threeMade", 5);
    stat.put("threeAttempted", 12);
    return stat;
  }

  private Map<String, Object> customPlayer() {
    Map<String, Object> player = new LinkedHashMap<>();
    player.put("name", "Visitor Star");
    player.put("initials", "VS");
    player.put("peakSeason", "2025-26");
    player.put("peakTeam", "Dream Court");
    player.put("defaultPosition", "PG");
    player.put("heightFeet", 6);
    player.put("heightInches", 3);
    player.put("weightLbs", 195);
    player.put("salaryUsd", 0);
    player.put("archetype", "Creator");
    player.put("bio", "Created while playing as a guest.");
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
