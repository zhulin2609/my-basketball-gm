package com.basketballgm.forum;

/** Publish outcome: created distinguishes the 201 insert from the 200 upsert-refresh. */
public record PublishResult(boolean created, PostDetail post) {}
