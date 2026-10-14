package com.basketballgm.auth;

import java.time.Instant;

public record WebLoginTicketCreateResponse(String ticket, Instant expiresAt) {}
