package com.links.basketballgm.simulation;

import java.time.Instant;

/** Flat report header loaded by MyBatis before the two stat lists are assembled. */
public record SimulationRow(
    String id,
    String homeLineupId,
    String awayLineupId,
    String homeLineupName,
    String awayLineupName,
    long seed,
    int homeScore,
    int awayScore,
    String engineVersion,
    Instant createdAt,
    Instant expiresAt
) {}
