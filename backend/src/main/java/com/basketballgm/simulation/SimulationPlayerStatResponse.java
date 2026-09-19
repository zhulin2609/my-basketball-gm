package com.basketballgm.simulation;

/** A report row contains display snapshots so later player edits cannot rewrite history. */
public record SimulationPlayerStatResponse(
    String playerId,
    String playerName,
    String playerInitials,
    String playerAccent,
    int minutes,
    int points,
    int rebounds,
    int assists,
    int steals,
    int blocks,
    int fgMade,
    int fgAttempted,
    int threeMade,
    int threeAttempted
) {}
