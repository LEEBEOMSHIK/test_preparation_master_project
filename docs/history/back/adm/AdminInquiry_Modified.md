## HIST-20260830-001

- **날짜**: 2026-08-30
- **수정 범위**: 관리자 백엔드 / 문의 이메일 발송 이력 필터
- **수정 개요**: 문의 ID와 발송 상태를 함께 지정한 이력 조회에서 상태 조건이 무시되던 문제를 수정했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/repository/InquiryEmailDeliveryRepository.java` | 수정 | 문의 ID와 발송 상태를 함께 적용하는 최신순 조회 메서드 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/InquiryEmailService.java` | 수정 | 복합 조건을 우선 적용하고 단일 조건·전체 조회를 분리 |
| `backend/src/test/java/com/tpmp/testprep/service/InquiryEmailServiceTest.java` | 수정 | 문의 ID와 FAILED 상태의 복합 필터 회귀 테스트 추가 |
| `docs/qa/2026-08-30-recent-changes-verification-checklist.md` | 추가 | 최근 변경 5개 영역의 필수 회귀검증·권장 검증 및 결과 기록 양식 제공 |

### 수정 상세

- 변경 전: `inquiryId`와 `status`가 모두 전달되면 서비스가 문의 ID 단독 조회를 먼저 실행해 발송 상태 조건을 무시했다.
- 변경 후: 두 값이 모두 있으면 `findByInquiryIdAndStatusOrderByCreatedAtDesc`를 사용하고, 문의 ID만·상태만·조건 없음은 각각 기존 전용 조회를 사용한다. 사용자가 최근 변경사항을 직접 확인할 수 있도록 행동과 기대 결과 중심의 QA 체크리스트도 제공한다.
- 이유: 특정 문의의 실패 발송 이력을 조회할 때 다른 상태의 발송 이력이 섞이지 않도록 관리자 필터 계약을 보장하기 위해서다.

### 복원 방법

`AdminInquiry_Modified.md`의 HIST-20260830-001 복원 시 복합 Repository 메서드와 서비스의 첫 번째 복합 조건 분기를 제거하고, 회귀 테스트를 제거한다. 복원하면 문의 ID와 상태를 함께 조회할 때 상태 조건이 다시 무시된다.

---

## HIST-20260828-007

- **날짜**: 2026-08-28
- **수정 범위**: 관리자 백엔드 / 영속 이메일 복구·트랜잭션·보안 검증
- **수정 개요**: 커밋된 이메일 delivery의 프로세스 종료·executor 거부 유실을 영속 복구하고 실제 Spring 트랜잭션과 SecurityFilterChain으로 핵심 경계를 검증했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/InquiryEmailDelivery.java` | 수정 | 원자 선점 시각 `processing_started_at` 상태 추가 |
| `backend/src/main/java/com/tpmp/testprep/repository/InquiryEmailDeliveryRepository.java` | 수정 | 조건부 claim·claim 해제·queue reject 실패 기록 쿼리 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/InquiryEmailDeliveryProcessor.java` | 추가 | `REQUIRES_NEW` 선점·성공·실패·시작 복구 경계 분리 |
| `backend/src/main/java/com/tpmp/testprep/service/InquiryEmailDispatcher.java` | 수정 | AFTER_COMMIT executor enqueue와 거부 시 FAILED 기록 적용 |
| `backend/src/main/java/com/tpmp/testprep/service/InquiryEmailRecovery.java` | 추가 | ApplicationReadyEvent에서 stale PENDING sweep·재큐잉 |
| `backend/src/test/java/com/tpmp/testprep/service/InquiryEmailDeliveryProcessorTest.java` | 추가 | 단일 원자 선점·stale 해제·queue reject 영속 상태 검증 |
| `backend/src/test/java/com/tpmp/testprep/service/InquiryEmailDispatcherTest.java` | 수정 | enqueue/dispatch/거부 처리 계약 검증 |
| `backend/src/test/java/com/tpmp/testprep/service/InquiryEmailRecoveryTest.java` | 추가 | 시작 sweep 재큐잉 검증 |
| `backend/src/test/java/com/tpmp/testprep/service/InquiryEmailTransactionIntegrationTest.java` | 추가 | 실제 commit/rollback/SMTP 실패 통합 경계 검증 |
| `backend/src/test/java/com/tpmp/testprep/controller/InquiryControllerSecurityTest.java` | 수정 | 설정·delivery·retry API의 실제 401/403/ADMIN MockMvc 검증 |
| `docs/db-migration/20260828_01_extend_inquiry_workflow.sql` | 수정 | delivery processing claim 컬럼과 멱등 ALTER 반영 |

