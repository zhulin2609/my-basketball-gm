package com.links.basketballgm.lineup;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/** One player assignment in a saved lineup draft. */
public record LineupMemberPayload(
    @NotBlank String playerId,
    @NotBlank @Pattern(regexp = "PG|SG|SF|PF|C") String position,
    @NotNull Boolean starter,
    @NotNull Boolean inactive
) {}
