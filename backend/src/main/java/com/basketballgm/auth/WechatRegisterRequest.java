package com.basketballgm.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record WechatRegisterRequest(
    @NotBlank String credentialToken,
    @NotBlank @Pattern(regexp = UsernameRules.PATTERN) String username
) {}