### 수정 상세

- 변경 전: AFTER_COMMIT 이벤트가 메모리 executor에 한 번만 전달되어 커밋 직후 종료나 queue 거부 시 PENDING이 영구 정체됐고, 테스트는 dispatcher 직접 호출과 annotation reflection에 머물렀다.
- 변경 후: PENDING 행을 조건부 update로 한 worker만 선점하고 시작 시 남은 claim을 해제해 재큐잉한다. executor 거부는 FAILED로 영속 기록한다. 실제 Spring 트랜잭션에서 commit만 발송하고 rollback은 미발송하며 SMTP 실패가 커밋된 문의를 되돌리지 않음을 검증했다. 관리자 신규 API도 실제 보안 체인에서 401/403/200을 검증한다.
- 이유: 알림 전달 실패가 조용히 영구 정체되지 않게 하고 명세의 트랜잭션·인가 경계를 실행 증거로 보장하기 위해서다.

### 복원 방법

`AdminInquiry_Modified.md`의 HIST-20260828-007 복원 시 processor/recovery를 제거하고 dispatcher·entity·repository·SQL을 이전 버전으로 되돌린다. 운영 DB의 `processing_started_at` 컬럼 제거 전 delivery 이력을 백업하며, 되돌린 뒤에는 PENDING 유실 복구 경로가 없어짐을 운영자에게 고지한다.

---

## HIST-20260828-006

- **날짜**: 2026-08-28
- **수정 범위**: 관리자 백엔드 / 문의·요청 관리 최종 통합
- **수정 개요**: 관리자 필터·대화·상태·수신 설정·메일 발송 이력 API와 대시보드 미처리 버그 집계를 전체 기능 기준으로 마무리했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/controller/AdminInquiryController.java` | 수정 | 서버 필터 목록·상세·메시지·상태 API 제공 |
| `backend/src/main/java/com/tpmp/testprep/service/InquiryService.java` | 수정 | 유형별 상태 전이, 종료 안내, 재열기와 관리자 메시지 처리 |
| `backend/src/main/java/com/tpmp/testprep/repository/InquiryRepository.java` | 수정 | 제목·본문·작성자명 keyword 필터와 열린 버그 상태 집계 계약 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/DashboardService.java` | 수정 | 미처리 버그를 BUG_REPORT의 PENDING/IN_PROGRESS/ON_HOLD 전체로 집계 |
| `backend/src/test/java/com/tpmp/testprep/service/DashboardServiceTest.java` | 추가 | 대시보드가 세 열린 상태를 정확히 조회하는지 검증 |
| `backend/src/main/java/com/tpmp/testprep/controller/AdminInquiryNotificationController.java` | 추가 | 관리자 수신 설정 GET/PUT API 제공 |
| `backend/src/main/java/com/tpmp/testprep/controller/AdminInquiryEmailDeliveryController.java` | 추가 | 발송 이력 조회와 FAILED 재발송 API 제공 |

### 수정 상세

- 변경 전: 대시보드의 미처리 버그 수는 `BUG_REPORT + PENDING`만 포함해 처리 중·보류 건을 누락했고, 관리자 계약은 구형 단일 답변/보류 동작에 의존했다.
- 변경 후: `countByRequestTypeAndStatusIn(BUG_REPORT, [PENDING, IN_PROGRESS, ON_HOLD])`로 모든 열린 버그를 집계한다. 관리자 목록 keyword는 바인딩 파라미터로 제목·본문·작성자명에 적용하며, 메시지·상태·설정·발송 이력은 각각 Controller→Service→Repository 경계를 유지한다.
- 이유: 관리자 대시보드와 목록의 미처리 기준을 실제 운영 상태와 일치시키고 메일 실패를 업무 데이터와 분리해 재처리하기 위해서다.

