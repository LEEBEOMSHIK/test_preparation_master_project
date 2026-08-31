# TPMP 관리자 이메일 템플릿 관리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자가 3종 문의 종료 상태 이메일의 HTML 템플릿과 이벤트 연결을 관리하고, 사용자 답변과 상태 변경을 분리하며, 템플릿 문제가 있어도 문의 상태 변경은 성공하게 만든다.

**Architecture:** `email_templates`와 `email_template_bindings`를 분리하고, 코드에 고정된 `EmailTemplateEvent`가 허용 범위와 문의 종료 상태를 연결한다. 저장·발송 양쪽에서 정화하는 `EmailTemplateRenderer`가 렌더링 스냅샷을 만들고 기존 `InquiryEmailDelivery` 큐가 HTML/텍스트 멀티파트를 발송한다. 관리자 UI는 템플릿·연결 탭과 편집 화면을 제공하며 문의 상세는 대화 답변과 상태 알림을 독립된 작업으로 다룬다.

**Tech Stack:** Java 17, Spring Boot 3.3.0, Spring Data JPA, PostgreSQL 15, OWASP Java HTML Sanitizer 20240325.1, jsoup 1.18.3, JUnit 5, Mockito, Next.js 14 App Router, React, TypeScript strict, Tailwind CSS, React Native Web, axios, Jest, React Testing Library

**Spec:** `docs/superpowers/specs/2026-08-31-admin-email-template-management-design.md`

## Global Constraints

- 모든 템플릿·연결 API는 `@PreAuthorize("hasRole('ADMIN')")`를 적용한다.
- 시스템 이벤트는 `INQUIRY_ANSWERED`, `INQUIRY_COMPLETED`, `INQUIRY_UNABLE_TO_PROCESS` 3개만 제공하며 관리자가 이벤트를 생성하거나 삭제하지 못한다.
- `INQUIRY_STATUS` 허용 변수는 `recipientName`, `inquiryId`, `inquiryTitle`, `inquiryType`, `statusLabel`, `inquiryDetailUrl`, `serviceName` 7개로 고정한다.
- 테스트 메일 수신자는 request body가 아니라 `@AuthenticationPrincipal`의 이메일로 조회한 현재 관리자 계정 이메일만 사용한다.
- 템플릿이 미설정·비활성·손상되었거나 SMTP 발송이 실패해도 문의 상태 저장을 롤백하지 않는다.
- 연결된 템플릿 삭제는 `409 EMAIL_TEMPLATE_IN_USE`로 차단하고 참조 이벤트 코드와 표시명을 `error.details`에 반환한다.
- 템플릿 삭제는 논리 삭제이며, 삭제·연결 경합은 템플릿 행에 대한 비관적 쓰기 잠금으로 직렬화한다.
- 저장 시와 발송 직전에 HTML을 정화하고 제목 CR/LF, 외부 이미지, `style`, 이벤트 속성, 실행·임베드 요소, `javascript:`·`data:` URL을 허용하지 않는다.
- `RichTextEditor`는 기본적으로 기존 이미지 업로드 동작을 유지하고 이메일 템플릿에서만 `allowImages={false}`를 사용한다.
- 프론트엔드 데이터 조회 화면은 `@/components/ui/Skeleton`의 `TableSkeleton` 또는 폼 구조에 맞춘 `Skeleton`을 사용한다.
- 코드 수정 Task마다 해당 `docs/history/` 파일의 최신 항목을 상단에 추가하고 `docs/agent-handoff/CURRENT.md`를 현재 Task 스냅샷으로 덮어쓴다.
- 운영 `spring.jpa.hibernate.ddl-auto=validate` 환경은 새 바이너리 기동 전에 `docs/db-migration/20260831_01_admin_email_template_management.sql`을 반드시 적용한다. 순서를 바꾸면 새 엔티티·`html_body` 검증 때문에 애플리케이션이 기동하지 못한다.
- 기존 미커밋 관리자 문의 검색 수정 5개 파일은 Task 0에서만 별도 커밋하고, 이후 이메일 템플릿 커밋에 섞지 않는다.

---

## File Structure and Contract Map

### 백엔드 도메인·저장소

- `EmailTemplate`: 템플릿 내용, 활성 상태, 시스템 키, 논리 삭제, 관리자 감사 관계를 소유한다.
- `EmailTemplateBinding`: 코드 정의 이벤트 하나와 템플릿 하나의 연결을 소유한다.
- `EmailTemplateEvent`: 이벤트 코드·표시명·scope·종료 상태·기존 `InquiryEmailDelivery.EventType` 매핑을 코드로 고정한다.
- `EmailTemplateRenderer`: 변수 추출·검증, 토큰 보호, HTML 정화, 일반 텍스트 생성, 최종 렌더링을 전담한다.
- `EmailTemplateService`: CRUD·복제·기본값 복원·미리보기·테스트 발송과 삭제 잠금을 담당한다.
- `EmailTemplateBindingService`: 서버 이벤트 목록, 연결·교체·해제와 scope/활성/삭제 검증을 담당한다.
- `DefaultEmailTemplateCatalog`와 `EmailTemplateSeedRunner`: 3종 기본값을 단일 소스에서 제공하고 최초 1회만 초기 연결을 만든다.
- `InquiryEmailService`: 문의 상태를 템플릿 이벤트로 바꾸고 렌더링 스냅샷을 큐에 저장한다.

### 프론트엔드 경계

- `emailTemplateService.ts`: 템플릿·연결 계약과 모든 관리자 API 호출을 소유한다.
- `EmailTemplateListPanel`: 검색·목록·복제·삭제·초기화·활성 변경을 소유한다.
- `EmailTemplateBindingsPanel`: 3개 이벤트 연결·해제와 발송 가능 상태를 소유한다.
- `EmailTemplateForm`: 편집기, 변수 삽입, 서버 미리보기, 저장, 현재 관리자 테스트 발송을 소유한다.
- `RichTextEditor`: `RichTextEditorHandle.insertText(text)`와 `allowImages`를 제공한다.
- 관리자 문의 상세: `InquiryStatusUpdateResponse`와 binding 상태를 사용해 종료 안내 입력 없이 상태만 변경한다.

### 고정 API 계약

```http
GET    /api/admin/email-templates?keyword=&scope=INQUIRY_STATUS&active=true&page=0&size=10
GET    /api/admin/email-templates/{id}
POST   /api/admin/email-templates
PUT    /api/admin/email-templates/{id}
POST   /api/admin/email-templates/{id}/clone
POST   /api/admin/email-templates/{id}/reset-default
DELETE /api/admin/email-templates/{id}
POST   /api/admin/email-templates/{id}/test-send
POST   /api/admin/email-templates/preview
GET    /api/admin/email-template-bindings
PUT    /api/admin/email-template-bindings/{eventCode}
DELETE /api/admin/email-template-bindings/{eventCode}
PATCH  /api/admin/inquiries/{id}/status
```

템플릿 생성·수정 요청:

```json
{
  "name": "문의 처리 완료 안내",
  "scope": "INQUIRY_STATUS",
  "subjectTemplate": "[TPMP] 문의 처리가 완료되었습니다: {{inquiryTitle}}",
  "htmlBody": "<p>{{recipientName}}님, 문의 처리가 완료되었습니다.</p><p><a href=\"{{inquiryDetailUrl}}\">문의 확인</a></p>",
  "active": true
}
```

템플릿 상세 응답의 `data`:

```json
{
  "id": 1,
  "name": "문의 처리 완료 안내",
  "scope": "INQUIRY_STATUS",
  "subjectTemplate": "[TPMP] 문의 처리가 완료되었습니다: {{inquiryTitle}}",
  "htmlBody": "<p>{{recipientName}}님, 문의 처리가 완료되었습니다.</p>",
  "textBody": "{{recipientName}}님, 문의 처리가 완료되었습니다.",
  "active": true,
  "defaultTemplate": true,
  "referenceCount": 1,
  "referencedEvents": [{"eventCode":"INQUIRY_COMPLETED","eventLabel":"처리 완료"}],
  "deletable": false,
  "allowedVariables": [{"token":"{{recipientName}}","name":"recipientName","label":"수신자 이름","description":"문의자 표시 이름"}],
  "createdAt": "2026-08-31T10:00:00",
  "updatedAt": "2026-08-31T10:00:00"
}
```

연결 변경 요청과 조회 항목:

```json
{"templateId": 1}
```

```json
{
  "eventCode": "INQUIRY_COMPLETED",
  "eventLabel": "처리 완료",
  "scope": "INQUIRY_STATUS",
  "templateId": 1,
  "templateName": "문의 처리 완료 안내",
  "templateActive": true,
  "configured": true,
  "sendable": true,
  "unavailableReason": null
}
```

상태 변경 요청과 응답의 `data`:

```json
{"status":"COMPLETED","sendEmail":true}
```

```json
{
  "inquiry": {"id":7,"status":"COMPLETED","messages":[]},
  "emailOutcome":"SKIPPED_TEMPLATE_INACTIVE",
  "emailMessage":"연결된 이메일 템플릿이 비활성 상태여서 상태만 변경했습니다.",
  "templateSettingsUrl":"/admin/email-templates?tab=bindings"
}
```

참조 중 삭제 오류:

```json
{
  "success": false,
  "error": {
    "code": "EMAIL_TEMPLATE_IN_USE",
    "message": "사용 중인 이메일 템플릿은 삭제할 수 없습니다.",
    "details": [{"eventCode":"INQUIRY_COMPLETED","eventLabel":"처리 완료"}]
  },
  "timestamp": "2026-08-31T10:00:00Z"
}
```

---

### Task 0: 기존 관리자 문의 검색 수정 격리 커밋

**Files:**
- Modify only: `backend/src/main/java/com/tpmp/testprep/repository/InquiryRepository.java`
- Modify only: `backend/src/main/java/com/tpmp/testprep/service/InquiryService.java`
- Test only: `backend/src/test/java/com/tpmp/testprep/service/InquiryServiceTest.java`
- Modify only: `docs/agent-handoff/CURRENT.md`
- Modify only: `docs/history/back/adm/AdminInquiry_Modified.md`

**Interfaces:**
- Consumes: 현재 작업 트리에 이미 존재하는 PostgreSQL 안전 검색 변경 5개 파일.
- Produces: 커밋 `[BE] fix: 관리자 문의 목록 PostgreSQL 검색 오류 수정`; Task 1 이후 작업 트리에는 이메일 템플릿 작업만 남는다.

Task 0은 이미 구현·테스트된 변경을 격리하는 커밋 경계이므로 새 실패 테스트를 만들지 않는다. 기존 회귀 테스트 통과와 staged 파일 목록을 승인 게이트로 사용한다.

- [ ] **Step 1: 기존 변경 범위를 정확히 고정한다**

Run:

```powershell
git status --short
git diff -- backend/src/main/java/com/tpmp/testprep/repository/InquiryRepository.java backend/src/main/java/com/tpmp/testprep/service/InquiryService.java backend/src/test/java/com/tpmp/testprep/service/InquiryServiceTest.java docs/agent-handoff/CURRENT.md docs/history/back/adm/AdminInquiry_Modified.md
```

Expected: 위 5개 파일만 수정 상태이며 `InquiryRepository`의 PostgreSQL `bytea` 검색 회피, `InquiryService`의 메모리 키워드 필터, 해당 테스트·히스토리·인계 내용만 보인다.

- [ ] **Step 2: 기존 수정의 최소 회귀 테스트를 다시 실행한다**

Run:

```powershell
cd backend
.\gradlew.bat test --tests "com.tpmp.testprep.service.InquiryServiceTest"
```

Expected: `BUILD SUCCESSFUL`; 관리자 키워드 검색 테스트가 통과한다.

- [ ] **Step 3: 정확히 5개 파일만 스테이징한다**

Run:

```powershell
git add backend/src/main/java/com/tpmp/testprep/repository/InquiryRepository.java backend/src/main/java/com/tpmp/testprep/service/InquiryService.java backend/src/test/java/com/tpmp/testprep/service/InquiryServiceTest.java docs/agent-handoff/CURRENT.md docs/history/back/adm/AdminInquiry_Modified.md
git diff --cached --name-only
```

Expected: 출력이 위 5개 경로와 정확히 일치한다. 다른 경로가 보이면 커밋하지 말고 해당 경로만 `git restore --staged -- <path>`로 stage에서 제외한다.

- [ ] **Step 4: 격리 커밋을 만든다**

Run:

```powershell
git commit -m "[BE] fix: 관리자 문의 목록 PostgreSQL 검색 오류 수정"
git status --short
```

Expected: 커밋 성공; Task 0의 5개 파일이 더 이상 수정 상태로 표시되지 않는다.

---

### Task 1: 이메일 템플릿 데이터 모델·SQL·문의 상태 제약조건

**Files:**
- Create: `backend/src/main/java/com/tpmp/testprep/entity/EmailTemplate.java`
- Create: `backend/src/main/java/com/tpmp/testprep/entity/EmailTemplateBinding.java`
- Create: `backend/src/main/java/com/tpmp/testprep/entity/EmailTemplateEvent.java`
- Create: `backend/src/main/java/com/tpmp/testprep/repository/EmailTemplateRepository.java`
- Create: `backend/src/main/java/com/tpmp/testprep/repository/EmailTemplateBindingRepository.java`
- Create: `backend/src/main/java/com/tpmp/testprep/config/InquiryStatusConstraintMigrationRunner.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/entity/InquiryEmailDelivery.java`
- Create: `backend/src/test/java/com/tpmp/testprep/entity/EmailTemplateTest.java`
- Create: `backend/src/test/java/com/tpmp/testprep/repository/EmailTemplateRepositoryTest.java`
- Create: `backend/src/test/java/com/tpmp/testprep/repository/EmailTemplateBindingRepositoryTest.java`
- Create: `backend/src/test/java/com/tpmp/testprep/config/InquiryStatusConstraintMigrationRunnerTest.java`
- Create: `backend/src/test/java/com/tpmp/testprep/entity/InquiryEmailDeliveryTest.java`
- Create: `docs/db-migration/20260831_01_admin_email_template_management.sql`
- Create: `docs/history/back/adm/AdminEmailTemplate_Modified.md`
- Modify: `docs/agent-handoff/CURRENT.md`

