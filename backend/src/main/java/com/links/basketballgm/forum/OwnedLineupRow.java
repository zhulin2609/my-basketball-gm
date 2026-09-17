package com.links.basketballgm.forum;

/** The owner's lineup row resolved from a browser client_key before publishing. */
public record OwnedLineupRow(String id, String clientKey, String name, String description) {}
