package com.basketballgm.simulation;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/** Only lineup identities and an optional reproducible seed cross the public write boundary. */
public record SimulationRequest(
    @NotBlank String homeLineupId,
    @NotBlank String awayLineupId,
    @Min(0) @Max(4_294_967_295L) Long seed,
    SimulationMode simulationMode
) {}
