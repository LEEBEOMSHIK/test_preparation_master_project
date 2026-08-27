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
