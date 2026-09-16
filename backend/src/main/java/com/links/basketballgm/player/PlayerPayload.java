package com.links.basketballgm.player;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** The JSON shape shared by the browser and the player persistence boundary. */
public record PlayerPayload(
    @NotBlank @Size(max = 120) String name,
    @NotBlank @Pattern(regexp = ".{1,4}") String initials,
    @NotBlank @Size(max = 20) String peakSeason,
    @Size(max = 120) String peakTeam,
    @NotBlank @Pattern(regexp = "PG|SG|SF|PF|C") String defaultPosition,
    @NotNull @Min(4) @Max(8) Integer heightFeet,
    @NotNull @Min(0) @Max(11) Integer heightInches,
    @NotNull @Min(80) @Max(500) Integer weightLbs,
    @NotNull @Min(0) Integer salaryUsd,
    @Size(max = 120) String archetype,
    @Size(max = 1000) String bio,
    @Size(max = 16) String accent,
    @NotNull @Min(0) @Max(99) Integer threePoint,
    @NotNull @Min(0) @Max(99) Integer layup,
    @NotNull @Min(0) @Max(99) Integer midRange,
    @NotNull @Min(0) @Max(99) Integer insideScoring,
    @NotNull @Min(0) @Max(99) Integer dunk,
    @NotNull @Min(0) @Max(99) Integer offensiveRebound,
    @NotNull @Min(0) @Max(99) Integer defensiveRebound,
    @NotNull @Min(0) @Max(99) Integer handling,
    @NotNull @Min(0) @Max(99) Integer passing,
    @NotNull @Min(0) @Max(99) Integer defensiveIQ,
    @NotNull @Min(0) @Max(99) Integer offensiveIQ,
    @NotNull @Min(0) @Max(99) Integer speed,
    @NotNull @Min(0) @Max(99) Integer agility,
    @NotNull @Min(0) @Max(99) Integer vertical,
    @NotNull @Min(0) @Max(99) Integer strength,
    @NotNull @Min(0) @Max(99) Integer freeThrow,
    @NotNull @Min(0) @Max(99) Integer steal,
    @NotNull @Min(0) @Max(99) Integer block,
    @NotNull @Min(0) @Max(99) Integer stamina,
    @NotNull @Min(0) @Max(99) Integer shotTendency
) {}
