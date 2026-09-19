package com.basketballgm.guest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public record GuestSimulationImport(
    @NotBlank String id,
    @NotBlank String homeLineupId,
    @NotBlank String awayLineupId,
    @NotBlank @Size(max = 120) String homeLineupName,
    @NotBlank @Size(max = 120) String awayLineupName,
    long seed,
    @Min(0) @Max(500) int homeScore,
    @Min(0) @Max(500) int awayScore,
    @NotNull @Size(max = 15) List<@Valid GuestSimulationStat> homeStats,
    @NotNull @Size(max = 15) List<@Valid GuestSimulationStat> awayStats,
    @NotBlank @Size(max = 120) String engineVersion,
    @NotNull Instant createdAt,
    @NotNull Instant expiresAt
) {}
