package com.tpmp.testprep.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@Order(110)
@RequiredArgsConstructor
public class InquiryStatusConstraintMigrationRunner implements ApplicationRunner {

    private static final String CONSTRAINT_DEFINITION_SQL =
            "SELECT pg_get_constraintdef(c.oid) FROM pg_constraint c " +
            "JOIN pg_class t ON t.oid = c.conrelid " +
            "JOIN pg_namespace n ON n.oid = t.relnamespace " +
            "WHERE n.nspname = CURRENT_SCHEMA() AND t.relname = 'inquiries' " +
            "AND c.conname = 'inquiries_status_check'";
    private static final String DROP_CONSTRAINT_SQL =
            "ALTER TABLE inquiries DROP CONSTRAINT inquiries_status_check";
    private static final String ADD_CONSTRAINT_SQL =
            "ALTER TABLE inquiries ADD CONSTRAINT inquiries_status_check CHECK " +
            "(status IN ('PENDING','IN_PROGRESS','ON_HOLD','ANSWERED','COMPLETED','UNABLE_TO_PROCESS'))";
    private static final Set<String> EXPECTED_STATUSES = Set.of(
            "PENDING", "IN_PROGRESS", "ON_HOLD", "ANSWERED", "COMPLETED", "UNABLE_TO_PROCESS");
    private static final Pattern QUOTED_VALUE_PATTERN = Pattern.compile("'([A-Z_]+)'");

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        run();
    }

    public void run() {
        String definition = findConstraintDefinition();
        if (hasExpectedStatuses(definition)) {
            log.info("[InquiryStatusConstraintMigration] 문의 상태 제약조건 최신 상태 — 건너뜀");
            return;
        }
        if (definition != null) {
            jdbcTemplate.execute(DROP_CONSTRAINT_SQL);
        }
        jdbcTemplate.execute(ADD_CONSTRAINT_SQL);
        log.info("[InquiryStatusConstraintMigration] 문의 상태 제약조건 6개 상태로 보정 완료");
    }

    private String findConstraintDefinition() {
        try {
            return jdbcTemplate.queryForObject(CONSTRAINT_DEFINITION_SQL, String.class);
        } catch (EmptyResultDataAccessException exception) {
            return null;
        }
    }

    private boolean hasExpectedStatuses(String definition) {
        if (definition == null) {
            return false;
        }
        Matcher matcher = QUOTED_VALUE_PATTERN.matcher(definition);
        Set<String> statuses = new java.util.HashSet<>();
        while (matcher.find()) {
            statuses.add(matcher.group(1));
        }
        return statuses.equals(EXPECTED_STATUSES);
    }
}
