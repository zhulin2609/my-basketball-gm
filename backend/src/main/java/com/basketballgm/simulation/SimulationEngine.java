package com.basketballgm.simulation;

import com.basketballgm.lineup.LineupMemberRow;
import com.basketballgm.player.PlayerResponse;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * Deterministic V1 statistics engine. The unsigned 32-bit generator and formulas intentionally
 * match the browser prototype so a seed keeps producing the same report after moving to Java.
 */
@Component
public class SimulationEngine {

  public SimulationResult simulate(
      List<LineupMemberRow> homeMembers,
      List<LineupMemberRow> awayMembers,
      Map<String, PlayerResponse> players,
      long seed
  ) {
    SeededRandom random = new SeededRandom(seed);
    List<SimulationPlayerStatResponse> homeStats = makeStats(homeMembers, players, random);
    List<SimulationPlayerStatResponse> awayStats = makeStats(awayMembers, players, random);
    int homeScore = totalPoints(homeStats);
    int awayScore = totalPoints(awayStats);

    // V1 has no overtime play-by-play, so a reproducible three-point tiebreak decides the winner.
    if (homeScore == awayScore) {
      if (random.next() > 0.5) homeScore += 3;
      else awayScore += 3;
    }

    return new SimulationResult(homeScore, awayScore, homeStats, awayStats);
  }

  private List<SimulationPlayerStatResponse> makeStats(
      List<LineupMemberRow> members,
      Map<String, PlayerResponse> players,
      SeededRandom random
  ) {
    List<LineupMemberRow> activeMembers = members.stream()
        .filter(member -> !"inactive".equals(member.role()))
        .toList();
    int totalUsage = activeMembers.stream()
        .mapToInt(member -> requiredPlayer(players, member.playerId()).shotTendency())
        .sum();
    double usageDenominator = Math.max(1, totalUsage);

    return activeMembers.stream()
        .map(member -> createStat(
            requiredPlayer(players, member.playerId()),
            "starter".equals(member.role()),
            usageDenominator,
            random
        ))
        .sorted(Comparator.comparingInt(SimulationPlayerStatResponse::points).reversed())
        .toList();
  }

  private SimulationPlayerStatResponse createStat(
      PlayerResponse player,
      boolean starter,
      double totalUsage,
      SeededRandom random
  ) {
    int minutes = Math.max(10, round((starter ? 32 : 18) + (random.next() - 0.5) * 8));
    double share = player.shotTendency() / totalUsage;
    int attempts = Math.max(3, round(48 * share * (minutes / 30.0) + random.next() * 3));
    int threeAttempted = Math.min(
        attempts,
        round(attempts * (0.13 + player.threePoint() / 180.0) * (0.8 + random.next() * 0.4))
    );
    int threeMade = Math.min(
        threeAttempted,
        round(threeAttempted * (0.24 + player.threePoint() / 210.0) * (0.88 + random.next() * 0.24))
    );
    int twoAttempted = attempts - threeAttempted;
    double finishing = (player.layup() + player.midRange() + player.insideScoring()) / 3.0;
    int twoMade = Math.min(
        twoAttempted,
        round(twoAttempted * (0.31 + finishing / 260.0) * (0.9 + random.next() * 0.2))
    );
    int freeThrows = round(
        (player.shotTendency() / 26.0 + random.next() * 3) * (player.freeThrow() / 100.0)
    );

    return new SimulationPlayerStatResponse(
        player.id(),
        player.name(),
        player.initials(),
        player.accent() == null ? "#777" : player.accent(),
        minutes,
        twoMade * 2 + threeMade * 3 + freeThrows,
        Math.max(0, round(
            ((player.offensiveRebound() + player.defensiveRebound()) / 2.0 / 12)
                * (minutes / 30.0)
                * (0.55 + random.next())
        )),
        Math.max(0, round((player.passing() / 18.0) * (minutes / 30.0) * (0.5 + random.next()))),
        Math.max(0, round((player.steal() / 62.0) * (minutes / 30.0) * (0.4 + random.next()))),
        Math.max(0, round((player.block() / 56.0) * (minutes / 30.0) * (0.3 + random.next()))),
        twoMade + threeMade,
        attempts,
        threeMade,
        threeAttempted
    );
  }

  private PlayerResponse requiredPlayer(Map<String, PlayerResponse> players, String playerId) {
    PlayerResponse player = players.get(playerId);
    if (player == null) throw new IllegalArgumentException("阵容包含不存在或无权使用的球员。");
    return player;
  }

  private int totalPoints(List<SimulationPlayerStatResponse> stats) {
    return stats.stream().mapToInt(SimulationPlayerStatResponse::points).sum();
  }

  private int round(double value) {
    return (int) Math.floor(value + 0.5);
  }

  private static final class SeededRandom {
    private long state;

    private SeededRandom(long seed) {
      state = seed & 0xffff_ffffL;
    }

    private double next() {
      state = (state * 1_664_525L + 1_013_904_223L) & 0xffff_ffffL;
      return state / 4_294_967_296.0;
    }
  }
}
