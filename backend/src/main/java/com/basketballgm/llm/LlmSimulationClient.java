package com.basketballgm.llm;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.basketballgm.lineup.LineupMemberRow;
import com.basketballgm.player.PlayerResponse;
import com.basketballgm.simulation.SimulationPlayerStatResponse;
import com.basketballgm.simulation.SimulationResult;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/** Calls an OpenAI-compatible chat-completions endpoint and validates its JSON-only box score. */
@Component
public class LlmSimulationClient {
  private static final Logger LOGGER = LoggerFactory.getLogger(LlmSimulationClient.class);
  private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(75);
  private static final int OUTPUT_TOKENS_PER_PLAYER = 350;
  private static final int MINIMUM_OUTPUT_TOKENS = 4_000;
  private static final int MAXIMUM_OUTPUT_TOKENS = 8_000;
  private static final String REPORT_CONTRACT = """
      Return exactly one compact JSON object with this shape and no other keys:
      {
        "schemaVersion": 1,
        "homeStats": [{
          "playerId": "copy from input",
          "minutes": 0,
          "points": 0,
          "rebounds": 0,
          "assists": 0,
          "steals": 0,
          "blocks": 0,
          "fgMade": 0,
          "fgAttempted": 0,
          "threeMade": 0,
          "threeAttempted": 0
        }],
        "awayStats": [{same fields as homeStats}]
      }
      """;

  private final HttpClient httpClient;
  private final Duration requestTimeout;
  // Provider payload parsing is isolated from Spring's HTTP serialization configuration.
  private final ObjectMapper objectMapper = new ObjectMapper();
  private final LlmResponseContentExtractor responseExtractor = new LlmResponseContentExtractor(objectMapper);

  public LlmSimulationClient() {
    this(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build(), REQUEST_TIMEOUT);
  }

  LlmSimulationClient(HttpClient httpClient, Duration requestTimeout) {
    this.httpClient = httpClient;
    this.requestTimeout = requestTimeout;
  }

