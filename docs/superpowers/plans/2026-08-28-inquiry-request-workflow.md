# 문의·요청 처리 및 이메일 알림 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 일반 문의와 처리형 요청의 상태를 분리하고, 양방향 대화·관리자 복수 이메일 알림·선택적 사용자 완료 알림을 제공한다.

**Architecture:** 기존 `Inquiry`와 API 경로를 유지하면서 접수 유형·발생 영역·메시지·메일 발송 이력을 정규화한다. 업무 트랜잭션은 발송 이력까지만 저장하고 SMTP는 커밋 후 비동기로 실행해 외부 장애가 접수 처리를 롤백하지 않게 한다.

**Tech Stack:** Spring Boot 3.3, Java 17, Spring Data JPA, Spring Mail, PostgreSQL 15, Next.js 14, TypeScript strict, Tailwind CSS, Jest.

**Spec:** `docs/superpowers/specs/2026-08-28-inquiry-request-workflow-design.md`

## Global Constraints

- 사용자/관리자 화면 명칭은 각각 `문의·요청`, `문의·요청 관리`다.
- 일반 문의·기타만 `ANSWERED`, 버그·시험 개설·기능 요청만 `COMPLETED` 또는 `UNABLE_TO_PROCESS`로 종료한다.
- 종료 전에는 양방향 다중 메시지를 허용하고, 종료 후 사용자는 작성할 수 없으며 관리자는 `IN_PROGRESS`로 다시 연다.
- 관리자에게는 신규 접수·사용자 메시지를 자동 알림하고, 사용자에게는 관리자가 `sendEmail=true`로 선택한 답변·종료만 알린다. 사용자 발송 체크의 기본값은 `false`다.
- SMTP 비밀정보는 환경변수에만 두고, SMTP 실패는 문의·메시지·상태 저장을 롤백하지 않는다.
- 첨부는 MIME·확장자·UUID 파일명·업로더 소유권을 검증하고 메시지당 3개로 제한한다.
- 목록·상세·설정 데이터 페칭 화면은 `src/components/ui/Skeleton.tsx`의 공통 Skeleton을 사용한다.
- 신규 API는 Controller → Service → Repository와 `ApiResponse<T>`를 지키고 관리자 API는 `@PreAuthorize("hasRole('ADMIN')")`를 적용한다.
- 기존 DB 델타와 베이스라인은 수정하지 않고 `20260828_01_extend_inquiry_workflow.sql`만 추가한다.
- 모든 생산 코드 변경은 실패 테스트를 먼저 확인한 뒤 최소 구현으로 통과시킨다.

---

### Task 1: DB 이관과 문의 도메인 상태 규칙

**Files:**
- Create: `docs/db-migration/20260828_01_extend_inquiry_workflow.sql`
- Create: `backend/src/test/java/com/tpmp/testprep/entity/InquiryWorkflowTest.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/entity/Inquiry.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/entity/Attachment.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java`
- Modify: `backend/src/test/java/com/tpmp/testprep/config/DataInitializerTest.java`
- Modify: `docs/sql/README.md`

**Interfaces:**
- Produces: `Inquiry.RequestType`, 확장된 `Inquiry.Status`, `Inquiry#isClosed()`, `Inquiry#changeStatus(Status)`, `Inquiry#reopen()`.
- Produces: `Attachment.RefType.INQUIRY_MESSAGE`와 첨부 업로더 FK.
- Consumes: 설계 명세 §3·§4의 유형·상태·기존 데이터 매핑.

- [ ] **Step 1: 상태 전이 실패 테스트 작성**

```java
@ParameterizedTest
@CsvSource({
    "GENERAL_INQUIRY,ANSWERED,true",
    "GENERAL_INQUIRY,COMPLETED,false",
    "BUG_REPORT,ANSWERED,false",
    "BUG_REPORT,COMPLETED,true",
    "EXAM_OPENING_REQUEST,UNABLE_TO_PROCESS,true"
})
void requestTypeControlsTerminalStatus(RequestType type, Status target, boolean allowed) {
    Inquiry inquiry = inquiry(type);
    assertThat(inquiry.canTransitionTo(target)).isEqualTo(allowed);
}
```

- [ ] **Step 2: 엔티티 테스트가 기존 enum·메서드 부재로 실패하는지 확인**

Run: `backend\gradlew.bat test --tests "com.tpmp.testprep.entity.InquiryWorkflowTest"`

Expected: `RequestType`, `canTransitionTo`, 신규 상태가 없어 컴파일 또는 assertion 실패.

- [ ] **Step 3: 도메인 최소 구현**

