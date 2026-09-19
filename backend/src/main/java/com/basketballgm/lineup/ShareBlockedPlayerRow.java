package com.basketballgm.lineup;

/** Names one player that blocks a lineup from being shared: custom or overridden by the owner. */
public record ShareBlockedPlayerRow(String lineupId, String playerName) {}