**Interfaces:**
- Consumes: `Inquiry.Status`, `InquiryEmailDelivery.EventType`, `User`, `JdbcTemplate`, PostgreSQL `inquiries_status_check`.
- Produces:
  - `EmailTemplate.Scope.INQUIRY_STATUS`
  - `EmailTemplateEvent.INQUIRY_ANSWERED|INQUIRY_COMPLETED|INQUIRY_UNABLE_TO_PROCESS`
  - `EmailTemplateRepository.findActiveForUpdate(Long)` and `findBySystemKey(String)`
  - `EmailTemplateBindingRepository.findByEventCode(EmailTemplateEvent)` and `findAllByTemplateId(Long)`
  - `InquiryEmailDelivery.pending(Inquiry, InquiryMessage, EventType, String, String, String, String)` where the last two values are `textBody`, nullable `htmlBody`.

고정 도메인 시그니처:

```java
public enum EmailTemplateEvent {
    INQUIRY_ANSWERED("답변 완료", EmailTemplate.Scope.INQUIRY_STATUS,
            Inquiry.Status.ANSWERED, InquiryEmailDelivery.EventType.ANSWERED),
    INQUIRY_COMPLETED("처리 완료", EmailTemplate.Scope.INQUIRY_STATUS,
            Inquiry.Status.COMPLETED, InquiryEmailDelivery.EventType.COMPLETED),
    INQUIRY_UNABLE_TO_PROCESS("처리 불가", EmailTemplate.Scope.INQUIRY_STATUS,
            Inquiry.Status.UNABLE_TO_PROCESS, InquiryEmailDelivery.EventType.UNABLE_TO_PROCESS);

    public static Optional<EmailTemplateEvent> fromStatus(Inquiry.Status status);
    public static Optional<EmailTemplateEvent> fromCode(String eventCode);
}

public class EmailTemplate {
    public enum Scope { INQUIRY_STATUS }
    public static EmailTemplate create(String name, Scope scope, String subjectTemplate,
            String htmlBody, String textBody, boolean active, String systemKey, User admin);
    public void update(String name, String subjectTemplate, String htmlBody,
            String textBody, boolean active, User admin);
    public EmailTemplate duplicate(String copiedName, User admin);
    public void reset(String name, String subjectTemplate, String htmlBody, String textBody, User admin);
    public void softDelete(User admin);
    public boolean isDeleted();
}

public class EmailTemplateBinding {
    public static EmailTemplateBinding create(EmailTemplateEvent eventCode, EmailTemplate template, User admin);
    public void changeTemplate(EmailTemplate template, User admin);
}
```

- [ ] **Step 1: 엔티티 수명주기와 이벤트 매핑 실패 테스트를 작성한다**

```java
class EmailTemplateTest {
    @Test
    void duplicateClearsSystemKeyAndDeleteAuditIsRecorded() {
        User admin = TestFixtures.admin("admin@tpmp.com");
        EmailTemplate source = EmailTemplate.create("기본", EmailTemplate.Scope.INQUIRY_STATUS,
                "제목", "<p>본문</p>", "본문", true, "INQUIRY_COMPLETED_DEFAULT", null);
        EmailTemplate copy = source.duplicate("기본 복사본", admin);
        copy.softDelete(admin);
        assertThat(copy.getSystemKey()).isNull();
        assertThat(copy.isDeleted()).isTrue();
        assertThat(copy.getDeletedByAdmin()).isSameAs(admin);
    }

    @Test
    void eventMapsOnlyThreeClosedStatuses() {
        assertThat(EmailTemplateEvent.fromStatus(Inquiry.Status.COMPLETED))
                .contains(EmailTemplateEvent.INQUIRY_COMPLETED);
        assertThat(EmailTemplateEvent.fromStatus(Inquiry.Status.IN_PROGRESS)).isEmpty();
    }
}
```

- [ ] **Step 2: 엔티티 테스트가 컴파일 실패하는지 확인한다**

Run:

```powershell
cd backend
.\gradlew.bat test --tests "com.tpmp.testprep.entity.EmailTemplateTest"
```

Expected: FAIL; `EmailTemplate`과 `EmailTemplateEvent` 심볼이 존재하지 않는다.

- [ ] **Step 3: 엔티티와 저장소를 최소 구현한다**

`email_templates` 매핑은 설계의 모든 컬럼을 포함하고 `@ManyToOne(fetch = LAZY)` 관리자 FK 3개를 nullable로 둔다. `EmailTemplateBinding.eventCode`는 `@Id @Enumerated(EnumType.STRING)`이고 `template_id`는 `nullable=false`다. 저장소 시그니처는 다음으로 고정한다.

```java
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Long> {
    @Query("select t from EmailTemplate t where t.deletedAt is null " +
           "and (:keyword is null or lower(t.name) like lower(concat('%', :keyword, '%'))) " +
           "and (:scope is null or t.scope = :scope) and (:active is null or t.active = :active)")
    Page<EmailTemplate> search(String keyword, EmailTemplate.Scope scope, Boolean active, Pageable pageable);

    Optional<EmailTemplate> findByIdAndDeletedAtIsNull(Long id);
    Optional<EmailTemplate> findBySystemKey(String systemKey);
    List<EmailTemplate> findAllByScopeAndDeletedAtIsNullOrderByNameAsc(EmailTemplate.Scope scope);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from EmailTemplate t where t.id = :id and t.deletedAt is null")
    Optional<EmailTemplate> findActiveForUpdate(Long id);
}

public interface EmailTemplateBindingRepository extends JpaRepository<EmailTemplateBinding, EmailTemplateEvent> {
    Optional<EmailTemplateBinding> findByEventCode(EmailTemplateEvent eventCode);
    List<EmailTemplateBinding> findAllByOrderByEventCodeAsc();
    List<EmailTemplateBinding> findAllByTemplateId(Long templateId);
    long countByTemplateId(Long templateId);
}
```

`InquiryEmailDelivery`에는 다음 호환 오버로드를 둬 기존 plain text 호출을 깨지 않는다.

```java
public static InquiryEmailDelivery pending(Inquiry inquiry, InquiryMessage message, EventType eventType,
        String recipientEmail, String subject, String textBody) {
    return pending(inquiry, message, eventType, recipientEmail, subject, textBody, null);
}

public static InquiryEmailDelivery pending(Inquiry inquiry, InquiryMessage message, EventType eventType,
        String recipientEmail, String subject, String textBody, String htmlBody);
```

- [ ] **Step 4: 저장소 잠금·논리 삭제 제외·HTML 스냅샷 테스트를 작성한다**

```java
@DataJpaTest
class EmailTemplateRepositoryTest {
    @Autowired EmailTemplateRepository repository;

    @Test
    void searchExcludesSoftDeletedTemplate() {
        EmailTemplate kept = repository.save(EmailTemplate.create("처리 완료", EmailTemplate.Scope.INQUIRY_STATUS,
                "제목", "<p>본문</p>", "본문", true, null, null));
        EmailTemplate deleted = repository.save(EmailTemplate.create("삭제", EmailTemplate.Scope.INQUIRY_STATUS,
                "제목", "<p>본문</p>", "본문", true, null, null));
        deleted.softDelete(null);
        assertThat(repository.search(null, null, null, PageRequest.of(0, 10)).getContent())
                .containsExactly(kept);
    }
}

class InquiryEmailDeliveryTest {
    @Test
    void pendingStoresBothBodies() {
        InquiryEmailDelivery delivery = InquiryEmailDelivery.pending(inquiry(), null,
                InquiryEmailDelivery.EventType.COMPLETED, "user@tpmp.com", "제목", "텍스트", "<p>HTML</p>");
        assertThat(delivery.getBody()).isEqualTo("텍스트");
        assertThat(delivery.getHtmlBody()).isEqualTo("<p>HTML</p>");
    }
}
```

- [ ] **Step 5: 저장소·스냅샷 테스트가 실패하는지 확인한 뒤 매핑을 완성한다**

Run:

```powershell
.\gradlew.bat test --tests "com.tpmp.testprep.repository.EmailTemplateRepositoryTest" --tests "com.tpmp.testprep.repository.EmailTemplateBindingRepositoryTest" --tests "com.tpmp.testprep.entity.InquiryEmailDeliveryTest"
```

Expected before implementation: FAIL with 누락된 repository/`htmlBody`; implementation 후 `BUILD SUCCESSFUL`.

- [ ] **Step 6: 문의 상태 제약조건 러너의 멱등 테스트를 작성한다**

```java
@ExtendWith(MockitoExtension.class)
class InquiryStatusConstraintMigrationRunnerTest {
    @Mock JdbcTemplate jdbcTemplate;

    @Test
    void replacesStaleConstraintWithSixStatuses() throws Exception {
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class)))
                .thenReturn("CHECK (status IN ('PENDING','ON_HOLD','ANSWERED'))");
        new InquiryStatusConstraintMigrationRunner(jdbcTemplate).run();
        InOrder order = inOrder(jdbcTemplate);
        order.verify(jdbcTemplate).execute("ALTER TABLE inquiries DROP CONSTRAINT inquiries_status_check");
        order.verify(jdbcTemplate).execute("ALTER TABLE inquiries ADD CONSTRAINT inquiries_status_check CHECK " +
                "(status IN ('PENDING','IN_PROGRESS','ON_HOLD','ANSWERED','COMPLETED','UNABLE_TO_PROCESS'))");
    }

    @Test
    void leavesCorrectConstraintUntouched() throws Exception {
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class)))
                .thenReturn("CHECK (status IN ('PENDING','IN_PROGRESS','ON_HOLD','ANSWERED','COMPLETED','UNABLE_TO_PROCESS'))");
        new InquiryStatusConstraintMigrationRunner(jdbcTemplate).run();
        verify(jdbcTemplate, never()).execute(anyString());
    }
}
```

Run: `.\gradlew.bat test --tests "com.tpmp.testprep.config.InquiryStatusConstraintMigrationRunnerTest"`

Expected before runner: FAIL with missing class. Implement the independent `ApplicationRunner` so it never depends on the early return in `InquirySchemaMigrationRunner`; after implementation expect PASS.

- [ ] **Step 7: 재실행 가능한 PostgreSQL SQL을 작성한다**

SQL은 하나의 transaction에서 다음 순서를 정확히 수행한다.

```sql
BEGIN;
CREATE TABLE IF NOT EXISTS email_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    scope VARCHAR(50) NOT NULL,
    subject_template VARCHAR(200) NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT NOT NULL,
    active BOOLEAN NOT NULL,
    system_key VARCHAR(80) UNIQUE,
    created_by_admin_id BIGINT REFERENCES users(id),
    updated_by_admin_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by_admin_id BIGINT REFERENCES users(id),
    CONSTRAINT email_templates_scope_check CHECK (scope IN ('INQUIRY_STATUS'))
);
CREATE TABLE IF NOT EXISTS email_template_bindings (
    event_code VARCHAR(80) PRIMARY KEY,
    template_id BIGINT NOT NULL REFERENCES email_templates(id) ON DELETE RESTRICT,
    created_by_admin_id BIGINT REFERENCES users(id),
    updated_by_admin_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
ALTER TABLE inquiry_email_deliveries ADD COLUMN IF NOT EXISTS html_body TEXT;
```

이어지는 `DO $$` 블록은 `inquiries_status_check` 정의가 6개 상태와 다를 때만 교체한다. 시드는 다음 CTE를 그대로 사용해 누락된 system template은 보완하되, 세 `system_key`가 모두 없었던 최초 실행에서만 3개 연결을 만든다. 기존 템플릿 내용이나 관리자가 해제한 binding은 덮어쓰지 않는다.

