package com.basketballgm.llm;

import com.basketballgm.user.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Settings endpoint for a user's encrypted OpenAI-compatible provider credential. */
@RestController
@RequestMapping("/api/v1/llm-credentials")
public class LlmCredentialController {
  private final LlmCredentialService service;
  private final CurrentUser currentUser;

  public LlmCredentialController(LlmCredentialService service, CurrentUser currentUser) {
    this.service = service;
    this.currentUser = currentUser;
  }

  @GetMapping
  public LlmCredentialResponse get(@AuthenticationPrincipal Jwt jwt) {
    return service.get(currentUser.id(jwt));
  }

  @PutMapping
  public LlmCredentialResponse save(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody LlmCredentialPayload payload
  ) {
    return service.save(currentUser.id(jwt), payload);
  }

  @DeleteMapping
  public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt) {
    service.delete(currentUser.id(jwt));
    return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
  }
}
