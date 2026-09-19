package com.basketballgm.guest;

import com.basketballgm.lineup.LineupPayload;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record GuestLineupImport(
    @NotBlank String id,
    @NotNull @Valid LineupPayload lineup
) {}
