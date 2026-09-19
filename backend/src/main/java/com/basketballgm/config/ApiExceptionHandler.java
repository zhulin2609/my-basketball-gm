package com.basketballgm.config;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

/**
 * Converts input failures to the small, stable error shape consumed by the browser API client.
 * Database internals deliberately stay out of the response so they cannot leak to a public API.
 */
@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException exception) {
    String field = exception.getBindingResult().getFieldError() == null
        ? "提交内容"
        : exception.getBindingResult().getFieldError().getField();
    return badRequest(field + " 字段不合法。");
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<Map<String, String>> handleUnreadableBody() {
    return badRequest("请求内容不是有效的 JSON。");
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<Map<String, String>> handleIntegrityViolation() {
    return badRequest("提交数据不符合存储规则。");
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException exception) {
    return badRequest(exception.getMessage());
  }

  /**
   * ApiException carries a stable code the browser maps to localized copy; the server message is
   * kept as a fallback for other clients.
   */
  @ExceptionHandler(ApiException.class)
  public ResponseEntity<Map<String, String>> handleApiException(ApiException exception) {
    return ResponseEntity.status(exception.status())
        .body(Map.of("message", exception.getMessage(), "code", exception.code()));
  }

  /**
   * Keeps explicit business-status failures in the same JSON shape as validation failures,
   * so the browser can display a useful error message without knowing Spring's ProblemDetail.
   */
  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<Map<String, String>> handleResponseStatus(
      ResponseStatusException exception
  ) {
    String message = exception.getReason() == null
        ? "请求未能完成。"
        : exception.getReason();

    return ResponseEntity.status(exception.getStatusCode()).body(Map.of("message", message));
  }

  private ResponseEntity<Map<String, String>> badRequest(String message) {
    return ResponseEntity.badRequest().body(Map.of("message", message));
  }
}
