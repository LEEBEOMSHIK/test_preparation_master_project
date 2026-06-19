package com.tpmp.testprep.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 기존 개념노트 공개 상태 비공개 전환 마이그레이션.
 *
 * is_public 기본값이 true → false 로 변경되면서,
 * 이미 저장된 레코드를 모두 비공개로 전환한다.
 * 멱등: count == 0이면 아무 동작도 하지 않는다.
 */
@Slf4j
@Component
@Order(200)
@RequiredArgsConstructor
public class ConceptNotePrivacyMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        int count = jdbcTemplate.update("UPDATE concept_notes SET is_public = false WHERE is_public = true");
        if (count == 0) {
            log.info("[ConceptNotePrivacyMigration] 모두 이미 비공개 — 건너뜀");
        } else {
            log.info("[ConceptNotePrivacyMigration] 기존 노트 {}건 비공개 전환 완료", count);
        }
    }
}
