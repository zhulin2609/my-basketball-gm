package com.links.basketballgm.forum;

import java.time.Instant;

/** Flat shared_lineups row joined with the author's username; membersJson stays raw for Jackson. */
public record PostRow(
    String id,
    String ownerId,
    String authorName,
    String name,
    String description,
    int memberCount,
    int commentCount,
    int copyCount,
    Instant createdAt,
    Instant updatedAt,
    String membersJson
) {}
