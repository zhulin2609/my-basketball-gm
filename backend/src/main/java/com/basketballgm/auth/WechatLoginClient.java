package com.basketballgm.auth;

import com.basketballgm.config.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Server-side WeChat API boundary. The session key returned by jscode2session is never read,
 * logged or persisted; only openid/unionid establish identity. AppID and secret come from
 * configuration and must never enter logs, source or the mini program bundle.
 */
@Component
public class WechatLoginClient {
  private final String appid;
  private final String secret;
  private final String apiBaseUrl;
  private final String qrCodeEnvVersion;
  private final ObjectMapper objectMapper = new ObjectMapper();
  private final HttpClient httpClient;

  private String cachedAccessToken;
  private Instant accessTokenExpiresAt = Instant.EPOCH;

  public WechatLoginClient(
      @Value("${app.wechat.appid:}") String appid,
      @Value("${app.wechat.secret:}") String secret,
      @Value("${app.wechat.api-base-url:https://api.weixin.qq.com}") String apiBaseUrl,
      @Value("${app.wechat.qrcode-env-version:release}") String qrCodeEnvVersion
  ) {
    this.appid = appid;
    this.secret = secret;
    this.apiBaseUrl = apiBaseUrl;
    this.qrCodeEnvVersion = qrCodeEnvVersion;
    this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
  }

  public record WechatIdentity(String openid, String unionid) {}

  public boolean configured() {
    return !appid.isBlank() && !secret.isBlank();
  }

  public WechatIdentity exchangeCode(String code) {
    requireConfigured();
    String query = "appid=" + encode(appid)
        + "&secret=" + encode(secret)
        + "&js_code=" + encode(code)
        + "&grant_type=authorization_code";
    JsonNode body = sendJson(HttpRequest.newBuilder()
        .uri(URI.create(apiBaseUrl + "/sns/jscode2session?" + query))
        .timeout(Duration.ofSeconds(15))
        .GET()
        .build());
    int errcode = body.path("errcode").asInt(0);
    if (errcode != 0) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "WECHAT_CODE_INVALID", "微信登录凭证无效或已过期。");
    }
    String openid = body.path("openid").asText(null);
    if (openid == null || openid.isBlank()) {
      throw new ApiException(HttpStatus.BAD_GATEWAY, "WECHAT_UPSTREAM", "微信服务返回异常。");
    }
    String unionid = body.path("unionid").asText(null);
    return new WechatIdentity(openid, unionid == null || unionid.isBlank() ? null : unionid);
  }

  /** Generates the mini program code image pointing at the given page and scene. */
  public byte[] createMiniProgramCode(String scene, String page) {
    requireConfigured();
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(apiBaseUrl + "/wxa/getwxacodeunlimit?access_token=" + encode(accessToken())))
        .timeout(Duration.ofSeconds(15))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(
            "{\"scene\":\"" + scene + "\",\"page\":\"" + page + "\",\"check_path\":false,\"env_version\":\""
                + qrCodeEnvVersion + "\"}"))
        .build();
    HttpResponse<byte[]> response = sendBytes(request);
    String contentType = response.headers().firstValue("Content-Type").orElse("");
    if (!contentType.startsWith("image/")) {
      throw new ApiException(HttpStatus.BAD_GATEWAY, "WECHAT_QRCODE_FAILED", "小程序码生成失败。");
    }
    return response.body();
  }

  private synchronized String accessToken() {
    if (cachedAccessToken != null && Instant.now().isBefore(accessTokenExpiresAt)) {
      return cachedAccessToken;
    }
    String query = "grant_type=client_credential&appid=" + encode(appid) + "&secret=" + encode(secret);
    JsonNode body = sendJson(HttpRequest.newBuilder()
        .uri(URI.create(apiBaseUrl + "/cgi-bin/token?" + query))
        .timeout(Duration.ofSeconds(15))
        .GET()
        .build());
    String token = body.path("access_token").asText(null);
    if (token == null || token.isBlank()) {
      throw new ApiException(HttpStatus.BAD_GATEWAY, "WECHAT_UPSTREAM", "微信服务返回异常。");
    }
    long expiresIn = Math.max(60, body.path("expires_in").asLong(7200) - 300);
    cachedAccessToken = token;
    accessTokenExpiresAt = Instant.now().plusSeconds(expiresIn);
    return token;
  }

  private void requireConfigured() {
    if (!configured()) {
      throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "WECHAT_NOT_CONFIGURED", "微信登录能力未配置。");
    }
  }

  private JsonNode sendJson(HttpRequest request) {
    HttpResponse<byte[]> response = sendBytes(request);
    try {
      return objectMapper.readTree(response.body());
    } catch (IOException exception) {
      throw new ApiException(HttpStatus.BAD_GATEWAY, "WECHAT_UPSTREAM", "微信服务返回异常。");
    }
  }

  private HttpResponse<byte[]> sendBytes(HttpRequest request) {
    try {
      HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
      if (response.statusCode() != 200) {
        throw new ApiException(HttpStatus.BAD_GATEWAY, "WECHAT_UPSTREAM", "微信服务返回异常。");
      }
      return response;
    } catch (IOException exception) {
      throw new ApiException(HttpStatus.BAD_GATEWAY, "WECHAT_UPSTREAM", "微信服务连接失败。");
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new ApiException(HttpStatus.BAD_GATEWAY, "WECHAT_UPSTREAM", "微信服务连接被中断。");
    }
  }

  private static String encode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }
}
