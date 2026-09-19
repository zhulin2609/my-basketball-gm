package com.basketballgm.guest;

import com.basketballgm.player.PlayerPayload;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record GuestPlayerImport(
    @NotBlank String id,
    boolean custom,
    @NotNull @Valid PlayerPayload player
) {}
