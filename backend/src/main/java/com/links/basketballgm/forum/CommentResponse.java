package com.links.basketballgm.forum;

import java.time.Instant;

/** Browser-facing comment; parentAuthorName is null for top-level comments. */
public record CommentResponse(
    String id,
    String authorName,
    String content,
    String parentId,
    String parentAuthorName,
    boolean mine,
    Instant createdAt
) {}
