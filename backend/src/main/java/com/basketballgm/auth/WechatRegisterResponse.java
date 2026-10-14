package com.basketballgm.auth;

/** Session for a freshly created passwordless account plus the new-account marker. */
public record WechatRegisterResponse(AuthResponse session, boolean newAccount) {}
