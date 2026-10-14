package com.basketballgm.auth;

import jakarta.validation.constraints.NotBlank;

public record WechatExchangeRequest(@NotBlank String code) {}
