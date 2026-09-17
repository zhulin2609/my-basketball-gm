package com.links.basketballgm.forum;

import java.time.Instant;

/** shared_lineups list row without the members snapshot, which the list endpoint never returns. */
public record PostSummaryRow(
    String id,
    String ownerId,
    String authorName,
    String name,
    String description,
    int memberCount,
    int commentCount,
    int copyCount,
    Instant createdAt,
    Instant updatedAt
) {}
