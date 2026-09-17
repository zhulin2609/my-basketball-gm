package com.links.basketballgm.forum;

import java.time.Instant;

/** Browser-facing forum post card without the member snapshot. */
public record PostSummary(
    String id,
    String name,
    String description,
    String authorName,
    int memberCount,
    int commentCount,
    int copyCount,
    boolean mine,
    Instant createdAt,
    Instant updatedAt
) {}
