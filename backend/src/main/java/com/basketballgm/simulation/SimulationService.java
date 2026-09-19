package com.basketballgm.simulation;

import com.basketballgm.lineup.LineupMapper;
import com.basketballgm.lineup.LineupMemberRow;
import com.basketballgm.lineup.LineupRow;
import com.basketballgm.llm.AiSimulationService;
import com.basketballgm.player.PlayerMapper;
import com.basketballgm.player.PlayerResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Coordinates ownership checks, deterministic simulation, and atomic report persistence. */
@Service
public class SimulationService {
  private static final Set<String> STARTER_POSITIONS = Set.of("PG", "SG", "SF", "PF", "C");
  private static final String ENGINE_VERSION = "v1";

  private final SimulationMapper simulationMapper;
  private final LineupMapper lineupMapper;
  private final PlayerMapper playerMapper;
  private final SimulationEngine engine;
  private final AiSimulationService aiSimulationService;

  public SimulationService(
      SimulationMapper simulationMapper,
      LineupMapper lineupMapper,
      PlayerMapper playerMapper,
      SimulationEngine engine,
      AiSimulationService aiSimulationService
  ) {
    this.simulationMapper = simulationMapper;
    this.lineupMapper = lineupMapper;
    this.playerMapper = playerMapper;
    this.engine = engine;
    this.aiSimulationService = aiSimulationService;
  }

  @Transactional(readOnly = true)
  public List<SimulationResponse> list(UUID ownerId, int requestedLimit) {
    int limit = Math.max(1, Math.min(requestedLimit, 100));
    List<SimulationRow> reports = simulationMapper.list(ownerId, limit);
    Map<String, List<SimulationPlayerStatResponse>> homeStats = new HashMap<>();
    Map<String, List<SimulationPlayerStatResponse>> awayStats = new HashMap<>();

    for (SimulationStatRow row : simulationMapper.listStats(ownerId, limit)) {
      Map<String, List<SimulationPlayerStatResponse>> target = "home".equals(row.side())
          ? homeStats
          : awayStats;
      target.computeIfAbsent(row.simulationId(), ignored -> new ArrayList<>()).add(toResponse(row));
    }

    return reports.stream()
        .map(report -> new SimulationResponse(
            report.id(),
            report.homeLineupId(),
            report.awayLineupId(),
            report.homeLineupName(),
            report.awayLineupName(),
            report.seed(),
            report.homeScore(),
            report.awayScore(),
            homeStats.getOrDefault(report.id(), List.of()),
            awayStats.getOrDefault(report.id(), List.of()),
            report.engineVersion(),
            report.createdAt(),
            report.expiresAt()
        ))
        .toList();
  }

  @Transactional
  public SimulationResponse create(UUID ownerId, SimulationRequest request) {
    if (request.homeLineupId().equals(request.awayLineupId())) {
      throw new IllegalArgumentException("请选择两套不同的阵容进行比赛。");
    }

    LineupRow home = requiredLineup(ownerId, request.homeLineupId());
    LineupRow away = requiredLineup(ownerId, request.awayLineupId());
    List<LineupMemberRow> homeMembers = lineupMapper.findMembers(ownerId, home.id());
    List<LineupMemberRow> awayMembers = lineupMapper.findMembers(ownerId, away.id());
    validateForSimulation(homeMembers, home.name());
    validateForSimulation(awayMembers, away.name());

    Map<String, PlayerResponse> players = effectivePlayers(ownerId);
    long seed = request.seed() == null
        ? ThreadLocalRandom.current().nextLong(1L << 31)
        : request.seed();
    SimulationMode simulationMode = SimulationMode.resolve(request.simulationMode());
    AiSimulationService.AiSimulationResult aiResult = simulationMode == SimulationMode.AI
        ? aiSimulationService.simulateRequired(ownerId, homeMembers, awayMembers, players)
        : null;
    SimulationResult result = aiResult == null
        ? engine.simulate(homeMembers, awayMembers, players, seed)
        : aiResult.result();
    String engineVersion = aiResult == null ? ENGINE_VERSION : aiResult.engineVersion();
    String homeDatabaseId = lineupMapper.findDatabaseId(ownerId, home.id());
    String awayDatabaseId = lineupMapper.findDatabaseId(ownerId, away.id());
    SimulationIdentity identity = simulationMapper.insert(
        ownerId,
        homeDatabaseId,
        awayDatabaseId,
        home.name(),
        away.name(),
        seed,
        result.homeScore(),
        result.awayScore(),
        engineVersion
    );

    List<SimulationStatWrite> writes = toWrites(result);
    if (simulationMapper.insertStats(identity.id(), ownerId, writes) != writes.size()) {
      throw new IllegalArgumentException("战报包含不存在或无权使用的球员。");
    }

    return new SimulationResponse(
        identity.id(),
        home.id(),
        away.id(),
        home.name(),
        away.name(),
        seed,
        result.homeScore(),
        result.awayScore(),
        result.homeStats(),
        result.awayStats(),
        engineVersion,
        identity.createdAt(),
        identity.expiresAt()
    );
  }

