package com.basketballgm.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WebLoginTicketClaimRequest(@NotBlank @Size(min = 16, max = 128) String browserBinding) {}