```java
public enum RequestType {
    GENERAL_INQUIRY, BUG_REPORT, EXAM_OPENING_REQUEST, FEATURE_REQUEST, OTHER;

    public boolean usesAnswerCompletion() {
        return this == GENERAL_INQUIRY || this == OTHER;
    }
}

public enum Status {
    PENDING, IN_PROGRESS, ON_HOLD, ANSWERED, COMPLETED, UNABLE_TO_PROCESS;

    public boolean isClosed() {
        return this == ANSWERED || this == COMPLETED || this == UNABLE_TO_PROCESS;
    }
}
```

`changeStatus`는 열린 상태 간 전이, 유형별 종료, 종료 상태에서 `IN_PROGRESS` 재열기만 허용하고 그 외에는 `INVALID_INQUIRY_STATUS_TRANSITION`을 던진다.

- [ ] **Step 4: 재실행 가능한 이관 SQL 작성**

SQL은 다음 순서를 고정한다: 신규 컬럼 추가 → 기존 유형/상태 변환 → `inquiry_messages` 및 기존 reply 이관 → reply 컬럼 제거 → 알림 설정/수신자/발송 이력 테이블 생성 → 체크 제약/인덱스 → 도메인·메뉴 시드. `BUG + ANSWERED`는 reply 이관 전에 `COMPLETED`로 변환하고 이관 메시지의 `author_role='SYSTEM'`, `author_id=NULL`을 보장한다.

- [ ] **Step 5: DataInitializer 멱등 시드 테스트와 구현**

`INQUIRY_CATEGORY`에는 `GENERAL_INQUIRY`, `BUG_REPORT`, `EXAM_OPENING_REQUEST`, `FEATURE_REQUEST`, `OTHER`를, `INQUIRY_BUG_AREA`에는 명세의 9개 영역 코드를 시드한다. 기존 `fixInquiryTypeConstraint()`는 제거해 신규 체크 제약을 덮어쓰지 않게 한다.

- [ ] **Step 6: 도메인·초기화 테스트 통과 확인**

Run: `backend\gradlew.bat test --tests "com.tpmp.testprep.entity.InquiryWorkflowTest" --tests "com.tpmp.testprep.config.DataInitializerTest"`

- [ ] **Step 7: DB 문서 갱신과 커밋**

Run: `git diff --check`

Commit: `[BE]_feat:_extend_inquiry_workflow_domain`

---

### Task 2: 양방향 메시지와 문의 API

**Files:**
- Create: `backend/src/main/java/com/tpmp/testprep/entity/InquiryMessage.java`
- Create: `backend/src/main/java/com/tpmp/testprep/repository/InquiryMessageRepository.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/request/InquiryMessageRequest.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/request/InquiryStatusUpdateRequest.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/response/InquirySummaryResponse.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/response/InquiryDetailResponse.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/response/InquiryMessageResponse.java`
- Create: `backend/src/test/java/com/tpmp/testprep/service/InquiryServiceTest.java`
- Create: `backend/src/test/java/com/tpmp/testprep/controller/InquiryControllerSecurityTest.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/dto/request/InquiryRequest.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/repository/InquiryRepository.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/service/InquiryService.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/service/AttachmentService.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/controller/UserInquiryController.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/controller/AdminInquiryController.java`
- Modify: `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java`

**Interfaces:**
- Consumes: Task 1의 `RequestType`, 상태 전이, `INQUIRY_MESSAGE` 첨부 유형.
- Produces: `POST /api/user/inquiries/{id}/messages`, `POST /api/admin/inquiries/{id}/messages`, `PATCH /api/admin/inquiries/{id}/status`.
- Produces: 목록은 `InquirySummaryResponse`, 상세는 `InquiryDetailResponse`와 시간순 `messages`를 반환한다.

- [ ] **Step 1: 서비스 실패 테스트 작성**

각 테스트는 다음 실제 결과를 검증한다: `BUG_REPORT` 영역 누락 거부, 시험 개설 영역 무시, 다른 사용자 접근 거부, 종료 접수 사용자 메시지 거부, 메시지 첨부가 메시지 ID에 연결, 관리자 답변 후 상태 미변경, 종료 안내가 메시지로 남고 상태가 변경됨.

- [ ] **Step 2: 실패 확인**

Run: `backend\gradlew.bat test --tests "com.tpmp.testprep.service.InquiryServiceTest"`

- [ ] **Step 3: 요청·응답 계약 구현**

```java
public record InquiryMessageRequest(
        @NotBlank String content,
        @Size(max = 3) List<Long> attachmentIds,
        boolean sendEmail
) {}

public record InquiryStatusUpdateRequest(
        @NotNull Inquiry.Status status,
        String message,
        boolean sendEmail
) {}
```

