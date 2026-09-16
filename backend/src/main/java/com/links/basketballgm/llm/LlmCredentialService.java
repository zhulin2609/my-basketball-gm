package com.links.basketballgm.llm;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** Owns validation, encryption, and safe presentation of each user's provider credential. */
@Service
public class LlmCredentialService {
  private final LlmCredentialMapper mapper;
  private final CredentialCipher cipher;

  public LlmCredentialService(LlmCredentialMapper mapper, CredentialCipher cipher) {
    this.mapper = mapper;
    this.cipher = cipher;
  }

  public LlmCredentialResponse get(UUID ownerId) {
    LlmCredentialRow row = mapper.find(ownerId);
    return row == null ? LlmCredentialResponse.notConfigured() : toResponse(row);
  }

  public LlmCredentialResponse save(UUID ownerId, LlmCredentialPayload payload) {
    String baseUrl = normalizeBaseUrl(payload.baseUrl());
    EncryptedValue encrypted = cipher.encrypt(payload.apiKey().trim());
    mapper.upsert(
        ownerId,
        baseUrl,
        payload.model().trim(),
        encrypted.ciphertext(),
        encrypted.iv(),
        hint(payload.apiKey())
    );
    return new LlmCredentialResponse(true, baseUrl, payload.model().trim(), hint(payload.apiKey()));
  }

  public void delete(UUID ownerId) {
    mapper.delete(ownerId);
  }

  LlmCredentialRow requiredForSimulation(UUID ownerId) {
    LlmCredentialRow row = mapper.find(ownerId);
    if (row == null) {
      throw new ResponseStatusException(HttpStatus.PRECONDITION_REQUIRED, "请先在 AI 设置中配置模型 API Key。");
    }
    return row;
  }

  String decryptApiKey(LlmCredentialRow row) {
    return cipher.decrypt(row.apiKeyCiphertext(), row.apiKeyIv());
  }

  private LlmCredentialResponse toResponse(LlmCredentialRow row) {
    return new LlmCredentialResponse(true, row.baseUrl(), row.model(), row.apiKeyHint());
  }

  private String normalizeBaseUrl(String rawBaseUrl) {
    String baseUrl = rawBaseUrl.trim().replaceAll("/+$", "");
    try {
      URI uri = new URI(baseUrl);
      if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "接口地址必须是有效的 HTTPS URL。");
      }
      return baseUrl;
    } catch (URISyntaxException exception) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "接口地址不是有效的 URL。", exception);
    }
  }

  private String hint(String apiKey) {
    String normalized = apiKey.trim();
    int suffixLength = Math.min(4, normalized.length());
    return "••••" + normalized.substring(normalized.length() - suffixLength);
  }
}
