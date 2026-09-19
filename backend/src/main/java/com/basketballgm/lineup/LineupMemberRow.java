package com.basketballgm.lineup;

/** Flat lineup-member row used to avoid fragile nested MyBatis result mappings. */
public record LineupMemberRow(
    String lineupId,
    String playerId,
    String position,
    String role,
    int sortOrder
) {}
