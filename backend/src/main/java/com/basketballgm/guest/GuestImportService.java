package com.basketballgm.guest;

import com.basketballgm.lineup.LineupMapper;
import com.basketballgm.lineup.LineupMemberPayload;
import com.basketballgm.lineup.LineupMemberWrite;
import com.basketballgm.lineup.LineupPayload;
import com.basketballgm.player.PlayerMapper;
import com.basketballgm.simulation.SimulationIdentity;
import com.basketballgm.simulation.SimulationMapper;
import com.basketballgm.simulation.SimulationStatWrite;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GuestImportService {
  private final GuestImportMapper guestImportMapper;
  private final LineupMapper lineupMapper;
  private final PlayerMapper playerMapper;
  private final SimulationMapper simulationMapper;

  public GuestImportService(
      GuestImportMapper guestImportMapper,
      LineupMapper lineupMapper,
      PlayerMapper playerMapper,
      SimulationMapper simulationMapper
  ) {
    this.guestImportMapper = guestImportMapper;
    this.lineupMapper = lineupMapper;
    this.playerMapper = playerMapper;
    this.simulationMapper = simulationMapper;
  }

  @Transactional
  public GuestImportResponse importWorkspace(UUID ownerId, GuestImportRequest request) {
    if (guestImportMapper.reserve(request.guestWorkspaceId(), ownerId) == 0) {
      GuestImportRow existing = guestImportMapper.find(request.guestWorkspaceId());
      if (existing == null) throw new IllegalStateException("游客存档导入状态读取失败。");
      if (!existing.ownerId().equals(ownerId)) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "这份游客存档已经导入到另一个账号。");
      }
      return response(existing, true);
    }

    Map<String, String> importedPlayerIds = importPlayers(ownerId, request.players());
    for (GuestLineupImport imported : request.lineups()) {
      LineupPayload lineup = remapLineup(imported.lineup(), importedPlayerIds);
      String validationMessage = lineup.validationMessage();
      if (validationMessage != null) throw new IllegalArgumentException(validationMessage);

      lineupMapper.upsert(ownerId, imported.id(), lineup);
      String databaseId = lineupMapper.findDatabaseId(ownerId, imported.id());
      lineupMapper.deleteMembers(databaseId);
      List<LineupMemberWrite> members = toWrites(lineup.members());
      if (!members.isEmpty() && lineupMapper.insertMembers(databaseId, ownerId, members) != members.size()) {
        throw new IllegalArgumentException("阵容包含不存在或无权使用的球员。");
      }
    }
    int simulationCount = importSimulations(
        ownerId,
        request.simulations(),
        importedPlayerIds
    );

    guestImportMapper.finish(
        request.guestWorkspaceId(),
        ownerId,
        request.players().size(),
        request.lineups().size(),
        simulationCount
    );
    return new GuestImportResponse(
        request.guestWorkspaceId(),
        false,
        request.players().size(),
        request.lineups().size(),
        simulationCount
    );
  }

  private Map<String, String> importPlayers(UUID ownerId, List<GuestPlayerImport> players) {
    Map<String, String> importedIds = new HashMap<>();
    for (GuestPlayerImport imported : players) {
      if (imported.custom()) {
        importedIds.put(imported.id(), playerMapper.insert(ownerId, imported.player()));
      } else {
        if (playerMapper.upsertOverride(imported.id(), ownerId, imported.player()) == 0) {
          throw new IllegalArgumentException("游客存档包含不存在的预置球员。");
        }
        importedIds.put(imported.id(), imported.id());
      }
    }
    return importedIds;
  }

  private LineupPayload remapLineup(LineupPayload lineup, Map<String, String> importedPlayerIds) {
    List<LineupMemberPayload> members = lineup.members().stream()
        .map(member -> new LineupMemberPayload(
            importedPlayerIds.getOrDefault(member.playerId(), member.playerId()),
            member.position(),
            member.starter(),
            member.inactive()
        ))
        .toList();
    return new LineupPayload(lineup.name(), lineup.description(), members);
  }

  private int importSimulations(
      UUID ownerId,
      List<GuestSimulationImport> simulations,
      Map<String, String> importedPlayerIds
  ) {
    int importedCount = 0;
    Instant now = Instant.now();
    for (GuestSimulationImport imported : simulations) {
      Instant retentionLimit = imported.createdAt().plus(Duration.ofDays(30));
      if (imported.createdAt().isAfter(now.plus(Duration.ofMinutes(5)))) {
        throw new IllegalArgumentException("游客战报的创建时间不能晚于当前时间。");
      }
      if (!imported.expiresAt().isAfter(imported.createdAt())
          || imported.expiresAt().isAfter(retentionLimit)) {
        throw new IllegalArgumentException("游客战报的有效期不符合 30 天保留规则。");
      }
      if (!imported.expiresAt().isAfter(now)) continue;
      if (imported.homeLineupId().equals(imported.awayLineupId())) {
        throw new IllegalArgumentException("游客战报必须包含两套不同阵容。");
      }

      String homeDatabaseId = lineupMapper.findDatabaseId(ownerId, imported.homeLineupId());
      String awayDatabaseId = lineupMapper.findDatabaseId(ownerId, imported.awayLineupId());
      if (homeDatabaseId == null || awayDatabaseId == null) {
        throw new IllegalArgumentException("游客战报引用了不存在的阵容。");
      }

      SimulationIdentity identity = simulationMapper.insertImported(
          ownerId,
          homeDatabaseId,
          awayDatabaseId,
          imported.homeLineupName(),
          imported.awayLineupName(),
          imported.seed(),
          imported.homeScore(),
          imported.awayScore(),
          imported.engineVersion(),
          imported.createdAt(),
          imported.expiresAt()
      );
      List<SimulationStatWrite> stats = toSimulationWrites(imported, importedPlayerIds);
      if (!stats.isEmpty() && simulationMapper.insertStats(identity.id(), ownerId, stats) != stats.size()) {
        throw new IllegalArgumentException("游客战报包含不存在或无权使用的球员。");
      }
      importedCount++;
    }
    return importedCount;
  }

  private List<SimulationStatWrite> toSimulationWrites(
      GuestSimulationImport simulation,
      Map<String, String> importedPlayerIds
  ) {
    List<SimulationStatWrite> writes = new ArrayList<>();
    simulation.homeStats().forEach(stat -> writes.add(
        toSimulationWrite("home", stat, importedPlayerIds)
    ));
    simulation.awayStats().forEach(stat -> writes.add(
        toSimulationWrite("away", stat, importedPlayerIds)
    ));
    return writes;
  }

  private SimulationStatWrite toSimulationWrite(
      String side,
      GuestSimulationStat stat,
      Map<String, String> importedPlayerIds
  ) {
    if (stat.fgMade() > stat.fgAttempted() || stat.threeMade() > stat.threeAttempted()) {
      throw new IllegalArgumentException("游客战报的投篮统计不合法。");
    }
    return new SimulationStatWrite(
        side,
        importedPlayerIds.getOrDefault(stat.playerId(), stat.playerId()),
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

  private GuestImportResponse response(GuestImportRow row, boolean alreadyImported) {
    return new GuestImportResponse(
        row.guestWorkspaceId(),
        alreadyImported,
        row.playerCount(),
        row.lineupCount(),
        row.simulationCount()
    );
  }

  private List<LineupMemberWrite> toWrites(List<LineupMemberPayload> members) {
    List<LineupMemberWrite> writes = new ArrayList<>();
    for (int index = 0; index < members.size(); index++) {
      LineupMemberPayload member = members.get(index);
      String role = member.inactive() ? "inactive" : member.starter() ? "starter" : "bench";
      writes.add(new LineupMemberWrite(member.playerId(), member.position(), role, index));
    }
    return writes;
  }
}
