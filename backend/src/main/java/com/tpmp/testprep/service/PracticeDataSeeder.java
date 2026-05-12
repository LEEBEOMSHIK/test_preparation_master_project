package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.DialectConversionRule;
import com.tpmp.testprep.repository.DialectConversionRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PracticeDataSeeder {

    private final DialectConversionRuleRepository repo;

    @PostConstruct
    public void seedConversionRules() {
        if (repo.count() > 0) return;

        repo.saveAll(List.of(
            // ── MySQL ──────────────────────────────────────────────────────────
            rule("mysql", "mysql_auto_increment", 1,
                "AUTO_INCREMENT → IDENTITY 변환",
                "AUTO_INCREMENT → GENERATED ALWAYS AS IDENTITY",
                false),
            rule("mysql", "mysql_datatypes", 2,
                "데이터 타입·문법 자동 변환",
                "DATETIME, TINYINT, UNSIGNED, CHARACTER SET 등 자동 변환",
                false),
            rule("mysql", "mysql_delimiter", 3,
                "DELIMITER // 처리",
                "DELIMITER // ... END // DELIMITER ; (MySQL 모드 전용)",
                false),
            rule("mysql", "mysql_procedure", 4,
                "BEGIN...END 프로시저 → PostgreSQL 변환",
                "BEGIN...END 프로시저 → LANGUAGE plpgsql AS $$...$$",
                true),
            rule("mysql", "mysql_trigger", 5,
                "BEGIN...END 인라인 트리거 → 함수+트리거 분리",
                "BEGIN...END 인라인 트리거 → 함수+트리거로 분리",
                true),

            // ── Oracle ─────────────────────────────────────────────────────────
            rule("oracle", "oracle_datatypes", 1,
                "데이터 타입·함수 자동 변환",
                "NUMBER, VARCHAR2, CLOB, BLOB, NCHAR, SYSDATE, NVL 자동 변환",
                false),
            rule("oracle", "oracle_dual", 2,
                "FROM DUAL 변환",
                "FROM DUAL → FROM (SELECT 1) AS dual",
                false),
            rule("oracle", "oracle_modify", 3,
                "MODIFY 구문 변환",
                "MODIFY(col ...) → ALTER COLUMN 변환, IDENTITY 컬럼 타입 자동 보정",
                false),
            rule("oracle", "oracle_procedure", 4,
                "IS/AS BEGIN...END 프로시저 → PostgreSQL 변환",
                "IS/AS BEGIN...END 프로시저 → LANGUAGE plpgsql AS $$...$$",
                true),
            rule("oracle", "oracle_trigger", 5,
                "BEGIN...END 인라인 트리거 → 함수+트리거 + :NEW/:OLD 변환",
                "BEGIN...END 인라인 트리거 → 함수+트리거로 분리, :NEW.col / :OLD.col → NEW.col / OLD.col",
                true)
        ));
    }

    private DialectConversionRule rule(String dialect, String ruleKey, int order,
                                       String adminLabel, String userLabel, boolean complex) {
        return DialectConversionRule.builder()
                .dialect(dialect)
                .ruleKey(ruleKey)
                .adminLabel(adminLabel)
                .userLabel(userLabel)
                .enabled(true)
                .displayOrder(order)
                .complex(complex)
                .build();
    }
}
