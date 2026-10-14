package com.basketballgm.auth;

import java.time.Instant;
import java.util.UUID;

public record WebLoginTicketRow(
    String id,
    String browserBindingDigest,
    String status,
    UUID approvedUserId,
    Instant createdAt,
    Instant expiresAt,
    Instant resolvedAt,
    Instant consumedAt
) {}
