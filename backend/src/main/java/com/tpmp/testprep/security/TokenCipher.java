package com.tpmp.testprep.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * 외부 서비스 access token 등 민감 문자열의 대칭 암복호화 (AES-256-GCM).
 * 키는 설정값(app.security.token-encryption-key)을 SHA-256 해시하여 256bit로 사용한다.
 *
 * 인스턴스 메서드는 현재 키를 사용하고, 정적 메서드(*WithKey)는 임의 키를 받아
 * 키 회전(재암호화 마이그레이션)에 사용한다.
 */
@Component
public class TokenCipher {

    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH_BIT = 128;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final SecretKeySpec keySpec;

    public TokenCipher(@Value("${app.security.token-encryption-key:tpmp_local_token_key_change_me}") String key) {
        this.keySpec = keyOf(key);
    }

    public String encrypt(String plain) {
        return encrypt(keySpec, plain);
    }

    public String decrypt(String encoded) {
        return decrypt(keySpec, encoded);
    }

    /** 임의 키로 암호화 (키 회전 마이그레이션용) */
    public static String encryptWithKey(String rawKey, String plain) {
        return encrypt(keyOf(rawKey), plain);
    }

    /** 임의 키로 복호화 (키 회전 마이그레이션용) */
    public static String decryptWithKey(String rawKey, String encoded) {
        return decrypt(keyOf(rawKey), encoded);
    }

    // ── 내부 구현 ─────────────────────────────────────────────────────────────

    private static String encrypt(SecretKeySpec key, String plain) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BIT, iv));
            byte[] cipherText = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            byte[] combined = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(cipherText, 0, combined, iv.length, cipherText.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new IllegalStateException("토큰 암호화 실패", e);
        }
    }

    private static String decrypt(SecretKeySpec key, String encoded) {
        try {
            byte[] combined = Base64.getDecoder().decode(encoded);
            byte[] iv = new byte[IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, IV_LENGTH);
            byte[] cipherText = new byte[combined.length - IV_LENGTH];
            System.arraycopy(combined, IV_LENGTH, cipherText, 0, cipherText.length);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BIT, iv));
            return new String(cipher.doFinal(cipherText), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("토큰 복호화 실패", e);
        }
    }

    private static SecretKeySpec keyOf(String key) {
        return new SecretKeySpec(sha256(key), "AES");
    }

    private static byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