```sql
WITH seed_guard AS (
    SELECT NOT EXISTS (
        SELECT 1 FROM email_templates
        WHERE system_key IN (
            'INQUIRY_ANSWERED_DEFAULT',
            'INQUIRY_COMPLETED_DEFAULT',
            'INQUIRY_UNABLE_TO_PROCESS_DEFAULT'
        )
    ) AS should_seed
), inserted AS (
    INSERT INTO email_templates
        (name, scope, subject_template, html_body, text_body, active, system_key, created_at, updated_at)
    SELECT seed.name, 'INQUIRY_STATUS', seed.subject_template, seed.html_body,
           seed.text_body, true, seed.system_key,
           CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM seed_guard
    CROSS JOIN (VALUES
        ('INQUIRY_ANSWERED_DEFAULT', '문의 답변 완료 안내',
         '[TPMP] 문의 답변이 완료되었습니다: {{inquiryTitle}}',
         '<h2>{{serviceName}} 문의 상태 안내</h2><p>{{recipientName}}님, 접수하신 문의에 대한 답변이 완료되었습니다.</p><p><strong>접수 번호</strong>: {{inquiryId}}<br><strong>접수 유형</strong>: {{inquiryType}}<br><strong>제목</strong>: {{inquiryTitle}}<br><strong>현재 상태</strong>: {{statusLabel}}</p><p><a href="{{inquiryDetailUrl}}">문의 상세에서 답변 확인하기</a></p><p>이 메일은 상태 변경 안내이며 관리자 답변 내용은 문의 상세에서 확인할 수 있습니다.</p>',
         '{{serviceName}} 문의 상태 안내 {{recipientName}}님, 접수하신 문의에 대한 답변이 완료되었습니다. 접수 번호: {{inquiryId}} 접수 유형: {{inquiryType}} 제목: {{inquiryTitle}} 현재 상태: {{statusLabel}} 문의 상세에서 답변 확인하기 {{inquiryDetailUrl}} 이 메일은 상태 변경 안내이며 관리자 답변 내용은 문의 상세에서 확인할 수 있습니다.'),
        ('INQUIRY_COMPLETED_DEFAULT', '문의 처리 완료 안내',
         '[TPMP] 문의 처리가 완료되었습니다: {{inquiryTitle}}',
         '<h2>{{serviceName}} 문의 상태 안내</h2><p>{{recipientName}}님, 요청하신 사항의 처리가 완료되었습니다.</p><p><strong>접수 번호</strong>: {{inquiryId}}<br><strong>접수 유형</strong>: {{inquiryType}}<br><strong>제목</strong>: {{inquiryTitle}}<br><strong>현재 상태</strong>: {{statusLabel}}</p><p><a href="{{inquiryDetailUrl}}">문의 상세 확인하기</a></p><p>이 메일은 상태 변경 안내이며 관리자 답변 내용과는 별도로 발송되었습니다.</p>',
         '{{serviceName}} 문의 상태 안내 {{recipientName}}님, 요청하신 사항의 처리가 완료되었습니다. 접수 번호: {{inquiryId}} 접수 유형: {{inquiryType}} 제목: {{inquiryTitle}} 현재 상태: {{statusLabel}} 문의 상세 확인하기 {{inquiryDetailUrl}} 이 메일은 상태 변경 안내이며 관리자 답변 내용과는 별도로 발송되었습니다.'),
        ('INQUIRY_UNABLE_TO_PROCESS_DEFAULT', '문의 처리 불가 안내',
         '[TPMP] 문의 처리 결과를 안내드립니다: {{inquiryTitle}}',
         '<h2>{{serviceName}} 문의 상태 안내</h2><p>{{recipientName}}님, 요청하신 사항을 현재 처리하기 어려워 결과를 안내드립니다.</p><p><strong>접수 번호</strong>: {{inquiryId}}<br><strong>접수 유형</strong>: {{inquiryType}}<br><strong>제목</strong>: {{inquiryTitle}}<br><strong>현재 상태</strong>: {{statusLabel}}</p><p><a href="{{inquiryDetailUrl}}">문의 상세 확인하기</a></p><p>이 메일은 상태 변경 안내이며 상세 사유가 등록된 경우 문의 상세에서 확인할 수 있습니다.</p>',
         '{{serviceName}} 문의 상태 안내 {{recipientName}}님, 요청하신 사항을 현재 처리하기 어려워 결과를 안내드립니다. 접수 번호: {{inquiryId}} 접수 유형: {{inquiryType}} 제목: {{inquiryTitle}} 현재 상태: {{statusLabel}} 문의 상세 확인하기 {{inquiryDetailUrl}} 이 메일은 상태 변경 안내이며 상세 사유가 등록된 경우 문의 상세에서 확인할 수 있습니다.')
    ) AS seed(system_key, name, subject_template, html_body, text_body)
    ON CONFLICT (system_key) DO NOTHING
    RETURNING id, system_key
)
INSERT INTO email_template_bindings
    (event_code, template_id, created_at, updated_at)
SELECT mapping.event_code, inserted.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM inserted
JOIN (VALUES
    ('INQUIRY_ANSWERED_DEFAULT', 'INQUIRY_ANSWERED'),
    ('INQUIRY_COMPLETED_DEFAULT', 'INQUIRY_COMPLETED'),
    ('INQUIRY_UNABLE_TO_PROCESS_DEFAULT', 'INQUIRY_UNABLE_TO_PROCESS')
) AS mapping(system_key, event_code) ON mapping.system_key = inserted.system_key
CROSS JOIN seed_guard
WHERE seed_guard.should_seed
ON CONFLICT (event_code) DO NOTHING;
COMMIT;
```

`text_body`의 SQL 초기값은 같은 HTML의 의미를 평문으로 보존한다. Task 3의 시드 러너는 같은 HTML을 `EmailTemplateRenderer.prepare`에 통과시켜 text를 만든다. 운영 SQL과 로컬 러너 어느 쪽이 먼저 실행되어도 `system_key`가 중복 생기지 않는다.

- [ ] **Step 8: Task 1 전체 테스트·히스토리·인계 내용을 완성한다**

Run:

```powershell
.\gradlew.bat test --tests "com.tpmp.testprep.entity.EmailTemplateTest" --tests "com.tpmp.testprep.repository.EmailTemplateRepositoryTest" --tests "com.tpmp.testprep.repository.EmailTemplateBindingRepositoryTest" --tests "com.tpmp.testprep.config.InquiryStatusConstraintMigrationRunnerTest" --tests "com.tpmp.testprep.entity.InquiryEmailDeliveryTest"
```

Expected: `BUILD SUCCESSFUL`. `docs/history/back/adm/AdminEmailTemplate_Modified.md`에 `HIST-20260831-001`을 작성하고 `CURRENT.md`에 SQL 선행 적용 위험, 수정 파일, 위 명령 결과, 다음 Task 2 명령을 기록한다.

- [ ] **Step 9: Task 1을 커밋한다**

```powershell
git add backend/src/main/java/com/tpmp/testprep/entity/EmailTemplate.java backend/src/main/java/com/tpmp/testprep/entity/EmailTemplateBinding.java backend/src/main/java/com/tpmp/testprep/entity/EmailTemplateEvent.java backend/src/main/java/com/tpmp/testprep/entity/InquiryEmailDelivery.java backend/src/main/java/com/tpmp/testprep/repository/EmailTemplateRepository.java backend/src/main/java/com/tpmp/testprep/repository/EmailTemplateBindingRepository.java backend/src/main/java/com/tpmp/testprep/config/InquiryStatusConstraintMigrationRunner.java backend/src/test/java/com/tpmp/testprep/entity/EmailTemplateTest.java backend/src/test/java/com/tpmp/testprep/entity/InquiryEmailDeliveryTest.java backend/src/test/java/com/tpmp/testprep/repository/EmailTemplateRepositoryTest.java backend/src/test/java/com/tpmp/testprep/repository/EmailTemplateBindingRepositoryTest.java backend/src/test/java/com/tpmp/testprep/config/InquiryStatusConstraintMigrationRunnerTest.java docs/db-migration/20260831_01_admin_email_template_management.sql docs/history/back/adm/AdminEmailTemplate_Modified.md docs/agent-handoff/CURRENT.md
git commit -m "[BE] feat: 이메일 템플릿 데이터 모델 추가"
```

Expected: commit succeeds and only Task 1 paths are recorded.

---

### Task 2: 안전한 HTML 템플릿 렌더러

**Files:**
- Modify: `backend/build.gradle`
- Create: `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateRenderer.java`
- Create: `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateRenderingException.java`
- Create: `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateRendererTest.java`
- Modify: `docs/history/back/adm/AdminEmailTemplate_Modified.md`
- Modify: `docs/agent-handoff/CURRENT.md`

**Interfaces:**
- Consumes: `EmailTemplate.Scope`, Spring `HtmlUtils`, OWASP `PolicyFactory`, jsoup `Jsoup`.
- Produces:

```java
public final class EmailTemplateRenderer {
    public PreparedTemplate prepare(EmailTemplate.Scope scope, String subjectTemplate, String htmlBody);
    public RenderedEmail render(EmailTemplate.Scope scope, String subjectTemplate,
            String sanitizedHtmlBody, Map<String, String> variables);
    public List<AllowedVariable> getAllowedVariables(EmailTemplate.Scope scope);

    public record PreparedTemplate(String subjectTemplate, String sanitizedHtmlBody, String textBody) {}
    public record RenderedEmail(String subject, String htmlBody, String textBody) {}
    public record AllowedVariable(String token, String name, String label, String description) {}
}

public class EmailTemplateRenderingException extends RuntimeException {
    public enum Reason { INVALID_VARIABLE, INVALID_CONTENT }
    public EmailTemplateRenderingException(Reason reason, String safeMessage);
    public Reason getReason();
}
```

- [ ] **Step 1: 보안 정책을 고정하는 실패 테스트를 작성한다**

```java
class EmailTemplateRendererTest {
    private final EmailTemplateRenderer renderer = new EmailTemplateRenderer("https://tpmp.example");

    @Test
    void prepareRejectsUnknownVariableAndHeaderNewline() {
        assertThatThrownBy(() -> renderer.prepare(EmailTemplate.Scope.INQUIRY_STATUS,
                "제목 {{unknown}}", "<p>본문</p>"))
                .isInstanceOf(EmailTemplateRenderingException.class)
                .extracting("reason").isEqualTo(EmailTemplateRenderingException.Reason.INVALID_VARIABLE);
        assertThatThrownBy(() -> renderer.prepare(EmailTemplate.Scope.INQUIRY_STATUS,
                "제목\r\nBcc: attacker@example.com", "<p>본문</p>"))
                .isInstanceOf(EmailTemplateRenderingException.class);
    }

    @Test
    void prepareRemovesExecutableContentAndBuildsTextFallback() {
        var prepared = renderer.prepare(EmailTemplate.Scope.INQUIRY_STATUS, "제목",
                "<p onclick=\"alert(1)\">안내</p><script>alert(1)</script><img src=\"https://evil/x\">");
        assertThat(prepared.sanitizedHtmlBody()).isEqualTo("<p>안내</p>");
        assertThat(prepared.textBody()).isEqualTo("안내");
    }

    @Test
    void renderEscapesVariablesAndAllowsOnlyServerDetailUrl() {
        Map<String, String> values = Map.of(
                "recipientName", "<Admin>", "inquiryId", "7", "inquiryTitle", "<b>제목</b>",
                "inquiryType", "버그 신고", "statusLabel", "처리 완료",
                "inquiryDetailUrl", "https://tpmp.example/user/inquiries/7", "serviceName", "TPMP");
        var rendered = renderer.render(EmailTemplate.Scope.INQUIRY_STATUS,
                "{{inquiryTitle}}", "<p>{{recipientName}}</p><a href=\"{{inquiryDetailUrl}}\">보기</a>", values);
        assertThat(rendered.subject()).isEqualTo("<b>제목</b>");
        assertThat(rendered.htmlBody()).contains("&lt;Admin&gt;").doesNotContain("<Admin>");
        assertThat(rendered.htmlBody()).contains("https://tpmp.example/user/inquiries/7");
    }
}
```

- [ ] **Step 2: 렌더러 테스트 실패를 확인한다**

Run: `cd backend; .\gradlew.bat test --tests "com.tpmp.testprep.service.EmailTemplateRendererTest"`

Expected: FAIL because renderer classes and sanitizer dependencies do not exist.

- [ ] **Step 3: 고정 버전 의존성과 허용 정책을 구현한다**

`backend/build.gradle`에 다음 두 줄을 추가한다.

```groovy
implementation 'com.googlecode.owasp-java-html-sanitizer:owasp-java-html-sanitizer:20240325.1'
implementation 'org.jsoup:jsoup:1.18.3'
```

정책은 `p`, `br`, `h1`, `h2`, `h3`, `strong`, `b`, `em`, `i`, `u`, `s`, `blockquote`, `ul`, `ol`, `li`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `a`만 허용한다. `a`에는 `href`, `title`만 허용하고 URL protocol은 `http`, `https`만 허용한다. 제목과 HTML이 blank이면 `INVALID_CONTENT`; 제목 길이 200, HTML 입력 길이 100000을 초과해도 `INVALID_CONTENT`다.

토큰 정규식은 `\{\{([A-Za-z][A-Za-z0-9]*)}}`로 고정한다. 저장 시 일반 텍스트 토큰은 `TPMP_TOKEN_{index}`로 보호한다. `href` 속성 안에서는 `{{inquiryDetailUrl}}`만 허용하고 sanitize 전에 `https://tpmp.invalid/TPMP_LINK_TOKEN`으로 바꾼 뒤 sanitize 후 원래 토큰으로 복원한다. 다른 변수가 속성 안에 있으면 `INVALID_VARIABLE`이다. 발송 시 7개 값이 모두 존재하는지 검사하고 `HtmlUtils.htmlEscape(value, "UTF-8")`로 치환한 뒤 최종 sanitize한다. `inquiryDetailUrl`은 URI를 파싱해 `http|https`와 설정된 `app.public-url` host가 일치하는지 검사한다. `Jsoup.parse(sanitized).text()`로 text body를 만든다.

- [ ] **Step 4: 렌더러 테스트를 통과시키고 허용 변수 순서를 고정한다**

Run:

```powershell
.\gradlew.bat test --tests "com.tpmp.testprep.service.EmailTemplateRendererTest"
```

Expected: PASS; `getAllowedVariables(INQUIRY_STATUS)`가 설계의 7개 순서로 반환된다.

- [ ] **Step 5: 히스토리·인계 갱신 후 Task 2를 커밋한다**

`AdminEmailTemplate_Modified.md` 상단에 `HIST-20260831-002`를 추가하고 `CURRENT.md`에 의존성 버전, 허용 태그, 테스트 결과를 기록한다.

```powershell
git add backend/build.gradle backend/src/main/java/com/tpmp/testprep/service/EmailTemplateRenderer.java backend/src/main/java/com/tpmp/testprep/service/EmailTemplateRenderingException.java backend/src/test/java/com/tpmp/testprep/service/EmailTemplateRendererTest.java docs/history/back/adm/AdminEmailTemplate_Modified.md docs/agent-handoff/CURRENT.md
git commit -m "[BE] feat: 이메일 템플릿 보안 렌더러 추가"
```

Expected: commit succeeds; dependency lock resolution and renderer test are reproducible.

---

### Task 3: 기본 시드·관리자 템플릿 및 연결 API

