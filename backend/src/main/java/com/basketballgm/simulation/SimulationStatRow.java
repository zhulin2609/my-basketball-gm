package com.basketballgm.simulation;

/** Flat persisted stat row; side is used to rebuild home and away collections. */
public record SimulationStatRow(
    String simulationId,
    String side,
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
