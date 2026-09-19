package com.basketballgm.llm;

/** Internal parse failure kept separate from the HTTP error presented to the browser. */
final class LlmResponseFormatException extends RuntimeException {
  LlmResponseFormatException(String message) {
    super(message);
  }

  LlmResponseFormatException(String message, Throwable cause) {
    super(message, cause);
  }
}
