package com.basketballgm.guest;

import java.util.UUID;

public record GuestImportRow(
    UUID guestWorkspaceId,
    UUID ownerId,
    int playerCount,
    int lineupCount,
    int simulationCount
) {}
