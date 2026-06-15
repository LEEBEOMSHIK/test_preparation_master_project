package com.tpmp.testprep.config;

import com.tpmp.testprep.entity.NotionIntegration;
import com.tpmp.testprep.repository.NotionIntegrationRepository;
import com.tpmp.testprep.security.TokenCipher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * 토큰 암호화 키 회전(rotation) 마이그레이션.
 *
 * `app.security.token-encryption-key-previous`(옛 키)가 설정돼 있으면, 기동 시
 * 저장된 Notion access token 중 현재 키로 복호화되지 않는 것을 옛 키로 복호화한 뒤
 * 현재 키로 재암호화한다. 덕분에 키를 바꿔도 사용자가 다시 연결할 필요가 없다.
 *
 * - 멱등: 이미 현재 키로 복호화되는 토큰은 건너뛴다.
 * - 옛 키 미설정/현재 키와 동일 시 아무 동작도 하지 않는다.
 */
@Slf4j
@Component
@Order(100)
@RequiredArgsConstructor
public class NotionTokenReencryptRunner implements ApplicationRunner {

    @Value("${app.security.token-encryption-key:tpmp_local_token_key_change_me}")
    private String currentKey;

    @Value("${app.security.token-encryption-key-previous:}")
    private String previousKey;

    private final NotionIntegrationRepository integrationRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (previousKey == null || previousKey.isBlank() || previousKey.equals(currentKey)) {
            return; // 키 회전 아님 — 아무 작업 없음
        }

        int migrated = 0, failed = 0, skipped = 0;
        for (NotionIntegration integration : integrationRepository.findAll()) {
            String enc = integration.getAccessTokenEnc();
            if (enc == null || enc.isBlank()) continue;

            if (decryptable(currentKey, enc)) { skipped++; continue; } // 이미 새 키

            try {
                String plain = TokenCipher.decryptWithKey(previousKey, enc);
                integration.reEncryptToken(TokenCipher.encryptWithKey(currentKey, plain));
                integrationRepository.save(integration);
                migrated++;
            } catch (Exception e) {
                failed++;
                log.warn("[NotionTokenReencrypt] userId={} 토큰 재암호화 실패(옛 키로도 복호화 불가): {}",
                        integration.getUserId(), e.getMessage());
            }
        }

        if (migrated > 0 || failed > 0) {
            log.info("[NotionTokenReencrypt] 키 회전 재암호화 완료 — 변환 {}건, 실패 {}건, 건너뜀(이미 새 키) {}건",
                    migrated, failed, skipped);
        }
    }

    private boolean decryptable(String key, String enc) {
        try {
            TokenCipher.decryptWithKey(key, enc);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
