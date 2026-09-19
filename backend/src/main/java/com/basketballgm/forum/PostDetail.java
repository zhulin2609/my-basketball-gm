package com.basketballgm.forum;

import java.time.Instant;
import java.util.List;

/** PostSummary fields plus the deserialized member snapshot. */
public record PostDetail(
    String id,
    String name,
    String description,
    String authorName,
    int memberCount,
    int commentCount,
    int copyCount,
    boolean mine,
    Instant createdAt,
    Instant updatedAt,
    List<SnapshotMember> members
) {}