**Files:**
- Create: `backend/src/main/java/com/tpmp/testprep/config/DefaultEmailTemplateCatalog.java`
- Create: `backend/src/main/java/com/tpmp/testprep/config/EmailTemplateSeedRunner.java`
- Create: `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateService.java`
- Create: `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateBindingService.java`
- Create: `backend/src/main/java/com/tpmp/testprep/service/EmailTemplateTestMailSender.java`
- Create: `backend/src/main/java/com/tpmp/testprep/controller/AdminEmailTemplateController.java`
- Create: `backend/src/main/java/com/tpmp/testprep/controller/AdminEmailTemplateBindingController.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/request/EmailTemplateCreateRequest.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/request/EmailTemplateUpdateRequest.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/request/EmailTemplatePreviewRequest.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/request/EmailTemplateBindingRequest.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateSummaryResponse.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateDetailResponse.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateReferenceResponse.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateVariableResponse.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplatePreviewResponse.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateBindingResponse.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateTestSendResponse.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/exception/BusinessException.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/exception/GlobalExceptionHandler.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/dto/response/ApiResponse.java`
- Create: `backend/src/test/java/com/tpmp/testprep/config/EmailTemplateSeedRunnerTest.java`
- Create: `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateServiceTest.java`
- Create: `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateBindingServiceTest.java`
- Create: `backend/src/test/java/com/tpmp/testprep/service/EmailTemplateTestMailSenderTest.java`
- Create: `backend/src/test/java/com/tpmp/testprep/controller/AdminEmailTemplateControllerWebMvcTest.java`
- Create: `backend/src/test/java/com/tpmp/testprep/controller/AdminEmailTemplateBindingControllerWebMvcTest.java`
- Modify: `docs/history/back/adm/AdminEmailTemplate_Modified.md`
- Modify: `docs/agent-handoff/CURRENT.md`

**Interfaces:**
- Consumes: Task 1 repositories/entities/events, Task 2 renderer, `UserRepository.findByEmail`, `JavaMailSender`.
- Produces:

```java
public record EmailTemplateCreateRequest(
        @NotBlank @Size(max=100) String name,
        @NotNull EmailTemplate.Scope scope,
        @NotBlank @Size(max=200) String subjectTemplate,
        @NotBlank @Size(max=100000) String htmlBody,
        boolean active) {}

public record EmailTemplateUpdateRequest(
        @NotBlank @Size(max=100) String name,
        @NotBlank @Size(max=200) String subjectTemplate,
        @NotBlank @Size(max=100000) String htmlBody,
        boolean active) {}

public record EmailTemplatePreviewRequest(
        @NotNull EmailTemplate.Scope scope,
        @NotBlank @Size(max=200) String subjectTemplate,
        @NotBlank @Size(max=100000) String htmlBody) {}

public record EmailTemplateBindingRequest(@NotNull Long templateId) {}
public record EmailTemplateReferenceResponse(EmailTemplateEvent eventCode, String eventLabel) {}
public record EmailTemplateVariableResponse(String token, String name, String label, String description) {}
public record EmailTemplatePreviewResponse(String sanitizedHtmlBody, String renderedSubject,
        String renderedHtmlBody, String renderedTextBody, boolean unsafeContentRemoved) {}
public record EmailTemplateTestSendResponse(String recipientMasked, LocalDateTime sentAt) {}
```

`EmailTemplateSummaryResponse`는 `id,name,scope,active,defaultTemplate,referenceCount,referencedEvents,deletable,updatedAt`; 상세는 여기에 `subjectTemplate,htmlBody,textBody,allowedVariables,createdAt`을 더한다. `EmailTemplateBindingResponse`는 고정 JSON 계약의 10개 필드를 그대로 사용한다.

서비스 시그니처:

```java
public Page<EmailTemplateSummaryResponse> getAll(String keyword, EmailTemplate.Scope scope,
        Boolean active, Pageable pageable);
public EmailTemplateDetailResponse getOne(Long id);
public EmailTemplateDetailResponse create(EmailTemplateCreateRequest request, String adminEmail);
public EmailTemplateDetailResponse update(Long id, EmailTemplateUpdateRequest request, String adminEmail);
public EmailTemplateDetailResponse cloneTemplate(Long id, String adminEmail);
public EmailTemplateDetailResponse resetDefault(Long id, String adminEmail);
public void delete(Long id, String adminEmail);
public EmailTemplatePreviewResponse preview(EmailTemplatePreviewRequest request);
public EmailTemplateTestSendResponse testSend(Long id, String adminEmail);

public List<EmailTemplateBindingResponse> getAllBindings();
public EmailTemplateBindingResponse bind(String eventCode, Long templateId, String adminEmail);
public EmailTemplateBindingResponse unbind(String eventCode);

public EmailTemplateTestSendResponse send(EmailTemplate template, String adminEmail);
```

Controller는 path variable을 `String`으로 받고 `EmailTemplateEvent.fromCode`가 empty면 `EMAIL_TEMPLATE_EVENT_NOT_FOUND`를 던진다. 이로써 알 수 없는 이벤트가 Spring enum 변환의 일반 400으로 빠지지 않고 설계의 명시적 404를 반환한다.

`DefaultEmailTemplateCatalog`는 다음 기본값을 정확히 반환한다. 세 HTML에서 이미지는 없고 링크는 서버 렌더링에서 안전한 상세 URL로 치환된다.

```java
public List<Definition> definitions() {
    return List.of(
        new Definition("INQUIRY_ANSWERED_DEFAULT", EmailTemplateEvent.INQUIRY_ANSWERED,
            "문의 답변 완료 안내",
            "[TPMP] 문의 답변이 완료되었습니다: {{inquiryTitle}}",
            "<h2>{{serviceName}} 문의 상태 안내</h2>" +
            "<p>{{recipientName}}님, 접수하신 문의에 대한 답변이 완료되었습니다.</p>" +
            "<p><strong>접수 번호</strong>: {{inquiryId}}<br>" +
            "<strong>접수 유형</strong>: {{inquiryType}}<br>" +
            "<strong>제목</strong>: {{inquiryTitle}}<br>" +
            "<strong>현재 상태</strong>: {{statusLabel}}</p>" +
            "<p><a href=\"{{inquiryDetailUrl}}\">문의 상세에서 답변 확인하기</a></p>" +
            "<p>이 메일은 상태 변경 안내이며 관리자 답변 내용은 문의 상세에서 확인할 수 있습니다.</p>"),
        new Definition("INQUIRY_COMPLETED_DEFAULT", EmailTemplateEvent.INQUIRY_COMPLETED,
            "문의 처리 완료 안내",
            "[TPMP] 문의 처리가 완료되었습니다: {{inquiryTitle}}",
            "<h2>{{serviceName}} 문의 상태 안내</h2>" +
            "<p>{{recipientName}}님, 요청하신 사항의 처리가 완료되었습니다.</p>" +
            "<p><strong>접수 번호</strong>: {{inquiryId}}<br>" +
            "<strong>접수 유형</strong>: {{inquiryType}}<br>" +
            "<strong>제목</strong>: {{inquiryTitle}}<br>" +
            "<strong>현재 상태</strong>: {{statusLabel}}</p>" +
            "<p><a href=\"{{inquiryDetailUrl}}\">문의 상세 확인하기</a></p>" +
            "<p>이 메일은 상태 변경 안내이며 관리자 답변 내용과는 별도로 발송되었습니다.</p>"),
        new Definition("INQUIRY_UNABLE_TO_PROCESS_DEFAULT", EmailTemplateEvent.INQUIRY_UNABLE_TO_PROCESS,
            "문의 처리 불가 안내",
            "[TPMP] 문의 처리 결과를 안내드립니다: {{inquiryTitle}}",
            "<h2>{{serviceName}} 문의 상태 안내</h2>" +
            "<p>{{recipientName}}님, 요청하신 사항을 현재 처리하기 어려워 결과를 안내드립니다.</p>" +
            "<p><strong>접수 번호</strong>: {{inquiryId}}<br>" +
            "<strong>접수 유형</strong>: {{inquiryType}}<br>" +
            "<strong>제목</strong>: {{inquiryTitle}}<br>" +
            "<strong>현재 상태</strong>: {{statusLabel}}</p>" +
            "<p><a href=\"{{inquiryDetailUrl}}\">문의 상세 확인하기</a></p>" +
            "<p>이 메일은 상태 변경 안내이며 상세 사유가 등록된 경우 문의 상세에서 확인할 수 있습니다.</p>"));
}

public record Definition(String systemKey, EmailTemplateEvent eventCode, String name,
        String subjectTemplate, String htmlBody) {}
```

clone 이름은 `source.getName() + " 복사본"`, `systemKey=null`; 기본값 복원은 system key가 없으면 `400 INVALID_INPUT`, 있으면 위 카탈로그 값과 `active=true`로 갱신하며 binding은 건드리지 않는다.

추가할 오류 코드는 다음과 같이 고정한다.

```java
EMAIL_TEMPLATE_NOT_FOUND(HttpStatus.NOT_FOUND, "이메일 템플릿을 찾을 수 없습니다."),
EMAIL_TEMPLATE_IN_USE(HttpStatus.CONFLICT, "사용 중인 이메일 템플릿은 삭제할 수 없습니다."),
EMAIL_TEMPLATE_INVALID_VARIABLE(HttpStatus.BAD_REQUEST, "지원하지 않는 이메일 템플릿 변수가 포함되어 있습니다."),
EMAIL_TEMPLATE_SCOPE_MISMATCH(HttpStatus.BAD_REQUEST, "이벤트와 이메일 템플릿 범위가 일치하지 않습니다."),
EMAIL_TEMPLATE_INVALID_CONTENT(HttpStatus.BAD_REQUEST, "이메일 템플릿 내용을 확인해 주세요."),
EMAIL_TEMPLATE_TEST_SEND_FAILED(HttpStatus.BAD_GATEWAY, "테스트 이메일 발송에 실패했습니다."),
EMAIL_TEMPLATE_EVENT_NOT_FOUND(HttpStatus.NOT_FOUND, "이메일 템플릿 이벤트를 찾을 수 없습니다.")
```

- [ ] **Step 1: 멱등 시드와 unbind 보존 실패 테스트를 작성한다**

```java
@ExtendWith(MockitoExtension.class)
class EmailTemplateSeedRunnerTest {
    @Mock EmailTemplateRepository templateRepository;
    @Mock EmailTemplateBindingRepository bindingRepository;
    @Mock EmailTemplateRenderer renderer;

    @Test
    void firstSeedCreatesThreeTemplatesAndBindings() throws Exception {
        when(templateRepository.findBySystemKey(anyString())).thenReturn(Optional.empty());
        when(renderer.prepare(any(), anyString(), anyString()))
                .thenAnswer(inv -> new PreparedTemplate(inv.getArgument(1), inv.getArgument(2), "text"));
        new EmailTemplateSeedRunner(templateRepository, bindingRepository, renderer,
                new DefaultEmailTemplateCatalog()).run();
        verify(templateRepository, times(3)).save(any(EmailTemplate.class));
        verify(bindingRepository, times(3)).save(any(EmailTemplateBinding.class));
    }

    @Test
    void existingSystemTemplatesDoNotRecreateRemovedBinding() throws Exception {
        when(templateRepository.findBySystemKey(anyString())).thenReturn(Optional.of(systemTemplate()));
        new EmailTemplateSeedRunner(templateRepository, bindingRepository, renderer,
                new DefaultEmailTemplateCatalog()).run();
        verify(bindingRepository, never()).save(any());
    }
}
```

- [ ] **Step 2: 시드 테스트 실패를 확인하고 기본 카탈로그·러너를 구현한다**

Run: `cd backend; .\gradlew.bat test --tests "com.tpmp.testprep.config.EmailTemplateSeedRunnerTest"`

Expected before implementation: FAIL with missing classes. Implement one transaction: startup 시작 시 세 `system_key`가 모두 없을 때만 3개 템플릿과 3개 연결을 함께 생성한다. 하나라도 존재하면 빠진 템플릿만 보완하되 binding은 생성하지 않는다. After implementation: PASS.

- [ ] **Step 3: CRUD·참조 삭제·scope 연결 실패 테스트를 작성한다**

```java
@ExtendWith(MockitoExtension.class)
class EmailTemplateServiceTest {
    @Test
    void deleteReferencedTemplateThrowsDetailedConflict() {
        when(templateRepository.findActiveForUpdate(1L)).thenReturn(Optional.of(template()));
        when(bindingRepository.findAllByTemplateId(1L)).thenReturn(List.of(completedBinding()));
        assertThatThrownBy(() -> service.delete(1L, "admin@tpmp.com"))
                .isInstanceOfSatisfying(BusinessException.class, ex -> {
                    assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.EMAIL_TEMPLATE_IN_USE);
                    assertThat(ex.getDetails()).asList().hasSize(1);
                });
    }

    @Test
    void updateStoresServerSanitizedBodies() {
        when(renderer.prepare(any(), anyString(), anyString()))
                .thenReturn(new PreparedTemplate("제목", "<p>정화</p>", "정화"));
        EmailTemplateDetailResponse response = service.update(1L,
                new EmailTemplateUpdateRequest("이름", "제목", "<p onclick='x'>정화</p>", true),
                "admin@tpmp.com");
        assertThat(response.htmlBody()).isEqualTo("<p>정화</p>");
    }
}

@ExtendWith(MockitoExtension.class)
class EmailTemplateBindingServiceTest {
    @Test
    void bindRejectsInactiveOrScopeMismatchedTemplate() {
        assertThatThrownBy(() -> service.bind("INQUIRY_COMPLETED", 1L,
                "admin@tpmp.com"))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void unbindReturnsConfiguredFalseAndDoesNotDeleteTemplate() {
        EmailTemplateBindingResponse response = service.unbind("INQUIRY_COMPLETED");
        assertThat(response.configured()).isFalse();
        verify(templateRepository, never()).delete(any());
    }
}
```

