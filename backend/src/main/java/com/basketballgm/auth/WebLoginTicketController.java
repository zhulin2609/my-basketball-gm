package com.basketballgm.auth;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Web scan-code login boundary. Creating, polling and claiming are public but bound to the
 * initiating browser; confirming or rejecting requires the authenticated mini program session.
 */
@RestController
@RequestMapping("/api/v1/auth/web-login-tickets")
public class WebLoginTicketController {
  private final WebLoginTicketService ticketService;

  public WebLoginTicketController(WebLoginTicketService ticketService) {
    this.ticketService = ticketService;
  }

  @PostMapping
  public ResponseEntity<WebLoginTicketCreateResponse> create(@Valid @RequestBody WebLoginTicketCreateRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.create(request));
  }

  @GetMapping("/{ticket}")
  public WebLoginTicketStatusResponse status(
      @PathVariable String ticket,
      // 绑定值只走请求头：URL 会进入代理访问日志，请求头不会。
      @RequestHeader("X-Login-Ticket-Binding") String binding
  ) {
    return ticketService.status(ticket, binding);
  }

  @PostMapping("/{ticket}/claim")
  public AuthResponse claim(
      @PathVariable String ticket,
      @Valid @RequestBody WebLoginTicketClaimRequest request
  ) {
    return ticketService.claim(ticket, request);
  }

  @PostMapping("/{ticket}/confirm")
  public ResponseEntity<Void> confirm(@PathVariable String ticket, @AuthenticationPrincipal Jwt jwt) {
    ticketService.confirm(ticket, jwt);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{ticket}/reject")
  public ResponseEntity<Void> reject(@PathVariable String ticket, @AuthenticationPrincipal Jwt jwt) {
    ticketService.reject(ticket, jwt);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{ticket}/qrcode")
  public ResponseEntity<byte[]> qrCode(@PathVariable String ticket) {
    return ResponseEntity.ok()
        .contentType(MediaType.IMAGE_PNG)
        .body(ticketService.qrCode(ticket));
  }
}
