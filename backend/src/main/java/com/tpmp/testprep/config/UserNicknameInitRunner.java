package com.tpmp.testprep.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 기존 사용자(nickname IS NULL)에게 기본 닉네임 '사용자{id}'를 부여하는 초기화 러너.
 *
 * 신규 가입 사용자는 AuthService/CustomOAuth2UserService에서 id 확정 후 닉네임을 설정하므로
 * 이 러너는 마이그레이션 목적으로만 동작한다. 멱등.
 */
@Slf4j
@Component
@Order(150)
@RequiredArgsConstructor
public class UserNicknameInitRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        int count = jdbcTemplate.update(
                "UPDATE users SET nickname = CONCAT('사용자', id) WHERE nickname IS NULL"
        );
        if (count == 0) {
            log.info("[UserNicknameInit] 모두 이미 설정됨 — 건너뜀");
        } else {
            log.info("[UserNicknameInit] 기존 사용자 {}건 닉네임 초기화 완료", count);
        }
    }
}
