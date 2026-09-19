package com.links.basketballgm.auth;

import java.util.UUID;

/** Safe user data exposed to the browser after authentication. */
public record AuthUserResponse(UUID id, String username, String displayName, boolean admin) {}