- [ ] **Step 4: 서비스 테스트 실패를 확인한 뒤 CRUD·연결 서비스를 구현한다**

Run:

```powershell
.\gradlew.bat test --tests "com.tpmp.testprep.service.EmailTemplateServiceTest" --tests "com.tpmp.testprep.service.EmailTemplateBindingServiceTest"
```

Expected before implementation: FAIL with missing services. Implement all listed signatures; delete and bind both call `findActiveForUpdate` before checking references/deleted/active/scope. Map rendering reasons to `EMAIL_TEMPLATE_INVALID_VARIABLE` or `EMAIL_TEMPLATE_INVALID_CONTENT`. After implementation: PASS.

- [ ] **Step 5: 오류 상세 계약과 SMTP 테스트 발송 테스트를 작성한다**

```java
class ApiResponseContractTest {
    @Test
    void businessErrorIncludesStructuredDetails() {
        ApiResponse<Void> response = ApiResponse.fail("EMAIL_TEMPLATE_IN_USE", "사용 중", List.of("INQUIRY_COMPLETED"));
        assertThat(response.getError().details()).isEqualTo(List.of("INQUIRY_COMPLETED"));
    }
}

@ExtendWith(MockitoExtension.class)
class EmailTemplateTestMailSenderTest {
    @Test
    void recipientComesFromAuthenticatedAdminAndMimeBodyIsRendered() {
        when(userRepository.findByEmail("admin@tpmp.com")).thenReturn(Optional.of(admin()));
        EmailTemplateTestSendResponse result = sender.send(template(), "admin@tpmp.com");
        verify(mailSender).send(any(MimeMessage.class));
        assertThat(result.recipientMasked()).isEqualTo("a***@tpmp.com");
    }

    @Test
    void inactiveTemplateCanBeTestedByCurrentAdmin() {
        EmailTemplate inactive = inactiveTemplate();
        when(userRepository.findByEmail("admin@tpmp.com")).thenReturn(Optional.of(admin()));
        assertThatCode(() -> sender.send(inactive, "admin@tpmp.com")).doesNotThrowAnyException();
        verify(mailSender).send(any(MimeMessage.class));
    }
}
```

`BusinessException`에 `Object details`와 `(ErrorCode, Object)` 생성자를 추가하고 기존 생성자는 `details=null`을 위임한다. `ApiResponse.ErrorDetail`은 `record ErrorDetail(String code, String message, Object details)`로 확장한다. 테스트 SMTP 실패는 `EMAIL_TEMPLATE_TEST_SEND_FAILED` 502로 변환하고 로그에는 관리자 ID·템플릿 ID·마스킹 이메일·성공 여부만 남긴다.

- [ ] **Step 6: 오류·테스트 발송 테스트를 실행한다**

Run: `.\gradlew.bat test --tests "com.tpmp.testprep.service.EmailTemplateTestMailSenderTest"`

Expected: PASS; 수신자를 받는 request DTO가 존재하지 않으며 SMTP 본문·인증정보가 로그 인자로 전달되지 않는다.

- [ ] **Step 7: 관리자 Controller 보안·계약 실패 테스트를 작성한다**

```java
@WebMvcTest(AdminEmailTemplateController.class)
class AdminEmailTemplateControllerWebMvcTest {
    @Test @WithMockUser(roles = "ADMIN")
    void createReturnsSanitizedDetail() throws Exception {
        mvc.perform(post("/api/admin/email-templates")
                .contentType(APPLICATION_JSON)
                .content("{\"name\":\"완료\",\"scope\":\"INQUIRY_STATUS\",\"subjectTemplate\":\"제목\",\"htmlBody\":\"<p>본문</p>\",\"active\":true}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("완료"));
    }

    @Test @WithMockUser(roles = "USER")
    void userCannotReadTemplates() throws Exception {
        mvc.perform(get("/api/admin/email-templates")).andExpect(status().isForbidden());
    }

    @Test @WithMockUser(username = "admin@tpmp.com", roles = "ADMIN")
    void testSendHasNoRecipientInput() throws Exception {
        mvc.perform(post("/api/admin/email-templates/1/test-send"))
                .andExpect(status().isOk());
        verify(service).testSend(1L, "admin@tpmp.com");
    }
}
```

연결 Controller 테스트는 GET이 고정 3행을 반환하고 PUT body `{"templateId":1}`, DELETE unbind, 알 수 없는 path가 `404 EMAIL_TEMPLATE_EVENT_NOT_FOUND`로 정규화되는지 검증한다.

- [ ] **Step 8: Controller를 구현하고 API 테스트를 통과시킨다**

Controller는 클래스 레벨 ADMIN 권한을 쓰고 `POST create`만 201, 나머지 성공은 200을 반환한다. Preview는 저장하지 않고 서버 정화 HTML과 고정 샘플 변수 렌더링을 반환한다.

Run:

```powershell
.\gradlew.bat test --tests "com.tpmp.testprep.controller.AdminEmailTemplateControllerWebMvcTest" --tests "com.tpmp.testprep.controller.AdminEmailTemplateBindingControllerWebMvcTest"
```

Expected: `BUILD SUCCESSFUL`; USER 403, 상세 error details, principal 이메일 전달이 검증된다.

- [ ] **Step 9: Task 3 히스토리·인계 갱신 후 커밋한다**

`AdminEmailTemplate_Modified.md` 상단에 `HIST-20260831-003`; `CURRENT.md`에 API 목록, seed의 unbind 비복구 규칙, 테스트 명령을 기록한다.

```powershell
git add backend/src/main/java/com/tpmp/testprep/config/DefaultEmailTemplateCatalog.java backend/src/main/java/com/tpmp/testprep/config/EmailTemplateSeedRunner.java backend/src/main/java/com/tpmp/testprep/service/EmailTemplateService.java backend/src/main/java/com/tpmp/testprep/service/EmailTemplateBindingService.java backend/src/main/java/com/tpmp/testprep/service/EmailTemplateTestMailSender.java backend/src/main/java/com/tpmp/testprep/controller/AdminEmailTemplateController.java backend/src/main/java/com/tpmp/testprep/controller/AdminEmailTemplateBindingController.java backend/src/main/java/com/tpmp/testprep/dto/request/EmailTemplateCreateRequest.java backend/src/main/java/com/tpmp/testprep/dto/request/EmailTemplateUpdateRequest.java backend/src/main/java/com/tpmp/testprep/dto/request/EmailTemplatePreviewRequest.java backend/src/main/java/com/tpmp/testprep/dto/request/EmailTemplateBindingRequest.java backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateSummaryResponse.java backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateDetailResponse.java backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateReferenceResponse.java backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateVariableResponse.java backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplatePreviewResponse.java backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateBindingResponse.java backend/src/main/java/com/tpmp/testprep/dto/response/EmailTemplateTestSendResponse.java backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java backend/src/main/java/com/tpmp/testprep/exception/BusinessException.java backend/src/main/java/com/tpmp/testprep/exception/GlobalExceptionHandler.java backend/src/main/java/com/tpmp/testprep/dto/response/ApiResponse.java backend/src/test/java/com/tpmp/testprep/config/EmailTemplateSeedRunnerTest.java backend/src/test/java/com/tpmp/testprep/service/EmailTemplateServiceTest.java backend/src/test/java/com/tpmp/testprep/service/EmailTemplateBindingServiceTest.java backend/src/test/java/com/tpmp/testprep/service/EmailTemplateTestMailSenderTest.java backend/src/test/java/com/tpmp/testprep/controller/AdminEmailTemplateControllerWebMvcTest.java backend/src/test/java/com/tpmp/testprep/controller/AdminEmailTemplateBindingControllerWebMvcTest.java docs/history/back/adm/AdminEmailTemplate_Modified.md docs/agent-handoff/CURRENT.md
git commit -m "[BE] feat: 관리자 이메일 템플릿 API 추가"
```

---

### Task 4: 문의 상태 알림 분리와 HTML 이메일 큐

**Files:**
- Modify: `backend/src/main/java/com/tpmp/testprep/dto/request/InquiryStatusUpdateRequest.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/response/InquiryStatusUpdateResponse.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/response/InquiryStatusEmailOutcome.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/controller/AdminInquiryController.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/service/InquiryService.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/service/InquiryEmailService.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/service/InquiryEmailDeliveryProcessor.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/service/InquiryEmailDispatcher.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/dto/response/InquiryEmailDeliveryResponse.java`
- Modify: `backend/src/test/java/com/tpmp/testprep/service/InquiryServiceTest.java`
- Modify: `backend/src/test/java/com/tpmp/testprep/service/InquiryEmailServiceTest.java`
- Modify: `backend/src/test/java/com/tpmp/testprep/service/InquiryEmailDeliveryProcessorTest.java`
- Modify: `backend/src/test/java/com/tpmp/testprep/service/InquiryEmailDispatcherTest.java`
- Modify: `backend/src/test/java/com/tpmp/testprep/service/InquiryEmailTransactionIntegrationTest.java`
- Create: `backend/src/test/java/com/tpmp/testprep/controller/AdminInquiryControllerWebMvcTest.java`
- Modify: `docs/history/back/adm/AdminInquiry_Modified.md`
- Modify: `docs/history/back/adm/AdminEmailTemplate_Modified.md`
- Modify: `docs/agent-handoff/CURRENT.md`

**Interfaces:**
- Consumes: Task 3 binding/renderer API, 기존 `InquiryDetailResponse`, 비동기 `InquiryEmailQueuedEvent`.
- Produces:

```java
public record InquiryStatusUpdateRequest(@NotNull Inquiry.Status status, boolean sendEmail) {}

public enum InquiryStatusEmailOutcome {
    NOT_REQUESTED,
    QUEUED,
    SKIPPED_TEMPLATE_MISSING,
    SKIPPED_TEMPLATE_INACTIVE,
    SKIPPED_TEMPLATE_INVALID
}

public record InquiryStatusUpdateResponse(
        InquiryDetailResponse inquiry,
        InquiryStatusEmailOutcome emailOutcome,
        String emailMessage,
        String templateSettingsUrl) {}

public record InquiryEmailDeliveryResponse(Long id, Long inquiryId, Long inquiryMessageId,
        InquiryEmailDelivery.EventType eventType, InquiryEmailDelivery.Status status,
        String recipientEmail, String subject, boolean htmlContent, int attemptCount,
        String lastError, LocalDateTime createdAt, LocalDateTime sentAt) {}

public record StatusEmailResult(InquiryStatusEmailOutcome outcome, String safeMessage) {}
public StatusEmailResult queueStatusNotification(Inquiry inquiry, boolean sendEmail);
public InquiryStatusUpdateResponse updateStatus(Long inquiryId, InquiryStatusUpdateRequest request);
```

고정 메시지:

| outcome | `emailMessage` |
|---|---|
| `NOT_REQUESTED` | `상태만 변경했습니다.` |
| `QUEUED` | `상태 변경 안내 이메일을 발송 대기열에 등록했습니다.` |
| `SKIPPED_TEMPLATE_MISSING` | `연결된 이메일 템플릿이 없어 상태만 변경했습니다.` |
| `SKIPPED_TEMPLATE_INACTIVE` | `연결된 이메일 템플릿이 비활성 상태여서 상태만 변경했습니다.` |
| `SKIPPED_TEMPLATE_INVALID` | `이메일 템플릿을 안전하게 처리할 수 없어 상태만 변경했습니다.` |

`templateSettingsUrl`은 세 `SKIPPED_*`에서만 `/admin/email-templates?tab=bindings`, 나머지는 null이다.

- [ ] **Step 1: 종료 상태에서 메시지를 생성하지 않는 실패 테스트를 수정한다**

```java
@Test
void completedStatusDoesNotCreateAdminMessageAndReturnsEmailOutcome() {
    when(inquiryRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(bugReport()));
    when(inquiryEmailService.queueStatusNotification(any(), eq(true)))
            .thenReturn(new StatusEmailResult(InquiryStatusEmailOutcome.QUEUED,
                    "상태 변경 안내 이메일을 발송 대기열에 등록했습니다."));
    InquiryStatusUpdateResponse result = service.updateStatus(1L,
            new InquiryStatusUpdateRequest(Inquiry.Status.COMPLETED, true));
    assertThat(result.inquiry().status()).isEqualTo(Inquiry.Status.COMPLETED);
    assertThat(result.emailOutcome()).isEqualTo(InquiryStatusEmailOutcome.QUEUED);
    verify(inquiryMessageRepository, never()).save(any());
}
```

- [ ] **Step 2: InquiryService 테스트 실패를 확인한다**

Run: `cd backend; .\gradlew.bat test --tests "com.tpmp.testprep.service.InquiryServiceTest"`

Expected: FAIL because request/response signatures still include `message` and service returns `InquiryDetailResponse`.

- [ ] **Step 3: 상태 서비스와 Controller 응답을 최소 변경한다**

`AdminInquiryController.updateStatus`는 `ResponseEntity<ApiResponse<InquiryStatusUpdateResponse>>`; `InquiryService.updateStatus`는 admin 조회·종료 메시지 저장을 제거하고 상태 전이 후 `queueStatusNotification` 결과를 조합한다. 열린 상태, 종료 상태에서 다시 열린 상태, `sendEmail=false`는 `NOT_REQUESTED`다. API WebMvc 테스트는 request JSON에 `message`가 없어도 200이고 `$.data.emailOutcome`을 검증한다.

- [ ] **Step 4: 활성·미설정·비활성·손상 큐 결과 실패 테스트를 작성한다**

