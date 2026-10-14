package com.basketballgm.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record WechatBindRequest(
    @NotBlank String credentialToken,
    @NotBlank @Pattern(regexp = UsernameRules.PATTERN) String username,
    @NotBlank @Size(min = 8, max = 72) String password
) {}
