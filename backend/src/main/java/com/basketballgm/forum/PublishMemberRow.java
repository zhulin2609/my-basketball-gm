package com.basketballgm.forum;

/** Member row of the owner's source lineup, joined with catalog visibility and override state. */
public record PublishMemberRow(
    String playerUuid,
    String playerId,
    String playerName,
    boolean custom,
    boolean overridden,
    String position,
    String role
) {}