### 복원 방법

`AdminInquiry_Modified.md`의 HIST-20260828-006 복원 시 열린 버그 집계 메서드를 이전 단일 PENDING 조회로 되돌리고 관리자 대화·상태·설정·delivery API를 제거한다. 운영 발송 이력은 삭제 전 백업한다.

---

## HIST-20260828-005

- **날짜**: 2026-08-28
- **수정 범위**: 관리자 백엔드 / 문의·요청 목록 검색
- **수정 개요**: 관리자 문의·요청 목록에서 구조화 필터와 함께 제목·본문·작성자명 키워드를 서버에서 검색하도록 확장했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/controller/AdminInquiryController.java` | 수정 | 목록 API에 선택 `keyword` 파라미터 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/InquiryService.java` | 수정 | 공백 keyword를 null로, 입력 keyword를 trim 처리해 Repository에 전달 |
| `backend/src/main/java/com/tpmp/testprep/repository/InquiryRepository.java` | 수정 | 제목·본문·작성자명 대소문자 무시 부분 검색을 기존 필터 JPQL에 결합 |
| `backend/src/test/java/com/tpmp/testprep/service/InquiryServiceTest.java` | 수정 | keyword와 구조화 필터·pageable 결합 전달 검증 |

### 수정 상세

#### `InquiryRepository.java`
- 변경 전: 상태, 접수 유형, 발생 영역만 선택적으로 필터링했다.
- 변경 후: 바인딩된 `keyword`로 `title`, `content`, `user.name`을 대소문자 구분 없이 부분 검색한다.
- 이유: 관리자 화면의 제목·내용·작성자 검색을 전체 조회 없이 서버에서 수행하기 위해서다.

#### `InquiryService.java`
- 변경 전: 목록 서비스가 keyword를 받지 않았다.
- 변경 후: keyword의 바깥 공백을 제거하고 빈 값은 null로 정규화해 기존 필터와 함께 조회한다.
- 이유: 공백 검색을 전체 검색으로 처리하고 Repository 조건을 단순하게 유지하기 위해서다.

### 복원 방법

`AdminInquiry_Modified.md`의 HIST-20260828-005 복원 시 Controller·Service의 `keyword` 인자를 제거하고 `InquiryRepository.findAdminFiltered`를 기존 3개 구조화 필터 쿼리로 되돌리며 해당 서비스 테스트를 제거한다.

---

## HIST-20260828-004

