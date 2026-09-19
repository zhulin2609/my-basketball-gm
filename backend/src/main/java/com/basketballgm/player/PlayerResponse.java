package com.basketballgm.player;

/** Browser-facing player response; catalogKey keeps seeded player IDs stable for saved lineups. */
public record PlayerResponse(
    String id, boolean isCustom,
    String name, String initials, String peakSeason, String peakTeam, String defaultPosition,
    int heightFeet, int heightInches, int weightLbs, int salaryUsd, String archetype, String bio, String accent,
    int threePoint, int layup, int midRange, int insideScoring, int dunk, int offensiveRebound,
    int defensiveRebound, int handling, int passing, int defensiveIQ, int offensiveIQ, int speed, int agility,
    int vertical, int strength, int freeThrow, int steal, int block, int stamina, int shotTendency
) {
}
