package com.links.basketballgm.lineup;

import java.time.Instant;
import java.util.List;

/** JSON lineup shape matching the React Lineup interface. */
public record LineupResponse(
    String id,
    String name,
    String description,
    List<LineupMemberResponse> members,
    Instant createdAt,
    Instant updatedAt
) {}