- **날짜**: 2026-08-28
- **수정 범위**: 관리자 백엔드 / 문의·요청 관리
- **수정 개요**: 관리자 알림 본문을 보강하고 전역 수신 설정을 DB·서비스에서 고정 ID singleton으로 강제했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `docs/db-migration/20260828_01_extend_inquiry_workflow.sql` | 수정 | id=1 이외 기존 설정 정리·CHECK 제약·시퀀스 보정 |
| `backend/src/main/java/com/tpmp/testprep/repository/InquiryNotificationSettingsRepository.java` | 수정 | PostgreSQL ON CONFLICT singleton upsert 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/InquiryNotificationSettingsService.java` | 수정 | 고정 ID=1만 조회·저장 |
| `backend/src/main/java/com/tpmp/testprep/service/InquiryEmailService.java` | 수정 | 고정 설정 ID 조회와 관리자 상세 링크·접수 본문 생성 |
| `backend/src/test/java/com/tpmp/testprep/service/InquiryNotificationSettingsServiceTest.java` | 수정 | 고정 ID 조회와 upsert 호출 검증 |

### 수정 상세

#### `InquiryNotificationSettingsService.java`
- 변경 전: 첫 행을 조회하고 행이 없으면 일반 저장을 수행해 동시 최초 요청에서 다중 행이 생길 수 있었다.
- 변경 후: DB의 id=1 CHECK 제약과 `ON CONFLICT (id)` upsert를 사용한 뒤 id=1만 조회·갱신한다.
- 이유: 전역 수신 설정과 관리자 fan-out 결과를 단일하고 결정적으로 유지하기 위해서다.

### 복원 방법

`AdminInquiry_Modified.md`의 HIST-20260828-004 복원 시 id=1 singleton 제약·upsert·메일 본문 보강을 함께 이전 구현으로 되돌린다. 운영 DB는 설정 행을 정리하므로 복원 전 백업한다.

---

## HIST-20260828-003

- **날짜**: 2026-08-28
- **수정 범위**: 관리자 백엔드 / 문의·요청 관리
- **수정 개요**: 복수 수신 주소 설정, 발송 이력 조회, 실패 이메일 원자적 재발송과 사용자 선택 알림을 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/controller/AdminInquiryNotificationController.java` | 추가 | 관리자 전용 수신 설정 GET/PUT API |
| `backend/src/main/java/com/tpmp/testprep/controller/AdminInquiryEmailDeliveryController.java` | 추가 | 관리자 전용 이력 조회·실패 재발송 API |
| `backend/src/main/java/com/tpmp/testprep/service/InquiryNotificationSettingsService.java` | 추가 | 주소 trim/lowercase·중복 제거·최대 10개 검증 |
| `backend/src/main/java/com/tpmp/testprep/service/InquiryEmailService.java` | 추가 | 사용자 선택 알림, 실패 행 조건부 재발송 선점 |
| `backend/src/main/java/com/tpmp/testprep/service/InquiryService.java` | 수정 | 관리자 중간 답변·종료 시 `sendEmail` 선택값으로 사용자 알림 큐잉 |
| `backend/src/main/resources/application.yml` | 수정 | SMTP와 공개 URL 환경변수 기본값 추가 |

### 수정 상세

#### `InquiryEmailService.java`
- 변경 전: 관리자 답변·종료에 대한 선택적 사용자 메일과 실패 재발송 기능이 없었다.
- 변경 후: `sendEmail=true`일 때만 PENDING 이력을 생성하며 FAILED 행만 조건부 UPDATE로 PENDING 상태를 선점한다.
- 이유: 중복 발송을 막고 SMTP 실패를 업무 처리와 격리하기 위해서다.

### 복원 방법

`AdminInquiry_Modified.md`의 HIST-20260828-003 복원 시 관리자 알림 설정·발송 이력 API와 이메일 서비스 연결을 함께 되돌린다. SMTP 환경변수는 비워도 서버는 기동되지만, 기존 발송 이력은 운영 감사 데이터이므로 보존한다.

---

## HIST-20260828-002

- **날짜**: 2026-08-28
- **수정 범위**: 관리자 백엔드 / 문의·요청 관리
- **수정 개요**: 관리자 메시지와 상태 변경을 영속 타임라인 API로 교체했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../AdminInquiryController.java` | 수정 | 관리자 메시지·상태 변경 API 추가 |
| `backend/.../InquiryService.java` | 수정 | 종료 안내 메시지 저장 후 유형별 상태 전이 |
| `backend/.../InquiryMessageRepository.java` | 추가 | 시간순 메시지 조회 |

### 수정 상세

#### `InquiryService.java`
- 변경 전: 관리자 reply가 제거된 DB 컬럼에 의존했다.
- 변경 후: 모든 답변을 `inquiry_messages`에 저장하고 종료 상태는 안내 메시지를 필수로 한다.
- 이유: 답변 유실 없이 처리형 요청 상태를 관리하기 위해서다.

### 복원 방법

`AdminInquiry_Modified.md`의 HIST-20260828-002 복원 시 관리자 메시지·상태 API를 함께 되돌리고 DB 데이터는 백업에서 복구한다.

---

## HIST-20260828-001

- **날짜**: 2026-08-28
- **수정 범위**: 관리자 백엔드 / 문의·요청 관리 기반
- **수정 개요**: 처리형 요청 종료·재열기 상태 규칙과 관리자 문의 도메인 시드 기반을 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/Inquiry.java` | 수정 | 처리형 요청의 완료·처리 불가 종료와 관리자 재열기 상태 전이를 추가 |
| `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java` | 수정 | 문의·요청 관리 메뉴 명칭 및 신규 문의 도메인 시드를 반영 |
| `backend/src/test/java/com/tpmp/testprep/entity/InquiryWorkflowTest.java` | 추가 | 유형별 종료 상태와 재열기 전이를 검증 |
| `backend/src/test/java/com/tpmp/testprep/config/DataInitializerTest.java` | 수정 | 신규 문의 유형·버그 영역의 누락값 멱등 시드를 검증 |

