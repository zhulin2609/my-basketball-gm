package com.links.basketballgm.simulation;

/** Internal persistence row combining a side with the engine's immutable player snapshot. */
public record SimulationStatWrite(
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
