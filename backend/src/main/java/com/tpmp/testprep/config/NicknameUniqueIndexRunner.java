package com.tpmp.testprep.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 닉네임 컬럼에 대소문자 무시 functional unique index 를 적용하는 마이그레이션 러너.
 *
 * <p>실행 순서:
 * <ol>
 *   <li>@Order(150) UserNicknameInitRunner — NULL 닉네임을 '사용자{id}'로 채움 (선행 필수)</li>
 *   <li>@Order(250) 이 러너 — 중복 닉네임 정리 → functional unique index 생성</li>
 * </ol>
 *
 * <p>선행 중복 정리:
 * LOWER(nickname) 기준 동일 값이 여러 행에 존재할 경우, id 가 큰 행(늦게 가입한 사용자)의
 * 닉네임을 '사용자{id}'로 안전하게 덮어써 중복을 해소한다.
 * 이미 해당 값이 존재하지 않으면 아무 동작도 하지 않는다(멱등).
 *
 * <p>인덱스 생성:
 * {@code CREATE UNIQUE INDEX IF NOT EXISTS ux_users_nickname_lower ON users (LOWER(nickname))}
 * 를 실행한다. IF NOT EXISTS 로 멱등 보장.
 *
 * <p>애플리케이션 레벨의 {@code existsByNicknameIgnoreCase} 검증은 그대로 유지되며,
 * 이 인덱스는 동시 요청으로 인한 레이스 컨디션 방어용 2차 안전장치 역할을 한다.
 */
@Slf4j
@Component
@Order(250)
@RequiredArgsConstructor
public class NicknameUniqueIndexRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        deduplicateNicknames();
        createUniqueIndex();
    }

    /**
     * LOWER(nickname) 기준 중복 그룹에서 id 가 큰 행의 닉네임을 '사용자{id}' 로 교체한다.
     * 중복이 없으면 0건 반환.
     */
    private void deduplicateNicknames() {
        int updated = jdbcTemplate.update(
                "UPDATE users u " +
                "SET nickname = CONCAT('사용자', u.id) " +
                "WHERE u.id IN ( " +
                "    SELECT id FROM ( " +
                "        SELECT id, " +
                "               ROW_NUMBER() OVER (PARTITION BY LOWER(nickname) ORDER BY id ASC) AS rn " +
                "        FROM users " +
                "        WHERE nickname IS NOT NULL " +
                "    ) sub " +
                "    WHERE sub.rn > 1 " +
                ")"
        );
        if (updated == 0) {
            log.info("[NicknameUniqueIndex] 대소문자 중복 없음 — 정리 건너뜀");
        } else {
            log.info("[NicknameUniqueIndex] 대소문자 중복 닉네임 {}건 '사용자{{id}}' 로 교체 완료", updated);
        }
    }

    /**
     * LOWER(nickname) 기반 functional unique index 를 생성한다. 이미 존재하면 건너뜀.
     */
    private void createUniqueIndex() {
        jdbcTemplate.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS ux_users_nickname_lower " +
                "ON users (LOWER(nickname))"
        );
        log.info("[NicknameUniqueIndex] ux_users_nickname_lower 인덱스 적용 완료 (이미 존재 시 건너뜀)");
    }
}
