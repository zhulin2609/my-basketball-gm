package com.basketballgm.auth;

import java.time.Instant;

public record WebLoginTicketStatusResponse(String status, Instant expiresAt) {}
