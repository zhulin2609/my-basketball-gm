package com.links.basketballgm.guest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record GuestImportRequest(
    @NotNull UUID guestWorkspaceId,
    @NotNull @Size(max = 500) List<@Valid GuestPlayerImport> players,
    @NotNull @Size(max = 100) List<@Valid GuestLineupImport> lineups,
    @NotNull @Size(max = 20) List<@Valid GuestSimulationImport> simulations
) {}
