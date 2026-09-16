package com.links.basketballgm.llm;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import org.junit.jupiter.api.Test;

class CredentialCipherTest {
  private static final String TEST_KEY = "ZHJlYW0tY291cnQtbG9jYWwtYWVzLWtleS0yMDI2MDk=";

  @Test
  void roundTripsCredentialsWithFreshNonces() {
    CredentialCipher cipher = new CredentialCipher(TEST_KEY);

    EncryptedValue first = cipher.encrypt("sk-test-key");
    EncryptedValue second = cipher.encrypt("sk-test-key");

    assertEquals("sk-test-key", cipher.decrypt(first.ciphertext(), first.iv()));
    assertEquals(12, first.iv().length);
    assertNotEquals(bytesToHex(first.iv()), bytesToHex(second.iv()));
  }

  private String bytesToHex(byte[] value) {
    StringBuilder result = new StringBuilder();
    for (byte item : value) result.append(String.format("%02x", item));
    return result.toString();
  }
}