```java
@Test
void missingBindingSkipsEmailWithoutThrowing() {
    when(bindingRepository.findByEventCode(EmailTemplateEvent.INQUIRY_COMPLETED)).thenReturn(Optional.empty());
    StatusEmailResult result = service.queueStatusNotification(completedInquiry(), true);
    assertThat(result.outcome()).isEqualTo(InquiryStatusEmailOutcome.SKIPPED_TEMPLATE_MISSING);
    verify(deliveryRepository, never()).save(any());
}

@Test
void activeTemplateQueuesImmutableHtmlSnapshot() {
    when(renderer.render(any(), anyString(), anyString(), anyMap()))
            .thenReturn(new RenderedEmail("완료", "<p>완료</p>", "완료"));
    StatusEmailResult result = service.queueStatusNotification(completedInquiry(), true);
    assertThat(result.outcome()).isEqualTo(InquiryStatusEmailOutcome.QUEUED);
    verify(deliveryRepository).save(argThat(d -> "<p>완료</p>".equals(d.getHtmlBody())
            && "완료".equals(d.getBody())));
}

@Test
void corruptedTemplateReturnsInvalidAndKeepsCallerFlow() {
    when(renderer.render(any(), anyString(), anyString(), anyMap()))
            .thenThrow(new EmailTemplateRenderingException(
                    EmailTemplateRenderingException.Reason.INVALID_CONTENT, "렌더링 실패"));
    assertThat(service.queueStatusNotification(completedInquiry(), true).outcome())
            .isEqualTo(InquiryStatusEmailOutcome.SKIPPED_TEMPLATE_INVALID);
}
```

- [ ] **Step 5: 템플릿 상태 큐를 구현하고 서비스 테스트를 통과시킨다**

문의 변수 Map은 7개 키를 모두 채운다. `recipientName`은 user nickname이 있으면 nickname, 없으면 name; 상세 URL은 정규화된 `app.public-url + "/user/inquiries/" + id`; 타입·상태는 제품 표시명으로 변환한다. 기존 `queueAdminNotification`과 `queueUserNotification(ADMIN_MESSAGE)`는 plain text 경로를 유지한다.

Run:

```powershell
.\gradlew.bat test --tests "com.tpmp.testprep.service.InquiryEmailServiceTest" --tests "com.tpmp.testprep.service.InquiryServiceTest" --tests "com.tpmp.testprep.controller.AdminInquiryControllerWebMvcTest"
```

Expected: PASS; SKIPPED 결과에서 예외가 Controller까지 전파되지 않는다.

- [ ] **Step 6: plain text와 HTML 멀티파트 발송 실패 테스트를 작성한다**

```java
@Test
void dispatcherUsesSimpleMailForLegacyDelivery() {
    when(processor.claim(1L)).thenReturn(Optional.of(
            new ClaimedDelivery(1L, "user@tpmp.com", "제목", "텍스트", null)));
    dispatcher.dispatch(1L);
    verify(mailSender).send(any(SimpleMailMessage.class));
}

@Test
void dispatcherUsesMimeMultipartForHtmlDelivery() {
    when(processor.claim(2L)).thenReturn(Optional.of(
            new ClaimedDelivery(2L, "user@tpmp.com", "제목", "텍스트", "<p>HTML</p>")));
    dispatcher.dispatch(2L);
    verify(mailSender).send(any(MimeMessage.class));
}
```

`ClaimedDelivery`를 `record ClaimedDelivery(Long id, String recipientEmail, String subject, String body, String htmlBody)`로 확장한다. HTML이 null이면 기존 `SimpleMailMessage`; 값이 있으면 `MimeMessageHelper(mime, true, UTF_8).setText(body, htmlBody)`로 text/plain과 text/html을 함께 보낸다.

`InquiryEmailDeliveryResponse.from`은 본문 자체를 API에 노출하지 않고 `htmlBody != null && !htmlBody.isBlank()`만 `htmlContent`로 반환한다. 기존 관리자 발송 이력 화면은 이 값으로 `HTML` 배지를 표시할 수 있고 사용자별 본문은 기존처럼 응답에서 제외된다.

- [ ] **Step 7: 이메일 처리·트랜잭션 회귀 테스트를 통과시킨다**

Run:

```powershell
.\gradlew.bat test --tests "com.tpmp.testprep.service.InquiryEmailDeliveryProcessorTest" --tests "com.tpmp.testprep.service.InquiryEmailDispatcherTest" --tests "com.tpmp.testprep.service.InquiryEmailTransactionIntegrationTest"
```

Expected: PASS; 큐 이벤트는 commit 후 발송되고 SMTP 실패는 delivery를 FAILED로 만들 뿐 이미 저장된 문의 상태를 되돌리지 않는다.

- [ ] **Step 8: Task 4 히스토리·인계 갱신 후 커밋한다**

`AdminInquiry_Modified.md`와 `AdminEmailTemplate_Modified.md` 상단에 각 파일의 당일 다음 HIST ID를 추가한다. `CURRENT.md`에는 제거한 `message`, 새 응답, plain/HTML 회귀 결과를 기록한다.

```powershell
git add backend/src/main/java/com/tpmp/testprep/dto/request/InquiryStatusUpdateRequest.java backend/src/main/java/com/tpmp/testprep/dto/response/InquiryStatusUpdateResponse.java backend/src/main/java/com/tpmp/testprep/dto/response/InquiryStatusEmailOutcome.java backend/src/main/java/com/tpmp/testprep/controller/AdminInquiryController.java backend/src/main/java/com/tpmp/testprep/service/InquiryService.java backend/src/main/java/com/tpmp/testprep/service/InquiryEmailService.java backend/src/main/java/com/tpmp/testprep/service/InquiryEmailDeliveryProcessor.java backend/src/main/java/com/tpmp/testprep/service/InquiryEmailDispatcher.java backend/src/main/java/com/tpmp/testprep/dto/response/InquiryEmailDeliveryResponse.java backend/src/test/java/com/tpmp/testprep/service/InquiryServiceTest.java backend/src/test/java/com/tpmp/testprep/service/InquiryEmailServiceTest.java backend/src/test/java/com/tpmp/testprep/service/InquiryEmailDeliveryProcessorTest.java backend/src/test/java/com/tpmp/testprep/service/InquiryEmailDispatcherTest.java backend/src/test/java/com/tpmp/testprep/service/InquiryEmailTransactionIntegrationTest.java backend/src/test/java/com/tpmp/testprep/controller/AdminInquiryControllerWebMvcTest.java docs/history/back/adm/AdminInquiry_Modified.md docs/history/back/adm/AdminEmailTemplate_Modified.md docs/agent-handoff/CURRENT.md
git commit -m "[BE] feat: 문의 상태 템플릿 이메일 분리"
```

---

### Task 5: 관리자 템플릿 목록·편집·연결 UI

**Files:**
- Create: `frontend/src/services/emailTemplateService.ts`
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/components/ui/RichTextEditor.tsx`
- Create: `frontend/src/components/ui/RichTextEditor.test.tsx`
- Create: `frontend/src/components/admin/EmailTemplateListPanel.tsx`
- Create: `frontend/src/components/admin/EmailTemplateListPanel.test.tsx`
- Create: `frontend/src/components/admin/EmailTemplateBindingsPanel.tsx`
- Create: `frontend/src/components/admin/EmailTemplateBindingsPanel.test.tsx`
- Create: `frontend/src/components/admin/EmailTemplateForm.tsx`
- Create: `frontend/src/components/admin/EmailTemplateForm.test.tsx`
- Create: `frontend/src/app/admin/email-templates/page.tsx`
- Create: `frontend/src/app/admin/email-templates/page.test.tsx`
- Create: `frontend/src/app/admin/email-templates/new/page.tsx`
- Create: `frontend/src/app/admin/email-templates/[id]/edit/page.tsx`
- Create: `frontend/src/app/admin/email-templates/[id]/edit/page.test.tsx`
- Modify: `AGENTS.md`
- Create: `docs/history/front/adm/AdminEmailTemplate_Modified.md`
- Modify: `docs/agent-handoff/CURRENT.md`

**Interfaces:**
- Consumes: Task 3 API, `ApiResponse<T>`, `PageResponse<T>`, `TableSkeleton`, `Skeleton`, `RichContent`.
- Produces:

```typescript
export type EmailTemplateScope = 'INQUIRY_STATUS';
export type EmailTemplateEventCode =
  | 'INQUIRY_ANSWERED'
  | 'INQUIRY_COMPLETED'
  | 'INQUIRY_UNABLE_TO_PROCESS';

export interface EmailTemplateReference { eventCode: EmailTemplateEventCode; eventLabel: string; }
export interface EmailTemplateVariable { token: string; name: string; label: string; description: string; }
export interface EmailTemplateSummary {
  id: number; name: string; scope: EmailTemplateScope; active: boolean; defaultTemplate: boolean;
  referenceCount: number; referencedEvents: EmailTemplateReference[]; deletable: boolean; updatedAt: string;
}
export interface EmailTemplateDetail extends EmailTemplateSummary {
  subjectTemplate: string; htmlBody: string; textBody: string;
  allowedVariables: EmailTemplateVariable[]; createdAt: string;
}
export interface EmailTemplatePayload {
  name: string; scope: EmailTemplateScope; subjectTemplate: string; htmlBody: string; active: boolean;
}
export interface EmailTemplateBinding {
  eventCode: EmailTemplateEventCode; eventLabel: string; scope: EmailTemplateScope;
  templateId: number | null; templateName: string | null; templateActive: boolean | null;
  configured: boolean; sendable: boolean; unavailableReason: string | null;
}
export interface EmailTemplatePreview {
  sanitizedHtmlBody: string; renderedSubject: string; renderedHtmlBody: string;
  renderedTextBody: string; unsafeContentRemoved: boolean;
}
export interface EmailTemplateTestSend { recipientMasked: string; sentAt: string; }
export interface EmailTemplateFormProps { mode: 'create' | 'edit'; templateId?: number; }
export interface RichTextEditorHandle { insertText(text: string): void; }
export interface RichTextEditorProps {
  value: string; onChange: (html: string) => void; placeholder?: string;
  minHeight?: number; allowImages?: boolean;
}
```

`ApiResponse<T>.error`는 `{ code: string; message: string; details?: unknown }`이다.

- [ ] **Step 1: 이미지 금지와 ref 삽입 실패 테스트를 작성한다**

```tsx
it('allowImages=false이면 이미지 툴바와 업로드 입력을 노출하지 않는다', async () => {
  render(<RichTextEditor value="" onChange={jest.fn()} allowImages={false} />);
  expect(await screen.findByTestId('rich-text-editor')).not.toHaveAttribute('data-image-enabled', 'true');
  expect(screen.queryByLabelText('이미지 업로드')).not.toBeInTheDocument();
});

it('insertText는 현재 커서에 템플릿 변수를 삽입한다', async () => {
  const ref = createRef<RichTextEditorHandle>();
  render(<RichTextEditor ref={ref} value="<p>본문</p>" onChange={jest.fn()} allowImages={false} />);
  act(() => ref.current?.insertText('{{recipientName}}'));
  expect(mockQuill.insertText).toHaveBeenCalledWith(expect.any(Number), '{{recipientName}}', 'user');
});
```

- [ ] **Step 2: RichTextEditor 테스트 실패를 확인하고 공용 인터페이스를 구현한다**

Run: `cd frontend; npm test -- --watch=false src/components/ui/RichTextEditor.test.tsx`

Expected before implementation: FAIL because props/ref do not exist. Convert export to `forwardRef<RichTextEditorHandle, RichTextEditorProps>` and expose `insertText` with `useImperativeHandle`. `allowImages` default is true. false이면 toolbar/formats에서 image를 제외하고 file input을 렌더하지 않으며 paste/drop 이미지 이벤트를 `preventDefault`, `stopPropagation`, `stopImmediatePropagation`으로 차단하고 업로드 API를 호출하지 않는다. After implementation: PASS.

- [ ] **Step 3: API service와 exact TypeScript 계약을 구현한다**

```typescript
export const emailTemplateService = {
  getTemplates: (params: { keyword?: string; scope?: EmailTemplateScope; active?: boolean; page: number; size: number }) =>
    apiClient.get<ApiResponse<PageResponse<EmailTemplateSummary>>>('/admin/email-templates', { params }),
  getTemplate: (id: number) => apiClient.get<ApiResponse<EmailTemplateDetail>>(`/admin/email-templates/${id}`),
  createTemplate: (payload: EmailTemplatePayload) => apiClient.post<ApiResponse<EmailTemplateDetail>>('/admin/email-templates', payload),
  updateTemplate: (id: number, payload: EmailTemplatePayload) => apiClient.put<ApiResponse<EmailTemplateDetail>>(`/admin/email-templates/${id}`, payload),
  cloneTemplate: (id: number) => apiClient.post<ApiResponse<EmailTemplateDetail>>(`/admin/email-templates/${id}/clone`),
  resetDefault: (id: number) => apiClient.post<ApiResponse<EmailTemplateDetail>>(`/admin/email-templates/${id}/reset-default`),
  deleteTemplate: (id: number) => apiClient.delete<ApiResponse<void>>(`/admin/email-templates/${id}`),
  preview: (payload: Pick<EmailTemplatePayload, 'scope' | 'subjectTemplate' | 'htmlBody'>) =>
    apiClient.post<ApiResponse<EmailTemplatePreview>>('/admin/email-templates/preview', payload),
  testSend: (id: number) => apiClient.post<ApiResponse<EmailTemplateTestSend>>(`/admin/email-templates/${id}/test-send`),
  getBindings: () => apiClient.get<ApiResponse<EmailTemplateBinding[]>>('/admin/email-template-bindings'),
  bind: (eventCode: EmailTemplateEventCode, templateId: number) =>
    apiClient.put<ApiResponse<EmailTemplateBinding>>(`/admin/email-template-bindings/${eventCode}`, { templateId }),
  unbind: (eventCode: EmailTemplateEventCode) =>
    apiClient.delete<ApiResponse<EmailTemplateBinding>>(`/admin/email-template-bindings/${eventCode}`),
};
```

- [ ] **Step 4: 목록 Skeleton·삭제 경합·연결 상태 실패 테스트를 작성한다**

```tsx
it('목록 로딩 중 TableSkeleton을 표시하고 연결된 템플릿 삭제를 막는다', async () => {
  mockGetTemplates.mockReturnValue(deferred.promise);
  render(<EmailTemplateListPanel />);
  expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  deferred.resolve(pageOf([{ id: 1, name: '완료', deletable: false, referenceCount: 1 }]));
  expect(await screen.findByText('처리 완료')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '삭제' })).toBeDisabled();
});

