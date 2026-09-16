package com.links.basketballgm.lineup;

/** Internal write row: role is derived from the two browser booleans before SQL runs. */
public record LineupMemberWrite(String playerId, String position, String role, int sortOrder) {}
