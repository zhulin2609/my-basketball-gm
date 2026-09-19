package com.basketballgm.user;

import java.util.UUID;

/** Minimal user projection. Password hashes never leave this persistence package. */
public record UserRow(UUID id, String username, String displayName, String passwordHash) {}
