package com.basketballgm.simulation;

import java.util.List;

/** Pure engine output before database-generated metadata is attached. */
public record SimulationResult(
    int homeScore,
    int awayScore,
    List<SimulationPlayerStatResponse> homeStats,
    List<SimulationPlayerStatResponse> awayStats
) {}