### 수정 상세

#### `Inquiry.java`
- 변경 전: 관리자 답변은 모든 문의를 `ANSWERED`로 처리했고 `IN_PROGRESS` 재열기 상태가 없었다.
- 변경 후: 접수 유형에 맞는 종료 상태만 허용하고, 모든 종료 상태에서 `IN_PROGRESS`로 재열 수 있다.
- 이유: 관리자 처리형 요청을 일반 문의와 구분해 관리하기 위해서다.

#### `DataInitializer.java`
- 변경 전: 구형 `inquiry_type` CHECK 제약을 기동 때마다 재생성하고 구형 문의 카테고리만 시드했다.
- 변경 후: 제약 재생성을 제거하고 새 접수 유형 5개·버그 발생 영역 9개를 멱등 시드한다.
- 이유: SQL 이관에서 정의한 신규 스키마 제약을 애플리케이션 기동이 덮어쓰지 않게 하기 위해서다.

### 복원 방법

이 `AdminInquiry_Modified.md`의 HIST-20260828-001을 복원하려면 새 상태 전이와 문의 도메인 시드를 이전 구현으로 되돌리고, 이미 적용한 DB 이관은 백업에서 복구한다. 운영 DB는 메시지·알림 이력 손실 가능성이 있으므로 롤백 전 백업이 필요하다.

---

## HIST-20260804-002

- **날짜**: 2026-08-04
- **수정 범위**: 관리자 백엔드 / 대시보드 — 퀴즈 풀이 통계 추가
- **수정 개요**: 대시보드에 "시험"(exam) 통계는 있는데 "퀴즈"(데일리 퀴즈) 통계가 전혀 없다는 지적에 따라, 시험 통계와 동일한 패턴(오늘 카운트 + 일별 추이)으로 퀴즈 통계를 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/repository/QuizHistoryRepository.java` | 수정 | 관리자 대시보드용 `countByCreatedAtBetween`(파생 쿼리), `countDailyByCreatedAtBetween`(날짜별 집계, 전체 사용자 대상 — 기존 사용자별 집계 메서드들과 구분) 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/DashboardStatsResponse.java` | 수정 | `todayQuizAttemptCount` 필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/DashboardTrendResponse.java` | 수정 | `quizTrend` 필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/DashboardService.java` | 수정 | `getStats()`/`getTrend()`에 퀴즈 집계 반영, `QuizHistoryRepository` 의존성 추가 |

### 검증

- `./gradlew compileJava`/`./gradlew test` 통과.
- 실제로 퀴즈 문항 1개를 풀어 `todayQuizAttemptCount:1`, `quizTrend`의 오늘 날짜 `count:1` 정상 반영 확인 후 테스트 데이터 정리.

---

## HIST-20260804-001

