package com.links.basketballgm.guest;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GuestSimulationStat(
    @NotBlank String playerId,
    @NotBlank @Size(max = 120) String playerName,
    @NotBlank @Size(max = 4) String playerInitials,
    @NotBlank @Size(max = 16) String playerAccent,
    @Min(0) @Max(60) int minutes,
    @Min(0) @Max(200) int points,
    @Min(0) @Max(100) int rebounds,
    @Min(0) @Max(100) int assists,
    @Min(0) @Max(30) int steals,
    @Min(0) @Max(30) int blocks,
    @Min(0) @Max(100) int fgMade,
    @Min(0) @Max(150) int fgAttempted,
    @Min(0) @Max(100) int threeMade,
    @Min(0) @Max(150) int threeAttempted
) {}
