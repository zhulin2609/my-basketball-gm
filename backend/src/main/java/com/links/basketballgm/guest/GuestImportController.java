package com.links.basketballgm.guest;

import com.links.basketballgm.user.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/guest-imports")
public class GuestImportController {
  private final GuestImportService service;
  private final CurrentUser currentUser;

  public GuestImportController(GuestImportService service, CurrentUser currentUser) {
    this.service = service;
    this.currentUser = currentUser;
  }

  @PostMapping
  public ResponseEntity<GuestImportResponse> importWorkspace(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody GuestImportRequest request
  ) {
    GuestImportResponse response = service.importWorkspace(currentUser.id(jwt), request);
    HttpStatus status = response.alreadyImported() ? HttpStatus.OK : HttpStatus.CREATED;
    return ResponseEntity.status(status).body(response);
  }
}