it('삭제 409 details의 참조 이벤트를 표시한다', async () => {
  mockDelete.mockRejectedValue(apiError('EMAIL_TEMPLATE_IN_USE', [{ eventCode: 'INQUIRY_COMPLETED', eventLabel: '처리 완료' }]));
  render(<EmailTemplateListPanel />);
  await user.click(await screen.findByRole('button', { name: '삭제' }));
  expect(await screen.findByText(/처리 완료에서 사용 중/)).toBeInTheDocument();
});

it('비활성 연결은 값은 유지하고 발송 중지됨을 표시한다', async () => {
  mockGetBindings.mockResolvedValue(bindings([{ configured: true, sendable: false, templateActive: false }]));
  render(<EmailTemplateBindingsPanel />);
  expect(await screen.findByText('이메일 발송 중지됨')).toBeInTheDocument();
});
```

- [ ] **Step 5: 목록·연결 패널과 탭 페이지를 최소 구현한다**

`page.tsx`는 `searchParams.tab === 'bindings' ? 'bindings' : 'templates'`로 탭을 고정하고 각 패널을 렌더한다. 목록은 `useState(true)`로 로딩 시작, `finally`에서 false, 로딩 중 `TableSkeleton`, 로딩 종료와 빈 content에서만 빈 상태를 보인다. 409는 `ApiResponse.error.details`를 `EmailTemplateReference[]`로 runtime guard한 뒤 표시한다.

Run:

```powershell
npm test -- --watch=false src/components/admin/EmailTemplateListPanel.test.tsx src/components/admin/EmailTemplateBindingsPanel.test.tsx src/app/admin/email-templates/page.test.tsx
```

Expected: PASS; tab URL, Skeleton, unbind, 비활성 안내가 검증된다.

- [ ] **Step 6: 편집·변수 삽입·서버 정화 반영 실패 테스트를 작성한다**

```tsx
it('변수 버튼은 ref insertText를 호출하고 preview는 서버 HTML만 렌더한다', async () => {
  mockPreview.mockResolvedValue(ok({ sanitizedHtmlBody: '<p>정화됨</p>', renderedSubject: '샘플',
    renderedHtmlBody: '<p>정화됨</p>', renderedTextBody: '정화됨', unsafeContentRemoved: true }));
  render(<EmailTemplateForm mode="create" />);
  await user.click(screen.getByRole('button', { name: '수신자 이름 삽입' }));
  expect(mockInsertText).toHaveBeenCalledWith('{{recipientName}}');
  await user.click(screen.getByRole('button', { name: '미리보기' }));
  expect(await screen.findByText('정화됨')).toBeInTheDocument();
  expect(screen.getByText(/안전하지 않은 HTML이 제거/)).toBeInTheDocument();
});

it('테스트 발송 수신자는 로그인 관리자 이메일로 읽기 전용 표시한다', async () => {
  render(<EmailTemplateForm mode="edit" templateId={1} />);
  expect(await screen.findByText('admin@tpmp.com')).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: '테스트 수신 이메일' })).not.toBeInTheDocument();
});
```

- [ ] **Step 7: 폼과 신규·수정 페이지를 구현하고 테스트한다**

편집 모드 initial fetch 동안 폼 형태 `Skeleton`을 사용한다. 저장 성공 응답의 `htmlBody`를 state와 preview에 다시 넣어 서버 정화 결과를 반영한다. 테스트 발송은 저장된 template ID가 있는 edit 모드에서만 활성화하고 auth store의 관리자 이메일을 읽기 전용으로 표시한다. 미리보기는 `RichContent html={preview.renderedHtmlBody}`만 사용한다.

Run:

```powershell
npm test -- --watch=false --runTestsByPath "src/components/admin/EmailTemplateForm.test.tsx" "src/app/admin/email-templates/[id]/edit/page.test.tsx"
npx tsc --noEmit
```

Expected: tests PASS and TypeScript exits 0 with no new `any`.

- [ ] **Step 8: AGENTS 공용 인터페이스·히스토리·인계를 갱신한다**

`AGENTS.md` Shared Utilities의 `RichTextEditor` 행을 다음 계약으로 바꾼다: `<RichTextEditor ref value onChange allowImages />` — HTML 편집기, `allowImages=false` 이미지 입력 차단, ref의 `insertText(text)`로 커서 변수 삽입. `AdminEmailTemplate_Modified.md`에 `HIST-20260831-001`, `CURRENT.md`에 routes/tests와 다음 Task를 기록한다.

- [ ] **Step 9: Task 5를 커밋한다**

```powershell
git add frontend/src/services/emailTemplateService.ts frontend/src/types/index.ts frontend/src/components/ui/RichTextEditor.tsx frontend/src/components/ui/RichTextEditor.test.tsx frontend/src/components/admin/EmailTemplateListPanel.tsx frontend/src/components/admin/EmailTemplateListPanel.test.tsx frontend/src/components/admin/EmailTemplateBindingsPanel.tsx frontend/src/components/admin/EmailTemplateBindingsPanel.test.tsx frontend/src/components/admin/EmailTemplateForm.tsx frontend/src/components/admin/EmailTemplateForm.test.tsx frontend/src/app/admin/email-templates/page.tsx frontend/src/app/admin/email-templates/page.test.tsx frontend/src/app/admin/email-templates/new/page.tsx ':(literal)frontend/src/app/admin/email-templates/[id]/edit/page.tsx' ':(literal)frontend/src/app/admin/email-templates/[id]/edit/page.test.tsx' AGENTS.md docs/history/front/adm/AdminEmailTemplate_Modified.md docs/agent-handoff/CURRENT.md
git commit -m "[FE] feat: 관리자 이메일 템플릿 관리 화면 추가"
```

---

### Task 6: 관리자 문의 상세 답변·상태 UI 역할 분리

**Files:**
- Modify: `frontend/src/services/inquiryService.ts`
- Modify: `frontend/src/app/admin/inquiries/[id]/page.tsx`
- Modify: `frontend/src/app/admin/inquiries/[id]/page.test.tsx`
- Modify: `frontend/src/components/ui/InquiryMessageComposer.tsx`
- Modify: `frontend/src/components/ui/InquiryMessageComposer.test.tsx`
- Modify: `docs/history/front/adm/AdminInquiry_Modified.md`
- Modify: `docs/history/front/adm/AdminEmailTemplate_Modified.md`
- Modify: `docs/agent-handoff/CURRENT.md`

**Interfaces:**
- Consumes: Task 4 status response, Task 5 `emailTemplateService.getBindings`, 기존 `InquiryMessageComposer`.
- Produces:

```typescript
export type InquiryStatusEmailOutcome =
  | 'NOT_REQUESTED'
  | 'QUEUED'
  | 'SKIPPED_TEMPLATE_MISSING'
  | 'SKIPPED_TEMPLATE_INACTIVE'
  | 'SKIPPED_TEMPLATE_INVALID';

export interface InquiryStatusUpdateResult {
  inquiry: InquiryDetail;
  emailOutcome: InquiryStatusEmailOutcome;
  emailMessage: string;
  templateSettingsUrl: string | null;
}

export interface InquiryEmailDelivery {
  id: number;
  inquiryId: number;
  inquiryMessageId: number | null;
  eventType: InquiryEmailEventType;
  status: InquiryEmailDeliveryStatus;
  recipientEmail: string;
  subject: string;
  htmlContent: boolean;
  attemptCount: number;
  lastError: string | null;
  createdAt: string;
  sentAt: string | null;
}

adminUpdateStatus: (id: number, status: InquiryStatus, sendEmail = false) =>
  apiClient.patch<ApiResponse<InquiryStatusUpdateResult>>(`/admin/inquiries/${id}/status`, { status, sendEmail });
```

- [ ] **Step 1: 역할 분리와 종료 확인 실패 테스트를 작성한다**

```tsx
it('답변 영역은 타임라인 등록임을 설명하고 상태 영역에는 종료 안내 입력이 없다', async () => {
  renderPage(inquiryWithoutAdminMessage());
  expect(await screen.findByRole('heading', { name: '사용자에게 답변' })).toBeInTheDocument();
  expect(screen.getByText(/문의 타임라인에 관리자 답변으로 추가/)).toBeInTheDocument();
  expect(screen.queryByLabelText('종료 안내')).not.toBeInTheDocument();
});

it('답변 작성기의 이메일 옵션은 답변 내용 발송이라고 명시한다', () => {
  render(<InquiryMessageComposer inquiryId={7} onSent={jest.fn()} admin />);
  expect(screen.getByLabelText('이 답변 내용을 이메일로도 발송')).toBeInTheDocument();
});

it('관리자 답변 없이 종료하면 확인 모달 뒤에만 상태 API를 호출한다', async () => {
  renderPage(inquiryWithoutAdminMessage());
  await user.selectOptions(screen.getByLabelText('처리 상태'), 'COMPLETED');
  await user.click(screen.getByRole('button', { name: '처리 완료로 변경' }));
  expect(screen.getByText('사용자에게 별도 답변을 등록하지 않고 상태를 종료합니다')).toBeInTheDocument();
  expect(mockUpdateStatus).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: '답변 없이 상태 변경' }));
  expect(mockUpdateStatus).toHaveBeenCalledWith(7, 'COMPLETED', false);
});
```

- [ ] **Step 2: 문의 상세 테스트 실패를 확인한다**

Run: `cd frontend; npm test -- --watch=false --runTestsByPath "src/app/admin/inquiries/[id]/page.test.tsx"`

Expected: FAIL because 종료 안내와 `message` 인자가 남아 있고 confirmation dialog가 없다.

- [ ] **Step 3: 문의 service와 두 작업 카드의 책임을 분리한다**

`statusMessage` state·textarea·필수 검증을 제거한다. `InquiryMessageComposer` 카드 제목은 `사용자에게 답변`, 설명은 `등록한 내용은 문의 타임라인에 관리자 답변으로 추가되며 상태는 변경되지 않습니다.`로 고정한다. 작성기의 admin 이메일 checkbox label은 `이 답변 내용을 이메일로도 발송`으로 바꾼다. 상태 버튼 label은 `INQUIRY_STATUS_LABEL[selectedStatus] + "로 변경"`이다. 현재 inquiry와 같은 status면 disabled다.

- [ ] **Step 4: terminal binding 가용성과 SKIPPED 동시 알림 실패 테스트를 작성한다**

```tsx
it('활성 binding이 없으면 상태 이메일 선택을 막고 설정 링크를 제공한다', async () => {
  mockBindings([{ eventCode: 'INQUIRY_COMPLETED', configured: false, sendable: false,
    unavailableReason: '템플릿 미설정' }]);
  renderPage(bugReport());
  await user.selectOptions(screen.getByLabelText('처리 상태'), 'COMPLETED');
  expect(screen.getByLabelText('상태 변경 안내 이메일 발송')).toBeDisabled();
  expect(screen.getByRole('link', { name: '이메일 템플릿 관리' }))
    .toHaveAttribute('href', '/admin/email-templates?tab=bindings');
});

