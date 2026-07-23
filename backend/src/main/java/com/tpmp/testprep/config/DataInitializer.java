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
    private final PermissionDetailRepository permissionDetailRepository;
    private final MenuConfigRepository menuConfigRepository;
    private final com.tpmp.testprep.service.PracticeService practiceService;
    private final ExamInfoRepository examInfoRepository;

    @Override
    public void run(ApplicationArguments args) {
        fixAnswerNullable();
        fixQuestionTypeConstraints();
        fixInquiryTypeConstraint();
        ensureAdminUser();
        ensureTestUser();
        ensureDomainMasterWithCode("QUESTION_TYPE", "문제 유형",
                new String[]{"운영체제", "SQL", "프로그래밍 언어", "네트워크", "정보보안"});
        ensureDomainMasterWithCode("EXAM_TYPE", "시험 유형",
                new String[]{"SQLD", "정보처리기사 실기", "정보처리기사 필기", "리눅스마스터 1급"});
        ensureDomainMasterWithCode("EXAM_YEAR", "시험 연도",
                new String[]{"2026", "2025", "2024", "2023", "2022"});
        ensureDomainMasterWithCode("EXAM_ROUND", "시험 회차",
                new String[]{"1", "2", "3", "4", "5", "6", "7", "8", "9", "10"});
        ensureDomainMasterWithCode("INQUIRY_CATEGORY", "문의 카테고리",
                new String[]{"EXAM", "CONCEPT_NOTE", "DAILY_QUIZ", "PRACTICE", "OTHER"});
        ensurePermissionMasters();
        ensureDefaultPermissionDetails();
        ensureAdminUserPermissions();
        ensureDefaultMenus();
        ensureAdminUsersMenu();
        ensureExamInfoMenus();
        ensureTestCaseMenu();
        ensurePracticeMenu();
        ensureBookmarkMenu();
        ensureExamHistoryMenu();
        ensureDashboardMenu();
        ensurePracticeAdminMenus();
        ensureSupportSettingsMenu();
        ensureUserMenuGroups();
        ensurePermissionMenuAssociations();
        ensureQnetPracticalExamInfo();
        ensurePracticeSchema();
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
        // 시험 문항과 문제은행 모두 동일한 6개 문항 유형을 지원한다.
        fixQuestionTypeConstraint("questions",
                "'MULTIPLE_CHOICE', 'SHORT_ANSWER', 'OX', 'CODE', 'SCHEDULING', 'SQL'");
        fixQuestionTypeConstraint("question_bank",
                "'MULTIPLE_CHOICE', 'SHORT_ANSWER', 'OX', 'CODE', 'SCHEDULING', 'SQL'");
    }

    private void fixQuestionTypeConstraint(String table, String allowedValues) {
        try {
            jdbcTemplate.execute(
                "ALTER TABLE " + table + " DROP CONSTRAINT IF EXISTS " + table + "_question_type_check");
            jdbcTemplate.execute(
                "ALTER TABLE " + table + " ADD CONSTRAINT " + table + "_question_type_check " +
                "CHECK (question_type IN (" + allowedValues + "))");
            log.info("[DataInitializer] {}.question_type_check 제약 재생성 완료", table);
        } catch (Exception e) {
            log.warn("[DataInitializer] {}.question_type_check 제약 재생성 실패: {}", table, e.getMessage());
        }
    }

    private void fixInquiryTypeConstraint() {
        try {
            jdbcTemplate.execute(
                "ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_inquiry_type_check");
            jdbcTemplate.execute(
                "ALTER TABLE inquiries ADD CONSTRAINT inquiries_inquiry_type_check " +
                "CHECK (inquiry_type IN ('EXAM','CONCEPT_NOTE','DAILY_QUIZ','PRACTICE','OTHER'))");
            log.info("[DataInitializer] inquiries.inquiry_type_check 제약 재생성 완료");
        } catch (Exception e) {
            log.warn("[DataInitializer] inquiries.inquiry_type_check 제약 재생성 실패: {}", e.getMessage());
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
    public void ensureDomainMasterWithCode(String code, String masterName, String[] slaveNames) {
        // 코드로 먼저 조회 — 이미 있으면 건너뜀
        if (domainMasterRepository.findByCode(code).isPresent()) {
            log.debug("[DataInitializer] 도메인 마스터 코드 '{}' 이미 존재 — 건너뜀", code);
            return;
        }
        // 이름으로 조회 — 기존 데이터(코드 없는)에 코드만 부여
        var byName = domainMasterRepository.findByName(masterName);
        if (byName.isPresent()) {
            DomainMaster existing = byName.get();
            existing.updateCode(code);
            domainMasterRepository.save(existing);
            log.info("[DataInitializer] 도메인 마스터 '{}' 코드 부여: {}", masterName, code);
            return;
        }
        // 신규 생성
        DomainMaster master = domainMasterRepository.save(
                DomainMaster.builder().code(code).name(masterName).build());
        for (int i = 0; i < slaveNames.length; i++) {
            domainSlaveRepository.save(DomainSlave.builder()
                    .master(master)
                    .name(slaveNames[i])
                    .displayOrder(i + 1)
                    .build());
        }
        log.info("[DataInitializer] 도메인 '{}' (code={}) 생성 완료 — 슬레이브 {}개", masterName, code, slaveNames.length);
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

    /** admin@tpmp.com 계정에 MASTER_ADMIN 세부 권한을 부여 (이미 있으면 건너뜀) */
    @Transactional
    public void ensureAdminUserPermissions() {
        try {
            Long adminId = jdbcTemplate.queryForObject(
                    "SELECT id FROM users WHERE email = ?", Long.class, ADMIN_EMAIL);
            Long masterAdminId = jdbcTemplate.queryForObject(
                    "SELECT id FROM permission_detail WHERE code = 'MASTER_ADMIN'", Long.class);
            if (adminId == null || masterAdminId == null) return;

            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM user_granted_permissions WHERE user_id = ? AND detail_id = ?",
                    Integer.class, adminId, masterAdminId);
            if (count == null || count == 0) {
                jdbcTemplate.update(
                        "INSERT INTO user_granted_permissions (user_id, detail_id) VALUES (?, ?)",
                        adminId, masterAdminId);
                log.info("[DataInitializer] 관리자 계정에 MASTER_ADMIN 권한 부여 완료 — {}", ADMIN_EMAIL);
            } else {
                log.debug("[DataInitializer] 관리자 MASTER_ADMIN 권한 이미 존재 — 건너뜀");
            }
        } catch (Exception e) {
            log.warn("[DataInitializer] 관리자 MASTER_ADMIN 권한 부여 실패: {}", e.getMessage());
        }
    }

    /** USER 메뉴에 GENERAL_USER, ADMIN 메뉴에 MASTER_ADMIN 권한 코드를 allowedRoles에 추가 */
    @Transactional
    public void ensurePermissionMenuAssociations() {
        jdbcTemplate.update(
                "UPDATE menu_config SET allowed_roles = " +
                "CASE WHEN COALESCE(allowed_roles, '') = '' THEN 'GENERAL_USER' " +
                "     ELSE allowed_roles || ',GENERAL_USER' END " +
                "WHERE menu_type = 'USER' " +
                "AND COALESCE(allowed_roles, '') NOT LIKE '%GENERAL_USER%'"
        );
        jdbcTemplate.update(
                "UPDATE menu_config SET allowed_roles = " +
                "CASE WHEN COALESCE(allowed_roles, '') = '' THEN 'MASTER_ADMIN' " +
                "     ELSE allowed_roles || ',MASTER_ADMIN' END " +
                "WHERE menu_type = 'ADMIN' " +
                "AND COALESCE(allowed_roles, '') NOT LIKE '%MASTER_ADMIN%'"
        );
        // 1:1 문의는 세부 권한 없어도 항상 접근 가능 (관리자에게 권한 요청용)
        jdbcTemplate.update(
                "UPDATE menu_config SET allowed_roles = " +
                "CASE WHEN COALESCE(allowed_roles, '') = '' THEN 'PUBLIC' " +
                "     ELSE allowed_roles || ',PUBLIC' END " +
                "WHERE url = '/user/inquiries' " +
                "AND COALESCE(allowed_roles, '') NOT LIKE '%PUBLIC%'"
        );
        log.info("[DataInitializer] 권한-메뉴 기본 연결(GENERAL_USER/MASTER_ADMIN/PUBLIC) 완료");
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

    @Transactional
    public void ensureDefaultPermissionDetails() {
        ensurePermissionDetail("USER",  "GENERAL_USER",  "일반 사용자", "일반 사용자 기본 세부 권한");
        ensurePermissionDetail("ADMIN", "MASTER_ADMIN",  "총괄 관리자", "전체 시스템 총괄 관리자 세부 권한");
    }

    private void ensurePermissionDetail(String masterCode, String detailCode, String name, String description) {
        if (permissionDetailRepository.existsByCode(detailCode)) {
            log.debug("[DataInitializer] 세부 권한 '{}' 이미 존재 — 건너뜀", detailCode);
            return;
        }
        permissionMasterRepository.findByCode(masterCode).ifPresent(master -> {
            permissionDetailRepository.save(PermissionDetail.builder()
                    .master(master)
                    .code(detailCode)
                    .name(name)
                    .description(description)
                    .build());
            log.info("[DataInitializer] 세부 권한 '{}' ({}) 생성 완료", name, detailCode);
        });
    }

    private void ensureTestCaseMenu() {
        // 기존에 시험 관리 하위(/admin/exams/test-cases)로 잘못 등록된 경우 최상위로 이동
        int migrated = jdbcTemplate.update(
                "UPDATE menu_config SET url = '/admin/test-cases', parent_id = NULL, " +
                "icon_key = 'test', display_order = 99 WHERE url = '/admin/exams/test-cases'");
        if (migrated > 0) {
            log.info("[DataInitializer] 테스트 케이스 관리 메뉴 URL 마이그레이션 완료 (/admin/exams/test-cases → /admin/test-cases)");
        }
        if (!menuConfigRepository.existsByUrl("/admin/test-cases")) {
            saveMenu(null, "테스트 케이스 관리", "/admin/test-cases", "test", 99, MenuConfig.MenuType.ADMIN, "ADMIN");
            log.info("[DataInitializer] 테스트 케이스 관리 메뉴 추가 완료");
        }
    }

    private void ensurePracticeMenu() {
        if (!menuConfigRepository.existsByUrl("/user/practice")) {
            saveMenu(null, "연습장", "/user/practice", "practice", 7, MenuConfig.MenuType.USER, "USER,ADMIN");
            log.info("[DataInitializer] 연습장 사용자 메뉴 추가 완료");
        }
    }

    private void ensureBookmarkMenu() {
        if (!menuConfigRepository.existsByUrl("/user/bookmarks")) {
            saveMenu(null, "복습 표시", "/user/bookmarks", "bookmark", 8, MenuConfig.MenuType.USER, "USER,ADMIN");
            log.info("[DataInitializer] 복습 표시 사용자 메뉴 추가 완료");
        }
    }

    private void ensureExamHistoryMenu() {
        if (!menuConfigRepository.existsByUrl("/user/exam-history")) {
            saveMenu(null, "시험 이력", "/user/exam-history", "history", 9, MenuConfig.MenuType.USER, "USER,ADMIN");
            log.info("[DataInitializer] 시험 이력 사용자 메뉴 추가 완료");
        }
    }

    private void ensureDashboardMenu() {
        if (!menuConfigRepository.existsByUrl("/user/dashboard")) {
            saveMenu(null, "통계 대시보드", "/user/dashboard", "dashboard", -1, MenuConfig.MenuType.USER, "USER,ADMIN");
            log.info("[DataInitializer] 통계 대시보드 사용자 메뉴 추가 완료");
        }
    }

    /**
     * USER 메뉴를 그룹(학습/내 기록/도움말) 구조로 재배치한다.
     * - '시험'은 빠른 접근을 위해 최상위로 유지한다.
     * - 그룹 부모는 실제 페이지가 없으므로 합성 URL(/user/group/*)을 사용하며,
     *   프론트엔드 렌더러는 children이 있는 항목을 드롭다운 토글로 처리한다.
     * 매 부팅 시 동일 값으로 재설정하므로 멱등하다.
     */
    private void ensureConceptNotesIndex() {
        try {
            jdbcTemplate.execute(
                "CREATE INDEX IF NOT EXISTS idx_concept_notes_public_updated " +
                "ON concept_notes(is_public, updated_at DESC)");
            log.info("[DataInitializer] idx_concept_notes_public_updated 인덱스 준비 완료");
        } catch (Exception e) {
            log.warn("[DataInitializer] idx_concept_notes_public_updated 인덱스 생성 실패: {}", e.getMessage());
        }
    }

    private void ensureUserMenuGroups() {
        // 0a) 인덱스 보강
        ensureConceptNotesIndex();

        // 0b) 공개 탐색 메뉴 생성 (멱등)
        if (!menuConfigRepository.existsByUrl("/user/concepts/explore")) {
            saveMenu(null, "공개 탐색", "/user/concepts/explore", "explore", 0, MenuConfig.MenuType.USER, "USER,ADMIN");
            log.info("[DataInitializer] 공개 탐색 사용자 메뉴 추가 완료");
        }

        // 0c) 도움말 그룹에 들어갈 '설정' 메뉴 생성 (멱등)
        if (!menuConfigRepository.existsByUrl("/user/settings")) {
            saveMenu(null, "설정", "/user/settings", "settings", 0, MenuConfig.MenuType.USER, "USER,ADMIN");
            log.info("[DataInitializer] 설정 사용자 메뉴 추가 완료");
        }

        // 0d) 도움말 그룹에 들어갈 '개발자 응원하기' 메뉴 생성 (멱등)
        if (!menuConfigRepository.existsByUrl("/user/support")) {
            saveMenu(null, "개발자 응원하기", "/user/support", "support", 0, MenuConfig.MenuType.USER, "USER,ADMIN");
            log.info("[DataInitializer] 개발자 응원하기 사용자 메뉴 추가 완료");
        }

        // 1) 그룹 부모 생성 (멱등)
        ensureGroupMenu("학습",    "/user/group/learning", "learn",   2);
        ensureGroupMenu("내 기록", "/user/group/records",  "records", 3);
        ensureGroupMenu("도움말",  "/user/group/help",     "help",    4);

        Long learningId = menuIdByUrl("/user/group/learning");
        Long recordsId  = menuIdByUrl("/user/group/records");
        Long helpId     = menuIdByUrl("/user/group/help");
        if (learningId == null || recordsId == null || helpId == null) {
            log.warn("[DataInitializer] USER 메뉴 그룹 부모 조회 실패 — 재배치 건너뜀");
            return;
        }

        // 2) 최상위 표시 순서 (시험 → 학습 → 내 기록 → 도움말)
        reparentMenu("/user/exams",          null,       1);
        reparentMenu("/user/group/learning", null,       2);
        reparentMenu("/user/group/records",  null,       3);
        reparentMenu("/user/group/help",     null,       4);

        // 3) 그룹별 자식 재배치
        reparentMenu("/user/quiz",              learningId, 1);
        reparentMenu("/user/practice",          learningId, 2);
        reparentMenu("/user/concepts",          learningId, 3);
        reparentMenu("/user/concepts/explore",  learningId, 4);

        reparentMenu("/user/dashboard",    recordsId,  1);
        reparentMenu("/user/exam-history", recordsId,  2);
        reparentMenu("/user/bookmarks",    recordsId,  3);

        reparentMenu("/user/exam-info",    helpId,     1);
        reparentMenu("/user/faq",          helpId,     2);
        reparentMenu("/user/inquiries",    helpId,     3);
        reparentMenu("/user/settings",     helpId,     4);
        reparentMenu("/user/support",      helpId,     5);

        log.info("[DataInitializer] USER 메뉴 그룹 구조(학습/내 기록/도움말) 정리 완료");
    }

    private void ensureGroupMenu(String name, String url, String iconKey, int order) {
        if (!menuConfigRepository.existsByUrl(url)) {
            saveMenu(null, name, url, iconKey, order, MenuConfig.MenuType.USER, "USER,ADMIN");
            log.info("[DataInitializer] USER 메뉴 그룹 '{}' 생성 완료", name);
        }
    }

    private Long menuIdByUrl(String url) {
        try {
            return jdbcTemplate.queryForObject("SELECT id FROM menu_config WHERE url = ?", Long.class, url);
        } catch (Exception e) {
            return null;
        }
    }

    /** url로 메뉴를 찾아 parent_id·display_order를 갱신한다 (없으면 0건 — 무해). */
    private void reparentMenu(String url, Long parentId, int order) {
        jdbcTemplate.update(
                "UPDATE menu_config SET parent_id = ?, display_order = ? WHERE url = ?",
                parentId, order, url);
    }

    private void ensureSupportSettingsMenu() {
        if (!menuConfigRepository.existsByUrl("/admin/support-settings")) {
            saveMenu(null, "후원 링크 관리", "/admin/support-settings", "support", 12, MenuConfig.MenuType.ADMIN, "ADMIN");
            log.info("[DataInitializer] 후원 링크 관리 메뉴 추가 완료");
        }
    }

    private void ensurePracticeAdminMenus() {
        if (!menuConfigRepository.existsByUrl("/admin/practice")) {
            MenuConfig parent = menuConfigRepository.save(MenuConfig.builder()
                    .name("연습장 관리")
                    .url("/admin/practice")
                    .iconKey("practice")
                    .displayOrder(11)
                    .menuType(MenuConfig.MenuType.ADMIN)
                    .isActive(true)
                    .allowedRoles("ADMIN")
                    .build());
            saveMenu(parent.getId(), "규칙 관리", "/admin/practice/rules", null, 1, MenuConfig.MenuType.ADMIN, "ADMIN");
            saveMenu(parent.getId(), "기록 관리", "/admin/practice/history", null, 2, MenuConfig.MenuType.ADMIN, "ADMIN");
            log.info("[DataInitializer] 연습장 관리 메뉴 추가 완료");
        } else {
            // 부모는 있지만 자식이 누락된 경우 보완
            Long parentId = jdbcTemplate.queryForObject(
                    "SELECT id FROM menu_config WHERE url = '/admin/practice'", Long.class);
            if (parentId != null) {
                if (!menuConfigRepository.existsByUrl("/admin/practice/rules")) {
                    saveMenu(parentId, "규칙 관리", "/admin/practice/rules", null, 1, MenuConfig.MenuType.ADMIN, "ADMIN");
                    log.info("[DataInitializer] 연습장 규칙 관리 메뉴 추가 완료");
                }
                if (!menuConfigRepository.existsByUrl("/admin/practice/history")) {
                    saveMenu(parentId, "기록 관리", "/admin/practice/history", null, 2, MenuConfig.MenuType.ADMIN, "ADMIN");
                    log.info("[DataInitializer] 연습장 기록 관리 메뉴 추가 완료");
                }
            }
        }
    }

    @Transactional
    public void ensureQnetPracticalExamInfo() {
        String examType = "정보처리기사 실기";
        String description = """
                Q-Net 기준 정보처리기사 실기 시험정보입니다.
                실기 과목: 정보처리 실무
                검정방법: 필답형(2시간 30분)
                합격기준: 100점 만점 60점 이상
                수수료: 실기 22,600원
                출제경향: 요구사항 확인, 데이터 입출력 구현, 통합 구현, 서버프로그램 구현, 인터페이스 구현, 화면설계, 애플리케이션 테스트, SQL 응용, 소프트웨어 개발 보안, 프로그래밍 언어 활용, 응용 SW 기초 기술 활용, 제품 소프트웨어 패키징을 중심으로 평가합니다.
                출처: Q-Net 국가자격 종목별 상세정보(정보처리기사, 2026년 일정)
                """;
        String officialUrl = "https://www.q-net.or.kr/crf005.do?id=crf00503&jmCd=1320";

        ensureExamInfo(
                examType,
                "정보처리기사 실기 2026년 정기 기사 1회",
                description + "빈자리접수: 2026-04-12 ~ 2026-04-13",
                "2026-03-23 ~ 2026-03-26",
                "2026-04-18 ~ 2026-05-06",
                "2026-06-12",
                officialUrl,
                null,
                20
        );
        ensureExamInfo(
                examType,
                "정보처리기사 실기 2026년 정기 기사 2회",
                description + "빈자리접수: 2026-07-12 ~ 2026-07-13",
                "2026-06-22 ~ 2026-06-25",
                "2026-07-18 ~ 2026-08-05",
                "2026-09-11",
                officialUrl,
                null,
                21
        );
        ensureExamInfo(
                examType,
                "정보처리기사 실기 2026년 정기 기사 3회",
                description,
                "2026-09-21 ~ 2026-09-28",
                "2026-10-24 ~ 2026-11-13",
                "2026-12-18",
                officialUrl,
                null,
                22
        );
    }

    private void ensureExamInfo(String examType, String title, String description,
                                String applicationPeriod, String examSchedule,
                                String resultDate, String officialUrl, String applicationUrl, int displayOrder) {
        if (examInfoRepository.findByTitle(title).isPresent()) {
            log.debug("[DataInitializer] 시험 정보 '{}' 이미 존재 — 건너뜀", title);
            return;
        }

        examInfoRepository.save(ExamInfo.builder()
                .examType(examType)
                .title(title)
                .description(description)
                .applicationPeriod(applicationPeriod)
                .examSchedule(examSchedule)
                .resultDate(resultDate)
                .officialUrl(officialUrl)
                .applicationUrl(applicationUrl)
                .isActive(true)
                .displayOrder(displayOrder)
                .build());
        log.info("[DataInitializer] 시험 정보 '{}' 생성 완료", title);
    }

    @Transactional
    public void ensurePracticeSchema() {
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS prac_departments (
                    id       SERIAL PRIMARY KEY,
                    name     VARCHAR(100) NOT NULL,
                    location VARCHAR(100),
                    budget   NUMERIC(15,2)
                )
            """);
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS prac_employees (
                    id            SERIAL PRIMARY KEY,
                    name          VARCHAR(100) NOT NULL,
                    department_id INT REFERENCES prac_departments(id),
                    salary        NUMERIC(10,2),
                    hire_date     DATE,
                    email         VARCHAR(100),
                    job_title     VARCHAR(100)
                )
            """);
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS prac_products (
                    id       SERIAL PRIMARY KEY,
                    name     VARCHAR(200) NOT NULL,
                    category VARCHAR(100),
                    price    NUMERIC(10,2),
                    stock    INT DEFAULT 0
                )
            """);
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS prac_orders (
                    id            SERIAL PRIMARY KEY,
                    customer_name VARCHAR(100) NOT NULL,
                    product_id    INT REFERENCES prac_products(id),
                    quantity      INT NOT NULL,
                    total_amount  NUMERIC(10,2),
                    order_date    DATE NOT NULL
                )
            """);
            // 데이터가 없을 때만 시드
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM prac_departments", Integer.class);
            if (count == null || count == 0) {
                practiceService.seedDefaultData();
                log.info("[DataInitializer] 연습장 기본 데이터 시딩 완료");
            }
            log.info("[DataInitializer] 연습장 스키마 준비 완료");
        } catch (Exception e) {
            log.warn("[DataInitializer] 연습장 스키마 초기화 실패: {}", e.getMessage());
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