종료 상태에는 `message`를 필수로 검증한다. 사용자 메시지 요청에서는 `sendEmail` 값을 받지 않고 별도 사용자 DTO를 사용하거나 서버에서 무시해 사용자가 임의의 외부 발송을 만들 수 없게 한다.

- [ ] **Step 4: 서비스와 Repository 구현**

`InquiryMessageRepository.findByInquiryIdOrderByCreatedAtAscIdAsc`로 타임라인을 만든다. 첨부 연결 전에는 모든 ID가 현재 업로더·예상 refType·미연결 상태인지 확인하고 개수와 조회 개수가 다르면 `INVALID_INQUIRY_ATTACHMENT`를 반환한다.

- [ ] **Step 5: Controller와 실제 보안 체인 테스트 구현**

미인증 401, USER의 관리자 API 403, ADMIN 성공, 타 사용자 상세 403을 MockMvc로 확인한다.

- [ ] **Step 6: 선택 테스트 통과와 커밋**

Run: `backend\gradlew.bat test --tests "com.tpmp.testprep.service.InquiryServiceTest" --tests "com.tpmp.testprep.controller.InquiryControllerSecurityTest"`

Commit: `[BE]_feat:_add_inquiry_conversation_api`

---

### Task 3: 관리자 수신 설정과 트랜잭션 후 이메일 발송

**Files:**
- Create: `backend/src/main/java/com/tpmp/testprep/entity/InquiryNotificationSettings.java`
- Create: `backend/src/main/java/com/tpmp/testprep/entity/InquiryNotificationRecipient.java`
- Create: `backend/src/main/java/com/tpmp/testprep/entity/InquiryEmailDelivery.java`
- Create: `backend/src/main/java/com/tpmp/testprep/repository/InquiryNotificationSettingsRepository.java`
- Create: `backend/src/main/java/com/tpmp/testprep/repository/InquiryNotificationRecipientRepository.java`
- Create: `backend/src/main/java/com/tpmp/testprep/repository/InquiryEmailDeliveryRepository.java`
- Create: `backend/src/main/java/com/tpmp/testprep/service/InquiryNotificationSettingsService.java`
- Create: `backend/src/main/java/com/tpmp/testprep/service/InquiryEmailService.java`
- Create: `backend/src/main/java/com/tpmp/testprep/service/InquiryEmailDispatcher.java`
- Create: `backend/src/main/java/com/tpmp/testprep/event/InquiryEmailQueuedEvent.java`
- Create: `backend/src/main/java/com/tpmp/testprep/config/InquiryEmailAsyncConfig.java`
- Create: `backend/src/main/java/com/tpmp/testprep/controller/AdminInquiryNotificationController.java`
- Create: `backend/src/main/java/com/tpmp/testprep/controller/AdminInquiryEmailDeliveryController.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/request/InquiryNotificationSettingsRequest.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/response/InquiryNotificationSettingsResponse.java`
- Create: `backend/src/main/java/com/tpmp/testprep/dto/response/InquiryEmailDeliveryResponse.java`
- Create: `backend/src/test/java/com/tpmp/testprep/service/InquiryNotificationSettingsServiceTest.java`
- Create: `backend/src/test/java/com/tpmp/testprep/service/InquiryEmailServiceTest.java`
- Create: `backend/src/test/java/com/tpmp/testprep/service/InquiryEmailDispatcherTest.java`
- Create: service tests for settings, queueing and dispatch
- Modify: `backend/build.gradle`
- Modify: `backend/src/main/resources/application.yml`
- Modify: root `.env.example`, `.env.dev.example`, `.env.prod.example`, `docker-compose.yml`
- Modify: `backend/src/main/java/com/tpmp/testprep/service/InquiryService.java`

**Interfaces:**
- Consumes: Task 2의 접수/메시지/상태 동작.
- Produces: 관리자 설정 GET/PUT, 발송 이력 GET, 실패 재발송 POST.
- Produces: `queueAdminNotification(event, inquiry, message)`와 `queueUserNotification(event, inquiry, message, sendEmail)`.

- [ ] **Step 1: 이메일 정규화·큐잉·실패 테스트 작성**

주소는 `trim().toLowerCase(Locale.ROOT)`로 정규화하고 중복 제거 후 최대 10개를 허용한다. 활성 설정의 주소 0개는 실패한다. `sendEmail=false`는 사용자 delivery를 만들지 않으며, SMTP 예외는 delivery만 `FAILED`로 바꾸고 업무 데이터를 유지한다.

