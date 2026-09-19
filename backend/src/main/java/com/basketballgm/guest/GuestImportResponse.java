package com.basketballgm.guest;

import java.util.UUID;

public record GuestImportResponse(
    UUID guestWorkspaceId,
    boolean alreadyImported,
    int playerCount,
    int lineupCount,
    int simulationCount
) {}
