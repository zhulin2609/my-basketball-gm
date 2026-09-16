package com.links.basketballgm.lineup;

import java.time.Instant;

/** Header row returned by MyBatis before its member rows are assembled. */
public record LineupRow(
    String id,
    String name,
    String description,
    Instant createdAt,
    Instant updatedAt
) {}
