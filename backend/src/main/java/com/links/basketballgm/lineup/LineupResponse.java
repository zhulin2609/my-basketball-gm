package com.links.basketballgm.lineup;

import java.time.Instant;
import java.util.List;

/** JSON lineup shape matching the React Lineup interface, plus community-share state. */
public record LineupResponse(
    String id,
    String name,
    String description,
    List<LineupMemberResponse> members,
    Instant createdAt,
    Instant updatedAt,
    String sharedPostId,
    List<String> shareBlockedPlayers
) {}
