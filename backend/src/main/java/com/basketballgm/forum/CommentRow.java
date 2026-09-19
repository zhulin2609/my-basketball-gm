package com.basketballgm.forum;

import java.time.Instant;

/** Flat lineup_comments row joined with the author and parent-author usernames. */
public record CommentRow(
    String id,
    String postId,
    String authorId,
    String authorName,
    String content,
    String parentId,
    String parentAuthorName,
    Instant createdAt
) {}
