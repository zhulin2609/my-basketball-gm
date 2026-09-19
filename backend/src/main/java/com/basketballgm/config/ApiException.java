package com.basketballgm.config;

import org.springframework.http.HttpStatus;

/**
 * Business failure with a stable machine-readable code. The browser maps the code to its own
 * localized copy instead of showing the server message, so moderation wording stays consistent
 * and sensitive-word details never leak into responses.
 */
public class ApiException extends RuntimeException {
  private final HttpStatus status;
  private final String code;

  public ApiException(HttpStatus status, String code, String message) {
    super(message);
    this.status = status;
    this.code = code;
  }

  public HttpStatus status() {
    return status;
  }

  public String code() {
    return code;
  }
}
