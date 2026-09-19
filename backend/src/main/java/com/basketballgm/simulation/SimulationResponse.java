package com.basketballgm.simulation;

import java.time.Instant;
import java.util.List;

/** Browser-facing cloud report, including the exact instant at which it becomes unavailable. */
public record SimulationResponse(
    String id,
    String homeLineupId,
    String awayLineupId,
    String homeLineupName,
    String awayLineupName,
    long seed,
    int homeScore,
    int awayScore,
    List<SimulationPlayerStatResponse> homeStats,
    List<SimulationPlayerStatResponse> awayStats,
    String engineVersion,
    Instant createdAt,
    Instant expiresAt
) {}
