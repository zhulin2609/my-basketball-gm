package com.links.basketballgm.config;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

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

  private ResponseEntity<Map<String, String>> badRequest(String message) {
    return ResponseEntity.badRequest().body(Map.of("message", message));
  }
}
