package com.basketballgm.llm;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Encrypts provider API keys at rest; plaintext exists only during an outbound provider call. */
@Component
public class CredentialCipher {
  private static final int KEY_BYTES = 32;
  private static final int IV_BYTES = 12;
  private static final int TAG_BITS = 128;

  private final SecretKey key;
  private final SecureRandom secureRandom = new SecureRandom();

  public CredentialCipher(@Value("${app.llm.credential-encryption-key}") String encodedKey) {
    byte[] keyBytes;
    try {
      keyBytes = Base64.getDecoder().decode(encodedKey);
    } catch (IllegalArgumentException exception) {
      throw new IllegalStateException("LLM_CREDENTIAL_ENCRYPTION_KEY 必须是 Base64 编码。", exception);
    }
    if (keyBytes.length != KEY_BYTES) {
      throw new IllegalStateException("LLM_CREDENTIAL_ENCRYPTION_KEY 必须解码为 32 字节。");
    }
    key = new SecretKeySpec(keyBytes, "AES");
  }

  EncryptedValue encrypt(String plaintext) {
    try {
      byte[] iv = new byte[IV_BYTES];
      secureRandom.nextBytes(iv);
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
      return new EncryptedValue(cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8)), iv);
    } catch (Exception exception) {
      throw new IllegalStateException("无法加密模型 API Key。", exception);
    }
  }

  String decrypt(byte[] ciphertext, byte[] iv) {
    try {
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
      return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
    } catch (Exception exception) {
      throw new IllegalStateException("已保存的模型 API Key 无法解密，请重新配置。", exception);
    }
  }
}