it('상태 성공과 이메일 미발송 경고를 함께 표시한다', async () => {
  mockUpdateStatus.mockResolvedValue(ok({ inquiry: completed(),
    emailOutcome: 'SKIPPED_TEMPLATE_INACTIVE',
    emailMessage: '연결된 이메일 템플릿이 비활성 상태여서 상태만 변경했습니다.',
    templateSettingsUrl: '/admin/email-templates?tab=bindings' }));
  renderPage(bugReport());
  await changeStatusToCompletedAndConfirm();
  expect(await screen.findByText('상태를 처리 완료로 변경했습니다.')).toBeInTheDocument();
  expect(screen.getByText(/비활성 상태여서 상태만 변경/)).toBeInTheDocument();
});
```

- [ ] **Step 5: terminal 상태에서만 이메일 옵션과 binding 안내를 구현한다**

`ANSWERED→INQUIRY_ANSWERED`, `COMPLETED→INQUIRY_COMPLETED`, `UNABLE_TO_PROCESS→INQUIRY_UNABLE_TO_PROCESS` 매핑 상수를 페이지에 둔다. 열린 상태 선택에서는 checkbox 자체를 렌더하지 않는다. 종료 상태에서 현재 binding의 `sendable=true`일 때만 checkbox를 활성화한다. 답변 존재 여부는 `inquiry.messages.some(message => message.authorRole === 'ADMIN')`로 판단한다. 확인 dialog는 페이지 내부 state와 `role="dialog"`, 취소·`답변 없이 상태 변경` 버튼을 사용한다.

- [ ] **Step 6: 문의 상세·composer 회귀 테스트와 타입체크를 통과시킨다**

Run:

```powershell
npm test -- --watch=false --runTestsByPath "src/app/admin/inquiries/[id]/page.test.tsx" "src/components/ui/InquiryMessageComposer.test.tsx"
npx tsc --noEmit
```

Expected: PASS; 답변 email checkbox는 기존 `adminAddMessage`, 상태 email checkbox는 새 `adminUpdateStatus`만 호출한다.

- [ ] **Step 7: Task 6 히스토리·인계 갱신 후 커밋한다**

`AdminInquiry_Modified.md`와 `AdminEmailTemplate_Modified.md`에 각 파일의 당일 다음 ID를 상단 추가하고 `CURRENT.md`에 UI 역할, confirm, SKIPPED 병행 표시와 테스트 결과를 기록한다.

```powershell
git add frontend/src/services/inquiryService.ts ':(literal)frontend/src/app/admin/inquiries/[id]/page.tsx' ':(literal)frontend/src/app/admin/inquiries/[id]/page.test.tsx' frontend/src/components/ui/InquiryMessageComposer.tsx frontend/src/components/ui/InquiryMessageComposer.test.tsx docs/history/front/adm/AdminInquiry_Modified.md docs/history/front/adm/AdminEmailTemplate_Modified.md docs/agent-handoff/CURRENT.md
git commit -m "[FE] feat: 문의 답변과 처리 상태 UI 분리"
```

---

### Task 7: 글로벌 메뉴·문서·정적 검증·전체 테스트·실제 PostgreSQL 검증

**Files:**
- Modify: `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java`
- Modify: `backend/src/test/java/com/tpmp/testprep/config/DataInitializerTest.java`
- Modify: `frontend/src/components/layout/AdminLayoutShell.tsx`
- Create: `frontend/src/components/layout/AdminLayoutShell.test.tsx`
- Modify: `frontend/src/data/tableComments.ts`
- Modify: `docs/project-overview.md`
- Modify: `docs/db-guidelines.md`
- Modify: `docs/history/back/adm/AdminInit_Modified.md`
- Modify: `docs/history/back/adm/AdminEmailTemplate_Modified.md`
- Modify: `docs/history/front/adm/AdminLayout_Modified.md`
- Modify: `docs/history/front/adm/AdminEmailTemplate_Modified.md`
- Modify: `docs/agent-handoff/CURRENT.md`

**Interfaces:**
- Consumes: `/admin/email-templates`, DB 관리자 메뉴 시드, `MenuConfig`, Task 1 SQL, Tasks 1–6 전체 기능.
- Produces: 글로벌 관리자 메뉴 `이메일 템플릿 관리`, `url=/admin/email-templates`, `iconKey=email`, `displayOrder=15`; 최신 DB 문서와 최종 검증 스냅샷.

- [ ] **Step 1: 메뉴 시드와 페이지 제목 실패 테스트를 작성한다**

```java
@Test
void createsGlobalEmailTemplateAdminMenu() throws Exception {
    initializer.run();
    verify(menuConfigRepository).save(argThat(menu ->
            menu.getMenuType() == MenuConfig.MenuType.ADMIN
            && "이메일 템플릿 관리".equals(menu.getName())
            && "/admin/email-templates".equals(menu.getUrl())
            && "email".equals(menu.getIconKey())
            && menu.getDisplayOrder() == 15));
}
```

```tsx
it('이메일 템플릿 경로에 글로벌 메뉴와 페이지 제목을 표시한다', async () => {
  mockPathname('/admin/email-templates');
  mockMenus([{ id: 15, name: '이메일 템플릿 관리', url: '/admin/email-templates',
    iconKey: 'email', displayOrder: 15, menuType: 'ADMIN', isActive: true, children: [] }]);
  render(<AdminLayoutShell><div>본문</div></AdminLayoutShell>);
  expect(await screen.findByRole('link', { name: /이메일 템플릿 관리/ })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '이메일 템플릿 관리' })).toBeInTheDocument();
});
```

- [ ] **Step 2: 메뉴 테스트 실패를 확인한다**

Run:

```powershell
cd backend
.\gradlew.bat test --tests "com.tpmp.testprep.config.DataInitializerTest"
cd ..\frontend
npm test -- --watch=false src/components/layout/AdminLayoutShell.test.tsx
```

Expected: FAIL because menu seed, icon mapping, title test are absent.

- [ ] **Step 3: 글로벌 메뉴·아이콘·DB 표 설명을 구현한다**

`DataInitializer`의 관리자 top-level menu seed에 `saveMenu(null, "이메일 템플릿 관리", "/admin/email-templates", "email", 15, MenuConfig.MenuType.ADMIN, "ADMIN")`를 멱등 추가한다. `AdminLayoutShell` icon map에 email 아이콘을 등록하고 `getPageTitle` fallback이 edit/new 경로에서도 `이메일 템플릿 관리`를 반환하게 한다. `frontend/src/data/tableComments.ts`에는 `email_templates: '이메일 템플릿'`, `email_template_bindings: '이메일 이벤트별 템플릿 연결'`을 추가한다.

- [ ] **Step 4: 메뉴 단위 테스트를 통과시킨다**

Run:

```powershell
cd backend
.\gradlew.bat test --tests "com.tpmp.testprep.config.DataInitializerTest"
cd ..\frontend
npm test -- --watch=false src/components/layout/AdminLayoutShell.test.tsx
```

Expected: both PASS; DataInitializer 재실행에서 같은 URL의 메뉴가 중복 생성되지 않는다.

- [ ] **Step 5: 프로젝트·DB 문서와 히스토리를 갱신한다**

`project-overview.md` 관리자 기능에 템플릿·이벤트 연결·문의 상태 알림 분리를 추가한다. `db-guidelines.md` 테이블 목록에 `email_templates`, `email_template_bindings`, `inquiry_email_deliveries.html_body`와 6상태 check를 기록한다. 네 history 파일에는 각 파일의 당일 다음 HIST ID를 상단에 추가한다. `CURRENT.md`는 구현 완료·검증 시작 전 hard checkpoint로 수정 파일, 커밋, SQL 선행 위험, 실행할 전체 명령을 기록한다.

- [ ] **Step 6: 독립 정적 검증을 수행한다**

정적 검증 담당자는 코드를 수정하지 않고 다음을 읽어 보고한다.

```text
Java/TypeScript raw type·any 신규 사용 없음
Controller → Service → Repository 계층 완결
모든 템플릿 API ADMIN 권한
HTML 저장·발송 이중 정화와 header injection 차단
연결 삭제 409 details 및 lock 순서
데이터 fetch 화면 Skeleton
RichContent 사용, dangerouslySetInnerHTML 없음
history ID·경로와 AGENTS shared interface 갱신
운영 SQL과 JPA 컬럼·enum·제약조건 일치
```

Expected: 차단 이슈 0건. 이슈가 있으면 해당 소유 Task 구현 단계로 되돌아가 수정하고 그 Task의 좁은 테스트부터 다시 실행한다.

- [ ] **Step 7: 백엔드 전체 테스트를 한 번 실행한다**

Run:

```powershell
cd backend
.\gradlew.bat test
```

Expected: `BUILD SUCCESSFUL`; 기존 356개 이상과 새 템플릿·상태·메일 테스트가 모두 통과한다.

- [ ] **Step 8: 프론트엔드 타입·전체 테스트·production build를 한 번 실행한다**

Run:

```powershell
cd frontend
npx tsc --noEmit
npm test -- --watch=false
npm run build
```

Expected: 모든 명령 exit code 0; Next.js가 `/admin/email-templates`, `/new`, `/[id]/edit` route를 빌드한다.

- [ ] **Step 9: 실제 PostgreSQL에 SQL을 두 번 적용해 멱등성을 검증한다**

운영과 같은 순서로 애플리케이션 기동 전에 실행한다.

```powershell
Get-Content docs/db-migration/20260831_01_admin_email_template_management.sql -Raw | docker compose -f docker-compose.local.yml exec -T db psql -v ON_ERROR_STOP=1 -U tpmp -d tpmp
Get-Content docs/db-migration/20260831_01_admin_email_template_management.sql -Raw | docker compose -f docker-compose.local.yml exec -T db psql -v ON_ERROR_STOP=1 -U tpmp -d tpmp
docker compose -f docker-compose.local.yml exec -T db psql -U tpmp -d tpmp -c "SELECT system_key, count(*) FROM email_templates WHERE system_key IS NOT NULL GROUP BY system_key ORDER BY system_key;"
docker compose -f docker-compose.local.yml exec -T db psql -U tpmp -d tpmp -c "SELECT event_code, count(*) FROM email_template_bindings GROUP BY event_code ORDER BY event_code;"
docker compose -f docker-compose.local.yml exec -T db psql -U tpmp -d tpmp -c "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname='inquiries_status_check';"
```

Expected: 두 적용 모두 오류 없음; system key와 event code가 각각 정확히 3행·count 1; constraint에 6개 상태가 모두 포함된다.

- [ ] **Step 10: unbind가 재기동에서 복구되지 않는지 실제 DB로 검증한다**

```powershell
docker compose -f docker-compose.local.yml exec -T db psql -U tpmp -d tpmp -c "DELETE FROM email_template_bindings WHERE event_code='INQUIRY_COMPLETED';"
cd backend
.\gradlew.bat bootRun
```

서버가 기동한 뒤 다른 터미널에서:

```powershell
docker compose -f docker-compose.local.yml exec -T db psql -U tpmp -d tpmp -c "SELECT count(*) FROM email_template_bindings WHERE event_code='INQUIRY_COMPLETED';"
```

Expected: count `0`; 기존 system template 때문에 seed runner가 관리자의 unbind를 복구하지 않는다. 검증 후 다음 명령으로 테스트 환경 설정을 복원한다.

```powershell
docker compose -f docker-compose.local.yml exec -T db psql -U tpmp -d tpmp -c "INSERT INTO email_template_bindings (event_code, template_id, created_at, updated_at) SELECT 'INQUIRY_COMPLETED', id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM email_templates WHERE system_key='INQUIRY_COMPLETED_DEFAULT' AND deleted_at IS NULL ON CONFLICT (event_code) DO UPDATE SET template_id=EXCLUDED.template_id, updated_at=CURRENT_TIMESTAMP;"
```

- [ ] **Step 11: 실제 API·메일 회귀를 수동 검증한다**

관리자 로그인 상태에서 순서대로 확인한다.

```text
1. 기본 3개 템플릿과 3개 연결이 보인다.
2. 현재 관리자 이메일로 HTML 테스트 메일을 보내고 request에 수신자 주소가 없음을 네트워크 탭에서 확인한다.
3. BUG_REPORT를 COMPLETED로 변경하면 기존 409 없이 상태가 저장되고, 관리자 메시지 수는 증가하지 않는다.
4. 활성 연결에서는 emailOutcome=QUEUED이고 delivery에 body와 htmlBody 스냅샷이 저장된다.
5. 연결 해제에서는 상태가 저장되고 SKIPPED_TEMPLATE_MISSING과 설정 링크가 표시된다.
6. 연결된 템플릿 비활성에서는 상태가 저장되고 SKIPPED_TEMPLATE_INACTIVE가 표시된다.
7. 사용자 답변 이메일은 ADMIN_MESSAGE plain text 경로와 타임라인 메시지를 유지한다.
8. 기존 NEW_INQUIRY, USER_MESSAGE, ADMIN_MESSAGE는 htmlBody=null이며 SimpleMailMessage 회귀가 없다.
```

Expected: 8개 항목 모두 충족; SMTP가 설정되지 않은 로컬에서는 QUEUED 후 FAILED 이력이 생겨도 문의 상태는 유지된다.

- [ ] **Step 12: diff·금지 패턴·작업 트리를 최종 확인한다**

Run:

```powershell
git diff --check
rg -n "dangerouslySetInnerHTML|no-explicit-any" frontend/src/app/admin/email-templates frontend/src/components/admin/EmailTemplate*.tsx frontend/src/components/ui/RichTextEditor.tsx
git status --short
```

Expected: `git diff --check` 출력 없음; 신규 email template 화면에 `dangerouslySetInnerHTML`과 신규 any가 없음; status에는 Task 7 경로만 남는다.

- [ ] **Step 13: 최종 검증 결과를 CURRENT와 history에 확정하고 Task 7을 커밋한다**

`CURRENT.md`에는 전체 backend/tsc/Jest/build 결과, PostgreSQL SQL 2회, 6상태 constraint, unbind 비복구, QUEUED/SKIPPED/HTML/plain 회귀 결과와 남은 이슈를 기록한다.

```powershell
git add backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java backend/src/test/java/com/tpmp/testprep/config/DataInitializerTest.java frontend/src/components/layout/AdminLayoutShell.tsx frontend/src/components/layout/AdminLayoutShell.test.tsx frontend/src/data/tableComments.ts docs/project-overview.md docs/db-guidelines.md docs/history/back/adm/AdminInit_Modified.md docs/history/back/adm/AdminEmailTemplate_Modified.md docs/history/front/adm/AdminLayout_Modified.md docs/history/front/adm/AdminEmailTemplate_Modified.md docs/agent-handoff/CURRENT.md
git commit -m "[INFRA] feat: 이메일 템플릿 메뉴와 운영 문서 반영"
git status --short
```

Expected: commit succeeds; 작업 트리가 clean이고 운영 적용 순서 `SQL → 애플리케이션`이 CURRENT와 DB 문서에 명시되어 있다.

---

## Execution Gate Summary

1. Task 0 커밋 없이는 Task 1을 시작하지 않는다. 기존 관리자 문의 검색 변경과 신규 기능의 검토 단위를 분리한다.
2. Task 1 SQL은 로컬 검증뿐 아니라 운영 배포의 선행 산출물이다. `ddl-auto=validate` 서버를 먼저 올리지 않는다.
3. 각 Task는 표시된 좁은 실패 테스트를 먼저 만들고 실제 실패를 확인한 뒤 최소 구현과 동일 범위 통과를 수행한다.
4. Task 7에서만 백엔드 전체 테스트와 프론트 전체 test/build를 각 1회 실행한다.
5. 실제 PostgreSQL 검증에서 SQL 2회 적용, 6상태 constraint, unbind 비복구를 확인하지 못하면 완료로 보고하지 않는다.
6. 커밋 또는 push 중에는 `CURRENT.md` checkpoint를 생략하거나 다른 작업을 섞지 않는다.
