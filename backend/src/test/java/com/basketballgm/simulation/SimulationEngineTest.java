package com.basketballgm.simulation;

import static org.assertj.core.api.Assertions.assertThat;

import com.basketballgm.lineup.LineupMemberRow;
import com.basketballgm.player.PlayerResponse;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

class SimulationEngineTest {
  private final SimulationEngine engine = new SimulationEngine();

  @Test
  void matchesTheBrowserV1ResultForASeededGame() {
    List<PlayerResponse> players = List.of(
        player("curry", "Stephen Curry", "SC", "#76b5e8", 99, 95, 92, 55, 50, 62, 91, 95, 83, 45, 96),
        player("jordan", "Michael Jordan", "MJ", "#f6a623", 82, 99, 94, 88, 70, 74, 87, 85, 97, 84, 98),
        player("lebron", "LeBron James", "LJ", "#ef7456", 79, 97, 90, 92, 78, 86, 99, 76, 89, 84, 94),
        player("duncan", "Tim Duncan", "TD", "#b59e72", 45, 75, 87, 96, 94, 97, 80, 70, 73, 98, 76),
        player("shaq", "Shaquille O'Neal", "SO", "#9c8dee", 25, 70, 50, 99, 95, 99, 66, 52, 55, 98, 96),
        player("magic", "Magic Johnson", "MJ", "#dcab55", 72, 92, 88, 85, 72, 84, 99, 85, 78, 65, 83),
        player("kobe", "Kobe Bryant", "KB", "#8060bf", 86, 96, 96, 85, 60, 78, 82, 85, 89, 76, 99),
        player("bird", "Larry Bird", "LB", "#72b58a", 94, 82, 95, 78, 83, 90, 94, 91, 82, 70, 90),
        player("garnett", "Kevin Garnett", "KG", "#4fada2", 65, 78, 88, 90, 95, 98, 80, 79, 88, 97, 79),
        player("olajuwon", "Hakeem Olajuwon", "HO", "#d9696b", 42, 82, 92, 97, 94, 96, 70, 77, 86, 99, 88)
    );
    Map<String, PlayerResponse> playerMap = players.stream()
        .collect(Collectors.toMap(PlayerResponse::id, Function.identity()));
    List<LineupMemberRow> home = lineup("home", List.of("curry", "jordan", "lebron", "duncan", "shaq"));
    List<LineupMemberRow> away = lineup("away", List.of("magic", "kobe", "bird", "garnett", "olajuwon"));

    SimulationResult result = engine.simulate(home, away, playerMap, 42);
    SimulationResult repeated = engine.simulate(home, away, playerMap, 42);

    assertThat(result).isEqualTo(repeated);
    assertThat(result.homeScore()).isEqualTo(145);
    assertThat(result.awayScore()).isEqualTo(153);
    assertThat(result.homeStats()).extracting(SimulationPlayerStatResponse::playerName)
        .containsExactly("Michael Jordan", "Stephen Curry", "LeBron James", "Tim Duncan", "Shaquille O'Neal");
    assertThat(result.homeStats().stream().mapToInt(SimulationPlayerStatResponse::minutes).sum())
        .isEqualTo(240);
    assertThat(result.awayStats().stream().mapToInt(SimulationPlayerStatResponse::minutes).sum())
        .isEqualTo(240);
    assertThat(result.homeStats()).allSatisfy(stat -> assertThat(stat.minutes()).isLessThanOrEqualTo(48));
    assertThat(result.awayStats()).allSatisfy(stat -> assertThat(stat.minutes()).isLessThanOrEqualTo(48));
  }

  private List<LineupMemberRow> lineup(String lineupId, List<String> playerIds) {
    List<String> positions = List.of("PG", "SG", "SF", "PF", "C");
    return java.util.stream.IntStream.range(0, playerIds.size())
        .mapToObj(index -> new LineupMemberRow(
            lineupId,
            playerIds.get(index),
            positions.get(index),
            "starter",
            index
        ))
        .toList();
  }

  private PlayerResponse player(
      String id,
      String name,
      String initials,
      String accent,
      int threePoint,
      int layup,
      int midRange,
      int insideScoring,
      int offensiveRebound,
      int defensiveRebound,
      int passing,
      int freeThrow,
      int steal,
      int block,
      int shotTendency
  ) {
    return new PlayerResponse(
        id,
        false,
        name,
        initials,
        "test",
        "test",
        "PG",
        6,
        6,
        210,
        0,
        "test",
        "test",
        accent,
        threePoint,
        layup,
        midRange,
        insideScoring,
        70,
        offensiveRebound,
        defensiveRebound,
        75,
        passing,
        78,
        82,
        80,
        80,
        80,
        76,
        freeThrow,
        steal,
        block,
        88,
        shotTendency
    );
  }
}