- **날짜**: 2026-08-04
- **수정 범위**: 관리자 백엔드 / 대시보드 — 버그 신고 대기 건수 통계 추가
- **수정 개요**: 대시보드 문의 섹션이 유형 구분 없이 전체 문의 건수만 보여줘 버그 신고를 별도로 확인할 방법이 없다는 피드백에 따라, `DashboardStatsResponse`에 `pendingBugCount`(대기 상태 버그 신고 건수)를 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/repository/InquiryRepository.java` | 수정 | `countByStatusAndInquiryType(status, inquiryType)` 파생 쿼리 메서드 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/DashboardStatsResponse.java` | 수정 | `pendingBugCount` 필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/DashboardService.java` | 수정 | `getStats()`에서 `countByStatusAndInquiryType(PENDING, BUG)` 조회 후 응답에 반영 |

### 검증

- `./gradlew compileJava`/`./gradlew test` 통과.
- 백엔드 재기동 후 `GET /api/admin/dashboard/stats` 응답에 `pendingBugCount:1`(기존 테스트용 버그 신고 1건과 일치) 확인.

---

## HIST-20260803-001

- **날짜**: 2026-08-03
- **수정 범위**: 관리자·사용자 백엔드 공용 / 1:1 문의 — "버그 신고" 카테고리 추가
- **수정 개요**: 버그 리포트 전용 메뉴/기능을 새로 만들지 않고 기존 1:1 문의를 재사용하기로 하면서, 지금까지 버그 신고가 전부 "기타"로 뒤섞여 다른 잡다한 문의와 구분이 안 되던 문제를 해결하기 위해 `InquiryType`에 `BUG`를 추가했다. `INQUIRY_CATEGORY` 도메인 마스터는 이미 대부분 환경에 존재해 기존 `ensureDomainMasterWithCode`(마스터가 없을 때만 슬레이브 생성)로는 새 카테고리가 반영되지 않아, 기존 마스터에 슬레이브 하나만 채워 넣는 `ensureInquiryCategoryBugType()`을 신규 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/Inquiry.java` | 수정 | `InquiryType` enum에 `BUG` 추가 |
| `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java` | 수정 | `fixInquiryTypeConstraint()`의 CHECK 허용값에 `'BUG'` 추가(매 기동 시 DROP/재생성이라 기존 DB도 자동 반영). `ensureDomainMasterWithCode("INQUIRY_CATEGORY", ...)` 시드 배열에 `"BUG"` 추가(신규 DB용). 기존 마스터에 슬레이브만 보강하는 `ensureInquiryCategoryBugType()` 신규 추가 및 `run()`에 호출 추가 |

### 검증

- `./gradlew compileJava`/`./gradlew test` 통과.
- 백엔드 재기동 후 확인: `inquiries_inquiry_type_check`에 `BUG` 포함, `domain_slave`(INQUIRY_CATEGORY)에 `BUG` 신규 추가(로그 "문의 카테고리 'BUG' 신규 추가 완료").
- 브라우저 e2e: 사용자 화면에서 "버그 신고" 유형으로 문의 등록 → 관리자 화면(`/admin/inquiries`) 목록에 "버그 신고"로 정상 표시 확인.

---

## HIST-20260422-008

- **날짜**: 2026-04-22
- **수정 범위**: 관리자 백엔드 / 1:1 문의 관리
- **수정 개요**: 관리자 문의 삭제 API 추가 및 답변 재등록 지원

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/InquiryService.java` | 수정 | `adminDelete(id)` 메서드 추가 |
| `backend/.../controller/AdminInquiryController.java` | 수정 | `DELETE /api/admin/inquiries/{id}` 엔드포인트 추가 |

### 수정 상세

#### `InquiryService.java`
- 변경 전: `adminToggleHold` 이후 admin 관련 메서드 없음
- 변경 후: `adminDelete(id)` 추가 — 문의 단건 삭제
- 이유: 관리자가 문의를 삭제할 수 있어야 함

#### `AdminInquiryController.java`
- 변경 전: DELETE 엔드포인트 없음
- 변경 후: `DELETE /{id}` → `inquiryService.adminDelete(id)` 호출
- 이유: 관리자 문의 삭제 기능 제공

#### 답변 재등록
- `Inquiry.reply()` 메서드는 기존부터 ANSWERED 상태에서도 reply/repliedAt 덮어쓰기 가능
- 백엔드 변경 없음, 프론트엔드에서만 ANSWERED 일 때도 textarea 노출하도록 수정

### 복원 방법

`InquiryService.adminDelete()` 제거, `AdminInquiryController`의 DELETE 엔드포인트 제거.
