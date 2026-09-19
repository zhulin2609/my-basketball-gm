package com.basketballgm.forum;

import com.basketballgm.player.PlayerResponse;

/** One frozen member entry inside the shared lineup snapshot stored as jsonb. */
public record SnapshotMember(
    String playerId,
    String position,
    boolean starter,
    boolean inactive,
    PlayerResponse player
) {}
