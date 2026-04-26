package com.tpmp.testprep.config;

import com.tpmp.testprep.entity.*;
import com.tpmp.testprep.repository.*;
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
    private final PermissionMasterRepository permissionMasterRepository;
    private final MenuConfigRepository menuConfigRepository;

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
        ensurePermissionMasters();
        ensureDefaultMenus();
        ensureAdminUsersMenu();
        ensureExamInfoMenus();
    }

    private void fixAnswerNullable() {
        try {
            jdbcTemplate.execute("ALTER TABLE questions ALTER COLUMN answer DROP NOT NULL");
            log.info("[DataInitializer] questions.answer NOT NULL 제약 해제 완료");
        } catch (Exception e) {
            log.debug("[DataInitializer] questions.answer 제약 변경 건너뜀: {}", e.getMessage());
        }
    }

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

    @Transactional
    public void ensurePermissionMasters() {
        ensurePermissionMaster("USER",  "사용자", "일반 사용자 권한",  PermissionMaster.PermissionScope.USER);
        ensurePermissionMaster("ADMIN", "관리자", "전체 관리자 권한", PermissionMaster.PermissionScope.ADMIN);
        // JPA self-invocation 우회: JdbcTemplate으로 scope를 직접 동기화
        jdbcTemplate.update("UPDATE permission_master SET scope = 'USER'  WHERE code = 'USER'");
        jdbcTemplate.update("UPDATE permission_master SET scope = 'ADMIN' WHERE code = 'ADMIN'");
        log.info("[DataInitializer] 권한 마스터 scope 동기화 완료");
    }

    private void ensurePermissionMaster(String code, String name, String description,
                                        PermissionMaster.PermissionScope scope) {
        if (permissionMasterRepository.existsByCode(code)) {
            log.debug("[DataInitializer] 권한 마스터 '{}' 이미 존재", code);
            return;
        }
        permissionMasterRepository.save(PermissionMaster.builder()
                .code(code).name(name).description(description).scope(scope).build());
        log.info("[DataInitializer] 권한 마스터 '{}' 생성 완료", code);
    }

    @Transactional
    public void ensureDefaultMenus() {
        if (menuConfigRepository.count() > 0) {
            log.debug("[DataInitializer] 메뉴 데이터 이미 존재 — 건너뜀");
            return;
        }

        // ── Admin menus ──
        saveMenu(null, "시험 관리",     "/admin/exams",              "exam",       1,  MenuConfig.MenuType.ADMIN, "ADMIN");
        saveMenu(null, "개념노트 관리", "/admin/concepts",           "concept",    2,  MenuConfig.MenuType.ADMIN, "ADMIN");
        saveMenu(null, "1:1 문의 관리", "/admin/inquiries",          "inquiry",    3,  MenuConfig.MenuType.ADMIN, "ADMIN");
        saveMenu(null, "FAQ 관리",      "/admin/faq",                "faq",        4,  MenuConfig.MenuType.ADMIN, "ADMIN");
        saveMenu(null, "명언 관리",     "/admin/quotes",             "quote",      5,  MenuConfig.MenuType.ADMIN, "ADMIN");
        saveMenu(null, "테이블 관리",   "/admin/tables",             "table",      6,  MenuConfig.MenuType.ADMIN, "ADMIN");
        saveMenu(null, "권한 관리",     "/admin/permissions",        "permission", 7,  MenuConfig.MenuType.ADMIN, "ADMIN");
        saveMenu(null, "메뉴 관리",     "/admin/menus",              "menu",       8,  MenuConfig.MenuType.ADMIN, "ADMIN");

        // Admin sub-menus (parentId resolved by URL lookup would be complex; use display_order logic)
        // We insert top-levels first, then sub-menus with parentId from DB
        Long examParentId   = menuConfigRepository.findByMenuTypeOrderByDisplayOrderAsc(MenuConfig.MenuType.ADMIN)
                .stream().filter(m -> "/admin/exams".equals(m.getUrl())).findFirst().map(MenuConfig::getId).orElse(null);
        Long tableParentId  = menuConfigRepository.findByMenuTypeOrderByDisplayOrderAsc(MenuConfig.MenuType.ADMIN)
                .stream().filter(m -> "/admin/tables".equals(m.getUrl())).findFirst().map(MenuConfig::getId).orElse(null);

        if (examParentId != null) {
            saveMenu(examParentId,  "문항 관리",   "/admin/exams/questions", null, 1, MenuConfig.MenuType.ADMIN, "ADMIN");
            saveMenu(examParentId,  "시험지 관리", "/admin/exams/papers",    null, 2, MenuConfig.MenuType.ADMIN, "ADMIN");
        }
        if (tableParentId != null) {
            saveMenu(tableParentId, "DB 조회",     "/admin/tables/data",     null, 1, MenuConfig.MenuType.ADMIN, "ADMIN");
            saveMenu(tableParentId, "도메인 관리", "/admin/tables/domains",  null, 2, MenuConfig.MenuType.ADMIN, "ADMIN");
        }

        // ── User menus ──
        saveMenu(null, "시험",        "/user/exams",     "exam",    1, MenuConfig.MenuType.USER, "USER,ADMIN");
        saveMenu(null, "데일리 퀴즈", "/user/quiz",      "quiz",    2, MenuConfig.MenuType.USER, "USER,ADMIN");
        saveMenu(null, "개념노트",    "/user/concepts",  "concept", 3, MenuConfig.MenuType.USER, "USER,ADMIN");
        saveMenu(null, "FAQ",         "/user/faq",       "faq",     4, MenuConfig.MenuType.USER, "USER,ADMIN");
        saveMenu(null, "1:1 문의",    "/user/inquiries", "inquiry", 5, MenuConfig.MenuType.USER, "USER,ADMIN");

        log.info("[DataInitializer] 기본 메뉴 데이터 생성 완료");
    }

    private void ensureAdminUsersMenu() {
        if (!menuConfigRepository.existsByUrl("/admin/users")) {
            saveMenu(null, "계정 관리", "/admin/users", "users", 9, MenuConfig.MenuType.ADMIN, "ADMIN");
            log.info("[DataInitializer] 계정 관리 메뉴 추가 완료");
        }
    }

    private void ensureExamInfoMenus() {
        if (!menuConfigRepository.existsByUrl("/admin/exam-info")) {
            saveMenu(null, "시험 정보 관리", "/admin/exam-info", "examinfo", 10, MenuConfig.MenuType.ADMIN, "ADMIN");
            log.info("[DataInitializer] 시험 정보 관리 메뉴 추가 완료");
        }
        if (!menuConfigRepository.existsByUrl("/user/exam-info")) {
            saveMenu(null, "시험 정보", "/user/exam-info", "examinfo", 0, MenuConfig.MenuType.USER, "USER,ADMIN");
            log.info("[DataInitializer] 시험 정보 사용자 메뉴 추가 완료");
        }
    }

    private void saveMenu(Long parentId, String name, String url, String iconKey,
                          int order, MenuConfig.MenuType type, String allowedRoles) {
        menuConfigRepository.save(MenuConfig.builder()
                .parentId(parentId)
                .name(name)
                .url(url)
                .iconKey(iconKey)
                .displayOrder(order)
                .menuType(type)
                .isActive(true)
                .allowedRoles(allowedRoles)
                .build());
    }
}
