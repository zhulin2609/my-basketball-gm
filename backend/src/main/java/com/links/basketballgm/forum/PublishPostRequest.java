package com.links.basketballgm.forum;

import jakarta.validation.constraints.NotBlank;

/** Publish request: lineupId is the browser-owned client_key of the lineup being shared. */
public record PublishPostRequest(@NotBlank String lineupId) {}
