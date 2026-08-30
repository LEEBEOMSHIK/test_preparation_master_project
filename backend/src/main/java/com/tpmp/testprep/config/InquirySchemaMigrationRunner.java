package com.tpmp.testprep.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * inquiries 테이블의 사용되지 않는 legacy inquiry_type 컬럼을 제거하는 호환 마이그레이션.
 *
 * <p>현재 문의 유형의 기준 컬럼은 request_type이며, 이 러너는 request_type 데이터에
 * 접근하거나 변경하지 않는다. 컬럼 존재 여부를 먼저 확인하므로 재실행해도 안전하다.</p>
 */
@Slf4j
@Component
@Order(100)
@RequiredArgsConstructor
public class InquirySchemaMigrationRunner implements ApplicationRunner {

    private static final String LEGACY_COLUMN_EXISTS_SQL =
            "SELECT COUNT(*) FROM information_schema.columns " +
            "WHERE LOWER(table_schema) = LOWER(CURRENT_SCHEMA()) " +
            "AND LOWER(table_name) = 'inquiries' AND LOWER(column_name) = 'inquiry_type'";

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        Integer legacyColumnCount = jdbcTemplate.queryForObject(LEGACY_COLUMN_EXISTS_SQL, Integer.class);
        if (legacyColumnCount == null || legacyColumnCount == 0) {
            log.info("[InquirySchemaMigration] legacy inquiry_type 컬럼 없음 — 건너뜀");
            return;
        }

        jdbcTemplate.execute("ALTER TABLE inquiries DROP COLUMN inquiry_type");
        log.info("[InquirySchemaMigration] legacy inquiry_type 컬럼 제거 완료");
    }
}
