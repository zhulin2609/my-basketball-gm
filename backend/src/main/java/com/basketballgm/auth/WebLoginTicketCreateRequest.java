package com.basketballgm.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WebLoginTicketCreateRequest(@NotBlank @Size(min = 16, max = 128) String browserBinding) {}
