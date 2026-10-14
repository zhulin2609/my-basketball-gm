package com.basketballgm.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Shared registration and login input. Username validation matches the database constraint. */
public record AuthRequest(
    @NotBlank @Pattern(regexp = UsernameRules.PATTERN) String username,
    @NotBlank @Size(min = 8, max = 72) String password
) {}