  private LineupRow requiredLineup(UUID ownerId, String lineupId) {
    LineupRow lineup = lineupMapper.find(ownerId, lineupId);
    if (lineup == null) throw new IllegalArgumentException("未找到该阵容，或当前用户无权使用。");
    return lineup;
  }

  private void validateForSimulation(List<LineupMemberRow> members, String lineupName) {
    if (members.size() < 5 || members.size() > 15) {
      throw new IllegalArgumentException(lineupName + " 必须包含 5–15 名球员。");
    }

    long activeCount = members.stream().filter(member -> !"inactive".equals(member.role())).count();
    List<LineupMemberRow> starters = members.stream()
        .filter(member -> "starter".equals(member.role()))
        .toList();
    Set<String> starterPositions = starters.stream()
        .map(LineupMemberRow::position)
        .collect(Collectors.toCollection(HashSet::new));

    if (activeCount > 13) throw new IllegalArgumentException(lineupName + " 最多只能有 13 名激活球员。");
    if (starters.size() != 5 || !starterPositions.equals(STARTER_POSITIONS)) {
      throw new IllegalArgumentException(lineupName + " 的首发必须恰好包含 PG、SG、SF、PF、C 各一人。");
    }
  }

  private Map<String, PlayerResponse> effectivePlayers(UUID ownerId) {
    return playerMapper.list(ownerId).stream()
        .map(player -> {
          if (player.isCustom()) return player;
          PlayerResponse override = playerMapper.findOverride(ownerId, player.id());
          return override == null ? player : override;
        })
        .collect(Collectors.toMap(PlayerResponse::id, Function.identity()));
  }

  private List<SimulationStatWrite> toWrites(SimulationResult result) {
    List<SimulationStatWrite> writes = new ArrayList<>();
    result.homeStats().forEach(stat -> writes.add(toWrite("home", stat)));
    result.awayStats().forEach(stat -> writes.add(toWrite("away", stat)));
    return writes;
  }

  private SimulationStatWrite toWrite(String side, SimulationPlayerStatResponse stat) {
    return new SimulationStatWrite(
        side,
        stat.playerId(),
        stat.playerName(),
        stat.playerInitials(),
        stat.playerAccent(),
        stat.minutes(),
        stat.points(),
        stat.rebounds(),
        stat.assists(),
        stat.steals(),
        stat.blocks(),
        stat.fgMade(),
        stat.fgAttempted(),
        stat.threeMade(),
        stat.threeAttempted()
    );
  }

  private SimulationPlayerStatResponse toResponse(SimulationStatRow row) {
    return new SimulationPlayerStatResponse(
        row.playerId(),
        row.playerName(),
        row.playerInitials(),
        row.playerAccent(),
        row.minutes(),
        row.points(),
        row.rebounds(),
        row.assists(),
        row.steals(),
        row.blocks(),
        row.fgMade(),
        row.fgAttempted(),
        row.threeMade(),
        row.threeAttempted()
    );
  }
}