- [ ] **Step 2: 실패 확인**

Run: `backend\gradlew.bat test --tests "*InquiryNotificationSettingsServiceTest" --tests "*InquiryEmailServiceTest" --tests "*InquiryEmailDispatcherTest"`

- [ ] **Step 3: 설정·발송 이력·재발송 구현**

발송 상태는 `PENDING`, `SENT`, `FAILED`다. 재발송 Repository는 `FAILED`인 행만 조건부 update로 선점하며 결과가 1이 아니면 `INQUIRY_EMAIL_RETRY_NOT_ALLOWED`를 반환한다.

- [ ] **Step 4: 커밋 후 비동기 전송 구현**

```java
@Async("inquiryEmailExecutor")
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void handle(InquiryEmailQueuedEvent event) {
    dispatcher.dispatch(event.deliveryId());
}
```

`JavaMailSender` 호출은 별도 트랜잭션에서 수행하고 SMTP 호스트가 비어 있으면 delivery를 `FAILED`로 기록한다. 오류 저장값에서 계정·비밀번호·전체 stack trace를 제외하고 500자로 자른다.

- [ ] **Step 5: 환경설정과 API 구현**

Spring Mail 환경변수 8개와 `APP_PUBLIC_URL`을 기본값 포함으로 연결한다. SMTP 미설정이어도 애플리케이션 컨텍스트가 시작되어야 한다.

- [ ] **Step 6: 이메일 선택 테스트와 전체 백엔드 테스트 통과**

Run: `backend\gradlew.bat test`

Commit: `[BE]_feat:_add_inquiry_email_notifications`

---

### Task 4: 프론트 공통 계약과 사용자 문의·요청 화면

**Files:**
- Create: `frontend/src/lib/inquiry.ts`
- Create: `frontend/src/lib/inquiry.test.ts`
- Create: `frontend/src/components/ui/InquiryTimeline.tsx`
- Create: `frontend/src/components/ui/InquiryTimeline.test.tsx`
- Create: `frontend/src/components/ui/InquiryMessageComposer.tsx`
- Create: `frontend/src/components/ui/InquiryMessageComposer.test.tsx`
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/services/inquiryService.ts`
- Modify: `frontend/src/app/user/inquiries/page.tsx`
- Modify: `frontend/src/app/user/inquiries/new/page.tsx`
- Modify: `frontend/src/app/user/inquiries/[id]/page.tsx`
- Modify: `frontend/src/components/ui/BugReportModal.tsx`
- Modify: `frontend/src/components/layout/UserLayoutShell.tsx`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: Task 2·3의 API와 응답 계약.
- Produces: `isInquiryClosed`, `requiresTargetArea`, `usesTargetArea`, `getAllowedAdminStatuses`.
- Produces: 사용자 초기 접수·메시지 타임라인·후속 이미지 첨부 UI.

- [ ] **Step 1: 공통 규칙·타임라인·작성기 실패 테스트 작성**

```ts
expect(requiresTargetArea('BUG_REPORT')).toBe(true);
expect(getAllowedAdminStatuses('GENERAL_INQUIRY')).toContain('ANSWERED');
expect(getAllowedAdminStatuses('BUG_REPORT')).not.toContain('ANSWERED');
```

타임라인은 동일 시각이면 ID 순서, 역할 라벨, 첨부 링크를 검증한다. 관리자 작성기의 `사용자에게 이메일 알림 발송`은 초기 렌더에서 체크되지 않아야 한다.

- [ ] **Step 2: 실패 확인**

Run: `frontend\node_modules\.bin\jest frontend/src/lib/inquiry.test.ts frontend/src/components/ui/InquiryTimeline.test.tsx frontend/src/components/ui/InquiryMessageComposer.test.tsx`

- [ ] **Step 3: 타입·서비스·공통 컴포넌트 최소 구현**

```ts
export type InquiryRequestType =
  | 'GENERAL_INQUIRY'
  | 'BUG_REPORT'
  | 'EXAM_OPENING_REQUEST'
  | 'FEATURE_REQUEST'
  | 'OTHER';

export type InquiryStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'ANSWERED'
  | 'COMPLETED'
  | 'UNABLE_TO_PROCESS';
