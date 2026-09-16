package com.links.basketballgm.lineup;

/** JSON member shape matching the React LineupMember interface. */
public record LineupMemberResponse(String playerId, String position, boolean starter, boolean inactive) {}
