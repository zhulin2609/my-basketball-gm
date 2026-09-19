package com.basketballgm.lineup;

/** Maps a browser client_key to the public forum post created from that lineup. */
public record SharedPostIdRow(String lineupId, String postId) {}