  public SimulationResult simulate(
      LlmCredentialRow credential,
      String apiKey,
      List<LineupMemberRow> homeMembers,
      List<LineupMemberRow> awayMembers,
      Map<String, PlayerResponse> players
  ) {
    List<MemberInput> home = activeMembers(homeMembers, players);
    List<MemberInput> away = activeMembers(awayMembers, players);
    String body = requestBody(credential, home, away);
    HttpRequest request = HttpRequest.newBuilder(URI.create(credential.baseUrl() + "/chat/completions"))
        .timeout(requestTimeout)
        .header("Authorization", "Bearer " + apiKey)
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .build();

    HttpResponse<String> response = sendRequest(request);
    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new ResponseStatusException(
          HttpStatus.BAD_GATEWAY,
          "模型服务返回 HTTP " + response.statusCode() + "，请检查接口地址、模型名和 API Key。"
      );
    }
    return parseResult(response.body(), home, away);
  }

  HttpResponse<String> sendRequest(HttpRequest request) {
    CompletableFuture<HttpResponse<String>> pendingResponse = httpClient.sendAsync(
        request,
        HttpResponse.BodyHandlers.ofString()
    );
    try {
      return pendingResponse.get(requestTimeout.toMillis(), TimeUnit.MILLISECONDS);
    } catch (TimeoutException exception) {
      pendingResponse.cancel(true);
      throw new ResponseStatusException(
          HttpStatus.GATEWAY_TIMEOUT,
          "模型生成超时，请重试或换用响应更快的模型。",
          exception
      );
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "模型请求被中断，请稍后重试。", exception);
    } catch (ExecutionException exception) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "无法调用模型服务，请检查接口地址和网络。", exception);
    }
  }

  private List<MemberInput> activeMembers(
      List<LineupMemberRow> members,
      Map<String, PlayerResponse> players
  ) {
    return members.stream()
        .filter(member -> !"inactive".equals(member.role()))
        .map(member -> {
          PlayerResponse player = players.get(member.playerId());
          if (player == null) throw new IllegalArgumentException("阵容包含不存在或无权使用的球员。");
          return new MemberInput(member.playerId(), member.position(), "starter".equals(member.role()), player);
        })
        .toList();
  }

  private String requestBody(
      LlmCredentialRow credential,
      List<MemberInput> home,
      List<MemberInput> away
  ) {
    ObjectNode root = objectMapper.createObjectNode();
    root.put("model", credential.model());
    root.put("temperature", 0.4);
    root.put("max_tokens", outputTokenBudget(home.size() + away.size()));
    addProviderOptions(root, credential.baseUrl());
    ArrayNode messages = root.putArray("messages");
    messages.addObject()
        .put("role", "system")
        .put("content", "You are a basketball simulation JSON API, not a conversational assistant. "
            + "Do not explain, plan, show calculations, or reveal reasoning. Start the response with { and end with }. "
            + REPORT_CONTRACT
            + "Include every supplied player exactly once in the matching side and copy playerId verbatim. "
            + "Use only non-negative integers. Use realistic minutes and box-score values. "
            + "fgMade <= fgAttempted; threeMade <= threeAttempted <= fgAttempted. "
            + "points must be at least 2 * fgMade + threeMade and may exceed it only by plausible free throws. "
            + "The two teams must not finish tied. Output the JSON immediately.");
    ObjectNode game = objectMapper.createObjectNode();
    game.put("instruction", "Simulate one fictional game and obey the system JSON contract exactly.");
    game.set("home", teamJson(home));
    game.set("away", teamJson(away));
    messages.addObject().put("role", "user").put("content", game.toString());
    try {
      return objectMapper.writeValueAsString(root);
    } catch (JsonProcessingException exception) {
      throw new IllegalStateException("无法构造模型请求。", exception);
    }
  }

  /** Provider-specific options stay at this boundary so the common report contract remains portable. */
  void addProviderOptions(ObjectNode request, String baseUrl) {
    URI uri = URI.create(baseUrl);
    String host = uri.getHost();
    if (host == null) return;

    if (host.equals("api.openai.com")) {
      request.set("response_format", objectMapper.createObjectNode().put("type", "json_object"));
    } else if (host.equals("openrouter.ai") || host.endsWith(".openrouter.ai")) {
      request.putObject("reasoning")
          .put("effort", "minimal")
          .put("exclude", true);
    }
  }

  private int outputTokenBudget(int playerCount) {
    int requested = 1_500 + playerCount * OUTPUT_TOKENS_PER_PLAYER;
    return Math.max(MINIMUM_OUTPUT_TOKENS, Math.min(requested, MAXIMUM_OUTPUT_TOKENS));
  }

  private ArrayNode teamJson(List<MemberInput> team) {
    ArrayNode result = objectMapper.createArrayNode();
    team.forEach(member -> {
      PlayerResponse player = member.player();
      result.addObject()
          .put("playerId", member.playerId())
          .put("position", member.position())
          .put("starter", member.starter())
          .put("name", player.name())
          .put("threePoint", player.threePoint())
          .put("layup", player.layup())
          .put("midRange", player.midRange())
          .put("insideScoring", player.insideScoring())
          .put("passing", player.passing())
          .put("defensiveIQ", player.defensiveIQ())
          .put("offensiveRebound", player.offensiveRebound())
          .put("defensiveRebound", player.defensiveRebound())
          .put("steal", player.steal())
          .put("block", player.block())
          .put("stamina", player.stamina())
          .put("shotTendency", player.shotTendency());
    });
    return result;
  }

  private SimulationResult parseResult(String providerBody, List<MemberInput> home, List<MemberInput> away) {
    try {
      JsonNode result = responseExtractor.extractReport(providerBody);
      if (result.has("schemaVersion") && result.path("schemaVersion").asInt(-1) != 1) {
        throw invalidResult();
      }
      List<SimulationPlayerStatResponse> homeStats = parseTeam(result.path("homeStats"), home);
      List<SimulationPlayerStatResponse> awayStats = parseTeam(result.path("awayStats"), away);
      int homeScore = totalPoints(homeStats);
      int awayScore = totalPoints(awayStats);
      if (homeScore == awayScore) throw invalidResult();
      return new SimulationResult(homeScore, awayScore, homeStats, awayStats);
    } catch (LlmResponseFormatException exception) {
      LOGGER.warn("LLM report rejected: {}", exception.getMessage());
      throw new ResponseStatusException(
          HttpStatus.BAD_GATEWAY,
          "模型没有返回完整、有效的比赛数据，请重试或更换模型。",
          exception
      );
    }
  }

  private List<SimulationPlayerStatResponse> parseTeam(JsonNode rawStats, List<MemberInput> team) {
    if (!rawStats.isArray() || rawStats.size() != team.size()) throw invalidResult();
    Map<String, MemberInput> expected = new HashMap<>();
    team.forEach(member -> expected.put(member.playerId(), member));
    Set<String> found = new HashSet<>();
    List<SimulationPlayerStatResponse> stats = new ArrayList<>();
    for (JsonNode raw : rawStats) {
      String playerId = raw.path("playerId").asText();
      MemberInput member = expected.get(playerId);
      if (member == null || !found.add(playerId)) throw invalidResult();
      int minutes = requiredInt(raw, "minutes", 0, 60);
      int points = requiredInt(raw, "points", 0, 150);
      int rebounds = requiredInt(raw, "rebounds", 0, 60);
      int assists = requiredInt(raw, "assists", 0, 40);
      int steals = requiredInt(raw, "steals", 0, 20);
      int blocks = requiredInt(raw, "blocks", 0, 20);
      int fgMade = requiredInt(raw, "fgMade", 0, 80);
      int fgAttempted = requiredInt(raw, "fgAttempted", 0, 100);
      int threeMade = requiredInt(raw, "threeMade", 0, 50);
      int threeAttempted = requiredInt(raw, "threeAttempted", 0, 70);
      if (fgMade > fgAttempted || threeMade > threeAttempted || threeAttempted > fgAttempted) {
        throw invalidResult();
      }
      int minimumPointsFromFieldGoals = 2 * fgMade + threeMade;
      if (points < minimumPointsFromFieldGoals || points > minimumPointsFromFieldGoals + 50) {
        throw invalidResult();
      }
      PlayerResponse player = member.player();
      stats.add(new SimulationPlayerStatResponse(
          playerId, player.name(), player.initials(), player.accent() == null ? "#777" : player.accent(),
          minutes, points, rebounds, assists, steals, blocks, fgMade, fgAttempted, threeMade, threeAttempted
      ));
    }
    return stats.stream().sorted((left, right) -> Integer.compare(right.points(), left.points())).toList();
  }

  private int requiredInt(JsonNode raw, String field, int minimum, int maximum) {
    JsonNode value = raw.get(field);
    if (value == null || !value.isInt()) throw invalidResult();
    int parsed = value.intValue();
    if (parsed < minimum || parsed > maximum) throw invalidResult();
    return parsed;
  }

  private int totalPoints(List<SimulationPlayerStatResponse> stats) {
    return stats.stream().mapToInt(SimulationPlayerStatResponse::points).sum();
  }

  private LlmResponseFormatException invalidResult() {
    return new LlmResponseFormatException("战报字段缺失、重复或不符合比赛数据约束。");
  }

  private record MemberInput(String playerId, String position, boolean starter, PlayerResponse player) {}
}
