package com.basketballgm.llm;

/** AES-GCM output stored as separate ciphertext and nonce columns. */
record EncryptedValue(byte[] ciphertext, byte[] iv) {}