```

- [ ] **Step 4: 사용자 작성 화면 조건부 UI 구현**

버그 신고만 발생 영역을 필수로 검사한다. 시험 개설은 영역 필드를 숨기며, 상세 위치는 500자로 제한한다. 도메인 로딩 중에는 Skeleton을 사용하고 실패 시 명세의 코드 fallback을 사용한다.

- [ ] **Step 5: 사용자 목록·상세·빠른 버그 신고 전환**

상세는 초기 접수와 메시지를 타임라인으로 표시하고 열린 상태에만 작성기를 보인다. `BugReportModal`은 `BUG_REPORT`, 호출 화면별 `targetArea`, 현재 화면/문항을 `detailLocation`으로 전송한다.

- [ ] **Step 6: 선택 테스트·타입체크 통과와 커밋**

Run: `frontend\node_modules\.bin\jest frontend/src/lib/inquiry.test.ts frontend/src/components/ui/InquiryTimeline.test.tsx frontend/src/components/ui/InquiryMessageComposer.test.tsx`

Run: `frontend\node_modules\.bin\tsc --noEmit`

Commit: `[FE]_feat:_add_user_inquiry_request_conversation`

---

### Task 5: 관리자 처리 화면·설정·메일 이력과 통합 정리

**Files:**
- Create: `frontend/src/app/admin/inquiries/settings/page.tsx`
- Create: `frontend/src/app/admin/inquiries/[id]/page.test.tsx`
- Create: `frontend/src/app/admin/inquiries/settings/page.test.tsx`
- Modify: `frontend/src/app/admin/inquiries/page.tsx`
- Modify: `frontend/src/app/admin/inquiries/[id]/page.tsx`
- Modify: `frontend/src/components/layout/AdminLayoutShell.tsx`
- Modify: `frontend/src/services/inquiryService.ts`
- Modify: `backend/src/main/java/com/tpmp/testprep/service/DashboardService.java`
- Modify: `frontend/src/data/tableComments.ts`
- Modify: `docs/history/front/usr/UserInquiry_Modified.md`
- Modify: `docs/history/back/usr/UserInquiry_Modified.md`
- Modify: `docs/history/front/adm/AdminInquiryFaq_Modified.md`
- Modify: `docs/history/back/adm/AdminInquiry_Modified.md`
- Modify: `docs/agent-handoff/CURRENT.md`

**Interfaces:**
- Consumes: Task 3 delivery/settings API, Task 4 공통 타입·유틸·컴포넌트.
- Produces: 관리자 서버 필터 목록, 타임라인, 중간 답변, 유형별 상태 변경, 재열기, 실패 메일 재발송, 복수 수신 주소 설정.

- [ ] **Step 1: 관리자 이메일 기본값·상태 제한 실패 테스트 작성**

일반 문의에는 `ANSWERED`만, 처리형 요청에는 `COMPLETED`·`UNABLE_TO_PROCESS`만 종료 옵션으로 표시한다. 중간 답변과 종료 모달의 이메일 체크박스는 매번 기본 미선택이며 저장 성공 후 다시 미선택으로 초기화한다.

- [ ] **Step 2: 실패 확인**

Run: `frontend\node_modules\.bin\jest --runInBand --testPathPattern=admin/inquiries`

- [ ] **Step 3: 관리자 목록·상세 구현**

목록의 `size=10000` 클라이언트 필터를 제거하고 page/size/status/requestType/targetArea/keyword를 API params로 보낸다. 상세는 공통 타임라인과 작성기를 사용하고 종료 설명 필수, 재열기, 발송 이력 실패 재발송을 제공한다.

- [ ] **Step 4: 관리자 수신 설정 구현**

설정 화면은 최대 10개 주소, 공백/대소문자 중복, 이메일 형식을 클라이언트에서도 검증한다. 서버 오류는 `extractApiErrorMessage`로 표시하고 로딩은 공통 Skeleton을 사용한다.

- [ ] **Step 5: 숨은 연결 지점과 문서 정리**

관리자 대시보드의 `BUG` 집계를 `BUG_REPORT`와 열린 상태 집합으로 바꾸고, 메뉴 fallback과 테이블 코멘트를 갱신한다. 파일별 다음 HIST ID를 확인해 사용자/관리자·프론트/백엔드 네 history 파일 최상단에 기록하고 `CURRENT.md`를 최신 상태로 덮어쓴다.

- [ ] **Step 6: 전체 정적·동적 검증**

Run: `rg -n "InquiryType.BUG|inquiry.getReply|getRepliedAt|adminToggleHold|/reply|/hold" backend/src frontend/src`

Expected: 의도된 마이그레이션/문서 외 생산 코드 참조 0건.

Run: `backend\gradlew.bat test`

Run: `frontend\node_modules\.bin\tsc --noEmit`

Run: `npm test -- --watch=false`

Run: `npm run build`

- [ ] **Step 7: 최종 커밋**

Run: `git diff --check`

Commit: `[FE][BE]_feat:_complete_inquiry_request_workflow`
