package com.basketballgm.auth;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** WeChat passwordless authentication boundary: code exchange, binding and account creation. */
@RestController
@RequestMapping("/api/v1/auth")
public class WechatAuthController {
  private final WechatAuthService wechatAuthService;

  public WechatAuthController(WechatAuthService wechatAuthService) {
    this.wechatAuthService = wechatAuthService;
  }

  @PostMapping("/wechat/exchange")
  public WechatExchangeResponse exchange(@Valid @RequestBody WechatExchangeRequest request) {
    return wechatAuthService.exchange(request);
  }

  @PostMapping("/wechat/bind")
  public AuthResponse bind(@Valid @RequestBody WechatBindRequest request) {
    return wechatAuthService.bind(request);
  }

  @PostMapping("/wechat/register")
  public ResponseEntity<WechatRegisterResponse> register(@Valid @RequestBody WechatRegisterRequest request) {
    WechatRegisterResponse response = wechatAuthService.register(request);
    HttpStatus status = response.newAccount() ? HttpStatus.CREATED : HttpStatus.OK;
    return ResponseEntity.status(status).body(response);
  }

  @GetMapping("/identities")
  public List<IdentityResponse> identities(@AuthenticationPrincipal Jwt jwt) {
    return wechatAuthService.identities(jwt);
  }
}
