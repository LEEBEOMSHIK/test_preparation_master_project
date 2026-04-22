package com.tpmp.testprep.config;

import com.tpmp.testprep.entity.DomainMaster;
import com.tpmp.testprep.entity.DomainSlave;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.repository.DomainMasterRepository;
import com.tpmp.testprep.repository.DomainSlaveRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private static final String ADMIN_EMAIL    = "admin@tpmp.com";
    private static final String ADMIN_PASSWORD = "Admin1234!";
    private static final String ADMIN_NAME     = "테스트 관리자";

    private static final String TEST_USER_EMAIL    = "user@tpmp.com";
    private static final String TEST_USER_PASSWORD = "User1234!";
    private static final String TEST_USER_NAME     = "테스트 사용자";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;
    private final DomainMasterRepository domainMasterRepository;
    private final DomainSlaveRepository domainSlaveRepository;

    @Override
    public void run(ApplicationArguments args) {
        fixAnswerNullable();
        fixQuestionTypeConstraints();
        ensureAdminUser();
        ensureTestUser();
        ensureDomainMaster("문제 유형",
                new String[]{"운영체제", "SQL", "프로그래밍 언어", "네트워크", "정보보안"});
        ensureDomainMaster("시험 유형",
                new String[]{"SQLD", "정보처리기사 실기", "정보처리기사 필기", "리눅스마스터 1급"});
    }

    /** questions.answer NOT NULL 제약 해제 */
    private void fixAnswerNullable() {
        try {
            jdbcTemplate.execute("ALTER TABLE questions ALTER COLUMN answer DROP NOT NULL");
            log.info("[DataInitializer] questions.answer NOT NULL 제약 해제 완료");
        } catch (Exception e) {
            log.debug("[DataInitializer] questions.answer 제약 변경 건너뜀: {}", e.getMessage());
        }
    }

    /**
     * question_type CHECK 제약 재생성 — CODE 포함.
     * Hibernate ddl-auto:update 는 기존 제약을 수정하지 않으므로 수동 처리.
     */
    private void fixQuestionTypeConstraints() {
        String[] tables = {"questions", "question_bank"};
        for (String table : tables) {
            try {
                jdbcTemplate.execute(
                    "ALTER TABLE " + table + " DROP CONSTRAINT IF EXISTS " + table + "_question_type_check");
                jdbcTemplate.execute(
                    "ALTER TABLE " + table + " ADD CONSTRAINT " + table + "_question_type_check " +
                    "CHECK (question_type IN ('MULTIPLE_CHOICE', 'SHORT_ANSWER', 'OX', 'CODE'))");
                log.info("[DataInitializer] {}.question_type_check 제약 재생성 완료", table);
            } catch (Exception e) {
                log.warn("[DataInitializer] {}.question_type_check 제약 재생성 실패: {}", table, e.getMessage());
            }
        }
    }

    @Transactional
    public void ensureAdminUser() {
        String encoded = passwordEncoder.encode(ADMIN_PASSWORD);
        int updated = jdbcTemplate.update(
                "UPDATE users SET password = ?, role = ?, name = ? WHERE email = ?",
                encoded, User.Role.ADMIN.name(), ADMIN_NAME, ADMIN_EMAIL);

        if (updated == 0) {
            userRepository.save(User.builder()
                    .email(ADMIN_EMAIL)
                    .password(encoded)
                    .name(ADMIN_NAME)
                    .role(User.Role.ADMIN)
                    .build());
        }
        log.info("[DataInitializer] 관리자 계정 준비 완료 — {}", ADMIN_EMAIL);
    }

    @Transactional
    public void ensureTestUser() {
        String encoded = passwordEncoder.encode(TEST_USER_PASSWORD);
        int updated = jdbcTemplate.update(
                "UPDATE users SET password = ?, role = ?, name = ? WHERE email = ?",
                encoded, User.Role.USER.name(), TEST_USER_NAME, TEST_USER_EMAIL);

        if (updated == 0) {
            userRepository.save(User.builder()
                    .email(TEST_USER_EMAIL)
                    .password(encoded)
                    .name(TEST_USER_NAME)
                    .role(User.Role.USER)
                    .build());
        }
        log.info("[DataInitializer] 테스트 사용자 계정 준비 완료 — {}", TEST_USER_EMAIL);
    }

    /**
     * 도메인 마스터/슬레이브 데이터 보장 (중복 생성 방지).
     * 이름으로 마스터를 검색해 없을 때만 생성한다.
     */
    @Transactional
    public void ensureDomainMaster(String masterName, String[] slaveNames) {
        if (domainMasterRepository.findByName(masterName).isPresent()) {
            log.debug("[DataInitializer] 도메인 마스터 '{}' 이미 존재 — 건너뜀", masterName);
            return;
        }
        DomainMaster master = domainMasterRepository.save(
                DomainMaster.builder().name(masterName).build());
        for (int i = 0; i < slaveNames.length; i++) {
            domainSlaveRepository.save(DomainSlave.builder()
                    .master(master)
                    .name(slaveNames[i])
                    .displayOrder(i + 1)
                    .build());
        }
        log.info("[DataInitializer] 도메인 '{}' 생성 완료 — 슬레이브 {}개", masterName, slaveNames.length);
    }
}
