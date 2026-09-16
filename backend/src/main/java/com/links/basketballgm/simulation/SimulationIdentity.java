package com.links.basketballgm.simulation;

import java.time.Instant;

/** Database-generated identity and retention timestamps for a newly persisted report. */
public record SimulationIdentity(String id, Instant createdAt, Instant expiresAt) {}
