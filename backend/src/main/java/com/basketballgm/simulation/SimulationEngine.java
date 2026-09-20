package com.basketballgm.simulation;

import com.basketballgm.lineup.LineupMemberRow;
import com.basketballgm.player.PlayerResponse;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;
import org.springframework.stereotype.Component;

/**
 * Deterministic V1 statistics engine. The unsigned 32-bit generator and formulas intentionally
 * match the browser prototype so a seed keeps producing the same report after moving to Java.
 */
@Component
public class SimulationEngine {

  // Team minutes budget: 240 + 25 per overtime period (48 minutes × 5 players, plus 5 × 5 per
  // overtime). Per-player cap: 48 + 5 per overtime period. V1 has no overtime play-by-play, so
  // the budget always resolves to the regulation 240 and the cap to 48.
  private static final int REGULATION_TEAM_MINUTES = 240;
  private static final int OVERTIME_TEAM_MINUTES = 25;
  private static final int REGULATION_PLAYER_MINUTES = 48;
  private static final int OVERTIME_PLAYER_MINUTES = 5;

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

    // Minutes are generated up front and normalized to the team budget; every derived stat below
    // consumes the normalized value so the report stays internally consistent.
    List<Integer> rawMinutes = activeMembers.stream()
        .map(member -> Math.max(
            10, round(("starter".equals(member.role()) ? 32 : 18) + (random.next() - 0.5) * 8)
        ))
        .toList();
    List<Integer> minutesList = distributeTeamMinutes(rawMinutes, 0);

    List<SimulationPlayerStatResponse> stats = new ArrayList<>();
    for (int index = 0; index < activeMembers.size(); index++) {
      stats.add(createStat(
          requiredPlayer(players, activeMembers.get(index).playerId()),
          minutesList.get(index),
          usageDenominator,
          random
      ));
    }
    return stats.stream()
        .sorted(Comparator.comparingInt(SimulationPlayerStatResponse::points).reversed())
        .toList();
  }

  // Largest-remainder normalization: scale each raw share into an integer, clamp to the per-player
  // cap, then hand the remaining minutes to the largest fractional parts still below the cap;
  // index order breaks ties so a seed stays reproducible.
  private List<Integer> distributeTeamMinutes(List<Integer> rawMinutes, int overtimePeriods) {
    int target = REGULATION_TEAM_MINUTES + OVERTIME_TEAM_MINUTES * overtimePeriods;
    int playerCap = REGULATION_PLAYER_MINUTES + OVERTIME_PLAYER_MINUTES * overtimePeriods;
    int rawTotal = rawMinutes.stream().mapToInt(Integer::intValue).sum();
    if (rawTotal <= 0) return rawMinutes;
    int size = rawMinutes.size();
    int[] distributed = new int[size];
    double[] fractions = new double[size];
    int assigned = 0;
    for (int index = 0; index < size; index++) {
      double exact = rawMinutes.get(index) * (double) target / rawTotal;
      distributed[index] = Math.min(playerCap, Math.max(1, (int) Math.floor(exact)));
      fractions[index] = exact - distributed[index];
      assigned += distributed[index];
    }
    int remainder = target - assigned;
    Integer[] order = IntStream.range(0, size).boxed().toArray(Integer[]::new);
    Arrays.sort(order, (left, right) -> {
      int byFraction = Double.compare(fractions[right], fractions[left]);
      return byFraction != 0 ? byFraction : Integer.compare(left, right);
    });
    boolean progress = true;
    while (remainder > 0 && progress) {
      progress = false;
      for (int index : order) {
        if (remainder <= 0) break;
        if (distributed[index] < playerCap) {
          distributed[index] += 1;
          remainder--;
          progress = true;
        }
      }
    }
    return Arrays.stream(distributed).boxed().toList();
  }

  private SimulationPlayerStatResponse createStat(
      PlayerResponse player,
      int minutes,
      double totalUsage,
      SeededRandom random
  ) {
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
