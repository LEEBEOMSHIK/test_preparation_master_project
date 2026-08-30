## HIST-20260831-001

- **날짜**: 2026-08-31
- **수정 범위**: 사용자 백엔드 / 문의·요청 스키마 호환
- **수정 개요**: 앱 시작 시 현재 스키마의 `request_type`은 보존한 채, 같은 스키마에 존재하는 legacy `inquiry_type` 컬럼만 멱등적으로 제거하는 호환 migration runner를 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/config/InquirySchemaMigrationRunner.java` | 추가 | current schema가 일치하는 information_schema의 legacy 컬럼만 확인한 뒤 고정 DDL로 제거 |
| `backend/src/test/java/com/tpmp/testprep/config/InquirySchemaMigrationRunnerTest.java` | 추가 | 테스트별 고유 H2 DB에서 컬럼 제거, `request_type` 보존, 재실행 멱등성 및 다른 schema 동명 테이블 skip 검증 |

### 수정 상세

- 변경 전: 일부 로컬 PostgreSQL의 `inquiries.inquiry_type NOT NULL` legacy 컬럼이 Entity INSERT에 포함되지 않아 신규 버그 신고 등록 시 DataIntegrityViolationException이 발생하고 409로 변환됐다.
- 변경 후: 앱 시작 시 `LOWER(table_schema) = LOWER(CURRENT_SCHEMA())` 조건에서 `inquiry_type`가 존재할 때만 `ALTER TABLE inquiries DROP COLUMN inquiry_type`를 실행한다. 다른 schema의 동명 테이블은 건너뛰며, `request_type` 값은 조회·수정하지 않아 기존/신규 문의 유형 기준 데이터를 덮어쓰지 않는다.
- 이유: 현재 source of truth인 `request_type`으로 안전하게 통일해 legacy NOT NULL 제약으로 인한 등록 실패를 제거하기 위해서다.

### 복원 방법

`UserInquiry_Modified.md`의 HIST-20260831-001 복원 시 runner와 H2 통합 테스트를 제거한다. 운영 DB에서 이미 컬럼이 제거된 경우에는 복원 전 legacy 컬럼과 기존 데이터의 호환성 필요 여부를 별도 검토한다.

---

## HIST-20260828-006

- **날짜**: 2026-08-28
- **수정 범위**: 사용자 백엔드 / 문의·요청 데이터 호환·신규 DB 시드
- **수정 개요**: attachment 행이 없는 구형 문의의 `image_urls` 첨부를 복원하고, 빈 DB에서 문의 도메인이 콘텐츠 고정 ID를 선점하지 않도록 시드와 설치 순서를 안전하게 조정했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/InquiryService.java` | 수정 | attachment 우선, 비어 있으면 legacy `image_urls` 파싱 fallback |
| `backend/src/test/java/com/tpmp/testprep/service/InquiryServiceTest.java` | 수정 | TEXT-only legacy 첨부 상세 응답 회귀 테스트 추가 |
| `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java` | 수정 | 신규 DB에서 콘텐츠 도메인 로드 전 문의 도메인 시드 보류 |
| `backend/src/test/java/com/tpmp/testprep/config/DataInitializerTest.java` | 수정 | 빈 도메인 DB의 문의 시드 보류 계약 검증 |
| `docs/db-migration/20260828_01_extend_inquiry_workflow.sql` | 수정 | 빈 `domain_master`에서 문의 도메인 INSERT 생략, processing claim 컬럼 반영 |
| `docs/sql/README.md` | 수정 | baseline→delta→backend→content→delta→backend 6단계로 설치 안내 통일 |

### 수정 상세

- 변경 전: 상세 응답은 attachment 테이블만 조회해 기존 `image_urls`만 가진 문의의 이미지가 사라졌고, 빈 DB의 최초 델타가 문의 도메인 identity를 먼저 소비했다.
- 변경 후: attachment가 존재하면 정규화된 첨부 URL을 쓰고 없으면 쉼표 구분 legacy 값을 복원한다. 빈 DB의 델타와 최초 백엔드는 문의 도메인을 보류하고 콘텐츠 덤프 뒤 델타 재실행에서 기존 ID 이후에 최종 문의 도메인을 구성한다.
- 이유: 기존 문의 데이터 호환성과 콘텐츠 덤프의 고정 FK 의미를 동시에 보존하기 위해서다.

### 복원 방법

`UserInquiry_Modified.md`의 HIST-20260828-006 복원 시 legacy fallback과 빈 DB 시드 보류를 이전 구현으로 되돌린다. 운영 DB 롤백 전에는 domain master/slave와 문의 첨부 데이터를 백업하고, 고정 ID 충돌 여부를 별도 점검한다.

---

## HIST-20260828-005

- **날짜**: 2026-08-28
- **수정 범위**: 사용자 백엔드 / 문의·요청 워크플로 최종 통합
- **수정 개요**: 사용자 접수·목록·상세·대화·이미지 첨부와 관리자 알림 큐잉까지 전체 사용자 API 계약의 최종 상태를 이력에 보강했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/controller/UserInquiryController.java` | 수정 | 페이지 목록·상세·접수·메시지·이미지 업로드 API 제공 |
| `backend/src/main/java/com/tpmp/testprep/service/InquiryService.java` | 수정 | 사용자 소유권, 종료 상태 작성 차단, 첨부 연결과 알림 큐잉 적용 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/InquiryRequest.java` | 수정 | `requestType`·`targetArea`·`detailLocation`·`attachmentIds` 계약 적용 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/InquirySummaryResponse.java` | 추가 | 목록 전용 요약 DTO 분리 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/InquiryDetailResponse.java` | 추가 | 본문·첨부·대화 타임라인 상세 DTO 분리 |
| `backend/src/test/java/com/tpmp/testprep/service/InquiryServiceTest.java` | 수정 | 사용자 메시지·상태·첨부·목록 계약 회귀 검증 |

### 수정 상세

- 변경 전: 단일 `reply`와 구형 유형을 중심으로 목록·상세가 같은 응답을 공유했고, 후속 대화와 메시지 첨부를 표현할 수 없었다.
- 변경 후: 목록은 요약 DTO, 상세는 메시지 타임라인 DTO를 반환하며 열린 문의에만 사용자 메시지를 추가하고 업로더 소유권이 확인된 첨부 ID만 연결한다. 신규 접수와 사용자 메시지 알림은 업무 트랜잭션 커밋 후 발송 이력으로 처리한다.
- 이유: 사용자 업무 저장과 SMTP 실패를 분리하면서 문의 전 과정을 하나의 안전한 API 계약으로 제공하기 위해서다.

### 복원 방법

`UserInquiry_Modified.md`의 HIST-20260828-005 복원 시 사용자 Controller·Service·DTO를 이전 단일 응답/답변 계약으로 되돌리고 메시지·첨부·메일 이력 데이터는 별도 백업 후 복원한다.

---

## HIST-20260828-004

- **날짜**: 2026-08-28
- **수정 범위**: 사용자 백엔드 / 문의·요청
- **수정 개요**: 사용자 이메일을 사용자 상세 링크로 연결하고 접수 정보·안내 내용을 갖춘 일반 텍스트 본문으로 보강했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/InquiryEmailService.java` | 수정 | 수신 대상별 상세 URL과 접수 번호·유형·상태·안내 내용 본문 생성 |
| `backend/src/test/java/com/tpmp/testprep/service/InquiryEmailServiceTest.java` | 수정 | 사용자 상세 링크와 전체 본문 literal 계약 검증 |

### 수정 상세

#### `InquiryEmailService.java`
- 변경 전: 사용자 알림도 관리자 상세 URL을 사용하고, 제목·메시지 일부만 본문에 포함했다.
- 변경 후: 사용자 알림은 `/user/inquiries/{id}`로 연결하며 접수 번호, 유형, 제목, 현재 상태, 안내 내용과 상세 링크를 일반 텍스트로 제공한다.
- 이유: 사용자가 권한 없는 관리자 경로로 이동하지 않고 문의 맥락을 충분히 확인하게 하기 위해서다.

### 복원 방법

`UserInquiry_Modified.md`의 HIST-20260828-004 복원 시 사용자 수신 대상 URL 분기와 보강된 메일 formatter·테스트를 이전 형태로 되돌린다.

---

## HIST-20260828-003

- **날짜**: 2026-08-28
- **수정 범위**: 사용자 백엔드 / 문의·요청
- **수정 개요**: 신규 접수와 사용자 추가 메시지에 대한 관리자 이메일 알림 발송 이력 생성을 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/InquiryService.java` | 수정 | 신규 접수·사용자 메시지 저장 트랜잭션에서 관리자 알림을 큐잉 |
| `backend/src/main/java/com/tpmp/testprep/service/InquiryEmailService.java` | 추가 | 수신 설정을 읽어 PENDING 발송 이력과 커밋 후 이벤트를 생성 |
| `backend/src/main/java/com/tpmp/testprep/service/InquiryEmailDispatcher.java` | 추가 | 커밋 후 전용 실행기에서 SMTP 결과를 SENT/FAILED로 기록 |
| `backend/src/main/java/com/tpmp/testprep/entity/InquiryEmailDelivery.java` | 추가 | 발송 이력 상태·시도 횟수·오류·시각을 영속화 |

### 수정 상세

#### `InquiryService.java`
- 변경 전: 신규 접수와 사용자 메시지가 저장된 뒤 관리자 알림 이력이 생성되지 않았다.
- 변경 후: 같은 업무 트랜잭션에서 수신자별 PENDING 이력을 생성하고, 커밋 후 이벤트로 실제 SMTP 발송을 분리한다.
- 이유: SMTP 장애가 사용자 접수와 메시지 저장을 롤백하지 않도록 하기 위해서다.

### 복원 방법

`UserInquiry_Modified.md`의 HIST-20260828-003 복원 시 사용자 접수·메시지의 관리자 알림 큐잉과 관련 발송 이력 코드를 함께 되돌린다. 이미 생성된 발송 이력은 운영 데이터이므로 삭제 전 백업한다.

---

## HIST-20260828-002

- **날짜**: 2026-08-28
- **수정 범위**: 사용자 백엔드 / 문의·요청
- **수정 개요**: 문의 메시지 API와 첨부 업로더 소유권 검증을 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../InquiryService.java` | 수정 | 사용자 작성·메시지·상태 조회를 타임라인 모델로 교체 |
| `backend/.../AttachmentService.java` | 수정 | 업로더·참조유형·미연결·개수 검증 후 첨부 연결 |
| `backend/.../InquiryMessage.java` | 추가 | 양방향 메시지 영속 엔티티 |

### 수정 상세

#### `InquiryService.java`
- 변경 전: 단일 reply 컬럼을 전제로 답변을 처리했다.
- 변경 후: 초기 문의와 후속 메시지를 분리하고 종료 문의 작성·타인 첨부 연결을 거부한다.
- 이유: SQL 이관 후에도 답변과 첨부 소유권을 안전하게 보존하기 위해서다.

### 복원 방법

`UserInquiry_Modified.md`의 HIST-20260828-002 복원 시 메시지 API와 첨부 소유권 검증을 함께 되돌리고, 이관된 데이터는 백업에서 복구한다.

---

## HIST-20260828-001

- **날짜**: 2026-08-28
- **수정 범위**: 사용자 백엔드 / 문의·요청 도메인
- **수정 개요**: 접수 목적·상태 전이·발생 영역과 기존 문의 이관 기반을 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/Inquiry.java` | 수정 | `RequestType`, 확장 상태, 유형별 상태 전이·재열기와 발생 영역 필드를 추가 |
| `backend/src/main/java/com/tpmp/testprep/entity/Attachment.java` | 수정 | 문의 메시지 첨부 유형과 업로더 FK 모델을 추가 |
| `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java` | 수정 | 문의 유형·버그 발생 영역 도메인을 멱등 시드하도록 교체 |
| `docs/db-migration/20260828_01_extend_inquiry_workflow.sql` | 추가 | 기존 문의·답변을 새 접수 유형·SYSTEM 메시지로 이관하고 워크플로 스키마를 생성 |
| `docs/sql/README.md` | 수정 | 신규 워크플로 델타 적용 순서를 문서화 |

### 수정 상세

#### `Inquiry.java`
- 변경 전: 발생 영역과 처리형 종료 상태 없이 구형 `InquiryType`·답변 완료 상태만 사용했다.
- 변경 후: 일반 문의/기타는 `ANSWERED`, 처리형 요청은 `COMPLETED` 또는 `UNABLE_TO_PROCESS`만 종료 상태로 허용하고 종료 후 `IN_PROGRESS` 재열기를 지원한다.
- 이유: 접수 목적에 따라 올바른 처리 흐름을 강제하기 위해서다.

#### `20260828_01_extend_inquiry_workflow.sql`
- 변경 전: 기존 `inquiry_type`, 단일 reply 컬럼만 존재했다.
- 변경 후: `request_type`, 발생 영역, 대화 메시지, 업로더 연결과 기존 답변의 SYSTEM 메시지 이관을 추가했다.
- 이유: 기존 문의 데이터 손실 없이 양방향 문의·요청 기능으로 확장하기 위해서다.

### 복원 방법

이 `UserInquiry_Modified.md`의 HIST-20260828-001을 복원하려면 배포 전 백업 DB에서 문의 워크플로 델타를 되돌리고, `Inquiry`·`Attachment`·`DataInitializer`를 이전 도메인 모델로 되돌린다. 이미 이관된 메시지·발송 이력이 있는 운영 DB에서는 데이터 유실 위험이 있으므로 복원 전 별도 백업이 필요하다.

---

## HIST-20260512-002

- **날짜**: 2026-05-12
- **수정 범위**: 사용자 백엔드 / 1:1 문의 + 도메인
- **수정 개요**: 인증 사용자용 도메인 슬레이브 조회 API 추가, DataInitializer INQUIRY_CATEGORY 슬레이브 이름 enum 코드로 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/DomainService.java` | 수정 | `getSlavesByCode(String code)` 메서드 추가 |
| `backend/.../controller/DomainController.java` | 추가 | `GET /api/domains/slaves?code=` 엔드포인트 (인증 사용자 공통) |
| `backend/.../config/DataInitializer.java` | 수정 | INQUIRY_CATEGORY 슬레이브 이름을 한글 표시명 → InquiryType enum 코드로 변경 |
| `docs/sql/tpmp_dump.sql` | 수정 | domain_slave ID 12~16 이름을 enum 코드(EXAM/CONCEPT_NOTE/…)로 변경 |

### 수정 상세

#### `DomainService.java`
- `getSlavesByCode(String code)`: 코드로 master 조회 후 slave 목록 반환; master 없으면 `DOMAIN_NOT_FOUND` 예외

#### `DomainController.java` (신규)
- `GET /api/domains/slaves?code={code}` — `@RequestParam String code`로 `DomainService.getSlavesByCode` 호출
- `/api/admin/**` 가 아닌 `/api/domains/**` 경로 → `anyRequest().authenticated()` 적용 (일반 사용자 접근 가능)

#### `DataInitializer.java`
- 변경 전: `"시험", "개념노트", "데일리 퀴즈", "연습장", "기타"`
- 변경 후: `"EXAM", "CONCEPT_NOTE", "DAILY_QUIZ", "PRACTICE", "OTHER"` (InquiryType enum 코드 그대로 저장, FE에서 INQUIRY_TYPE_LABEL로 번역)

### 복원 방법

HIST-20260512-002 복원 시:
- `DomainService.java` — `getSlavesByCode` 메서드 제거
- `DomainController.java` — 파일 삭제
- `DataInitializer.java` — INQUIRY_CATEGORY 슬레이브를 한글 표시명으로 복원
- `tpmp_dump.sql` — domain_slave ID 12~16 이름 한글로 복원

---

## HIST-20260512-001

- **날짜**: 2026-05-12
- **수정 범위**: 사용자 백엔드 / 1:1 문의
- **수정 개요**: `InquiryType` enum에 `PRACTICE` 추가, `DataInitializer`에 CHECK 제약 자동 재생성 및 "문의 카테고리" 도메인 시딩 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../entity/Inquiry.java` | 수정 | `InquiryType` enum에 `PRACTICE` 추가 (DAILY_QUIZ 뒤, OTHER 앞) |
| `backend/.../config/DataInitializer.java` | 수정 | `fixInquiryTypeConstraint()` 메서드 추가, `run()`에서 호출; `ensureDomainMasterWithCode("INQUIRY_CATEGORY", ...)` 호출 추가 |
| `docs/sql/tpmp_dump.sql` | 수정 | `inquiries_inquiry_type_check` 제약 조건에 `'PRACTICE'` 추가, `domain_master` ID=4 "문의 카테고리" 추가, `domain_slave` ID 12~16 (시험·개념노트·데일리 퀴즈·연습장·기타) 추가, 시퀀스 값 갱신 |

### 수정 상세

#### `Inquiry.java`
- 변경 전: `public enum InquiryType { EXAM, CONCEPT_NOTE, DAILY_QUIZ, OTHER }`
- 변경 후: `public enum InquiryType { EXAM, CONCEPT_NOTE, DAILY_QUIZ, PRACTICE, OTHER }`

#### `DataInitializer.java`
- `fixInquiryTypeConstraint()` 신규 추가: `inquiries` 테이블의 `inquiry_type` CHECK 제약을 DROP 후 `PRACTICE` 포함 5개 값으로 재생성 (기동 시 자동 적용)
- `run()`에 `fixInquiryTypeConstraint()` 호출 추가 (fixQuestionTypeConstraints 직후)
- `run()`에 `ensureDomainMasterWithCode("INQUIRY_CATEGORY", "문의 카테고리", ...)` 추가 — 슬레이브: 시험/개념노트/데일리 퀴즈/연습장/기타 (이미 존재하면 건너뜀)

#### `tpmp_dump.sql`
- CHECK 제약 조건: `ARRAY[...'OTHER'...]` → `ARRAY[...'PRACTICE'::character varying, 'OTHER'...]`
- domain_master: ID=4 "문의 카테고리" 신규 추가 (시퀀스 3→4)
- domain_slave: ID 12~16 (시험/개념노트/데일리 퀴즈/연습장/기타, master_id=4) 추가 (시퀀스 11→16)

### 복원 방법

HIST-20260512-001 복원 시:
- `Inquiry.java` — `PRACTICE` enum 값 제거
- `DataInitializer.java` — `fixInquiryTypeConstraint()` 메서드 및 `run()` 호출 제거, `INQUIRY_CATEGORY` ensureDomainMasterWithCode 호출 제거
- `tpmp_dump.sql` — CHECK 배열에서 `'PRACTICE'::character varying` 제거, domain_master ID=4 행 제거, domain_slave ID 12~16 제거, 시퀀스 domain_master=3, domain_slave=11로 복원

---

## HIST-20260426-008

- **날짜**: 2026-04-26
- **수정 범위**: 사용자 백엔드 / 1:1 문의
- **수정 개요**: 이미지 URL 직접 처리 → 첨부파일 테이블(attachments) 연동으로 전환 — InquiryRequest.imageUrls → attachmentIds, InquiryService.uploadImage() → AttachmentService 위임, Controller 응답 `{url}` → `{id, url}`

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `dto/request/InquiryRequest.java` | 수정 | `imageUrls: List<String>` → `attachmentIds: List<Long>` |
| `dto/response/InquiryResponse.java` | 수정 | `fromWithUrls()` 정적 팩토리 추가, `from()`이 내부 위임하도록 변경 |
| `service/InquiryService.java` | 수정 | `AttachmentService` 주입, `uploadImage()` 반환 타입 `UploadResult` 레코드로 변경, `create()` attachmentIds 처리, `toResponse()` 첨부파일 테이블 우선 조회 |
| `controller/UserInquiryController.java` | 수정 | `uploadImage` 반환 타입 `Map<String,String>` → `Map<String,Object>`, 응답 `{url}` → `{id, url}` |

### 수정 상세

#### `dto/request/InquiryRequest.java`
- **변경 전**:
  ```java
  public record InquiryRequest(
          @NotBlank @Size(max = 200) String title,
          @NotBlank String content,
          @NotNull Inquiry.InquiryType inquiryType,
          @Size(max = 3) List<String> imageUrls
  ) {}
  ```
- **변경 후**:
  ```java
  public record InquiryRequest(
          @NotBlank @Size(max = 200) String title,
          @NotBlank String content,
          @NotNull Inquiry.InquiryType inquiryType,
          @Size(max = 3) List<Long> attachmentIds
  ) {}
  ```
- **이유**: 프론트엔드가 업로드 직후 받은 attachment ID를 전송, 서버는 ID로 첨부파일 테이블에서 조회·연결

#### `dto/response/InquiryResponse.java`
- **변경 전**: `from(Inquiry)` 단일 팩토리만 존재
  ```java
  public static InquiryResponse from(Inquiry inquiry) {
      List<String> urls = (inquiry.getImageUrls() != null && !inquiry.getImageUrls().isBlank())
              ? Arrays.stream(inquiry.getImageUrls().split(","))
                      .map(String::trim).filter(s -> !s.isEmpty()).toList()
              : Collections.emptyList();
      return new InquiryResponse(
              inquiry.getId(), inquiry.getTitle(), inquiry.getContent(),
              inquiry.getStatus().name(), inquiry.getInquiryType().name(), urls,
              inquiry.getReply(), inquiry.getRepliedAt(), inquiry.getCreatedAt(),
              inquiry.getUser().getId(), inquiry.getUser().getName());
  }
  ```
- **변경 후**: `fromWithUrls()` 정적 팩토리 추가, `from()`은 내부적으로 `fromWithUrls()` 호출
  ```java
  public static InquiryResponse from(Inquiry inquiry) {
      List<String> urls = (inquiry.getImageUrls() != null && !inquiry.getImageUrls().isBlank())
              ? Arrays.stream(inquiry.getImageUrls().split(","))
                      .map(String::trim).filter(s -> !s.isEmpty()).toList()
              : Collections.emptyList();
      return fromWithUrls(inquiry, urls);
  }

  public static InquiryResponse fromWithUrls(Inquiry inquiry, List<String> imageUrls) {
      return new InquiryResponse(
              inquiry.getId(), inquiry.getTitle(), inquiry.getContent(),
              inquiry.getStatus().name(), inquiry.getInquiryType().name(), imageUrls,
              inquiry.getReply(), inquiry.getRepliedAt(), inquiry.getCreatedAt(),
              inquiry.getUser().getId(), inquiry.getUser().getName());
  }
  ```
- **이유**: InquiryService.toResponse()에서 외부에서 구성한 imageUrls를 주입할 수 있도록 팩토리 분리

#### `service/InquiryService.java`
- **변경 전**:
  - `@Value("${app.upload.path}") private String uploadPath` 필드 존재
  - `ALLOWED_IMAGE_MIME` Set 상수 존재
  - `create()`: `request.imageUrls()`를 comma-join하여 `Inquiry.imageUrls` TEXT 필드에 저장
  - `uploadImage()`: 직접 파일 IO (UUID 파일명, `/uploads/images/` 저장, URL 반환)
  - `toResponse()`: `InquiryResponse.from(inquiry)` 단순 호출 (legacy TEXT 파싱)
  ```java
  public String uploadImage(MultipartFile image) {
      if (image.isEmpty()) throw new BusinessException(ErrorCode.INVALID_INPUT);
      String mime = image.getContentType();
      if (mime == null || !ALLOWED_IMAGE_MIME.contains(mime))
          throw new BusinessException(ErrorCode.UNSUPPORTED_FILE_TYPE);
      String origName = image.getOriginalFilename();
      String ext = (origName != null && origName.contains("."))
              ? origName.substring(origName.lastIndexOf('.') + 1).toLowerCase() : "jpg";
      String filename = UUID.randomUUID() + "." + ext;
      Path dest = Paths.get(uploadPath, "images", filename);
      try {
          Files.createDirectories(dest.getParent());
          image.transferTo(dest);
      } catch (IOException e) {
          throw new BusinessException(ErrorCode.FILE_PARSE_FAILED);
      }
      return "/uploads/images/" + filename;
  }
  ```
- **변경 후**:
  - `attachmentService` 의존성 주입 (`final AttachmentService attachmentService`)
  - `@Value`, `ALLOWED_IMAGE_MIME` 제거
  - `create()`: `attachmentIds`로 첨부파일 조회 → URL comma-join → `Inquiry.imageUrls` TEXT 저장 후, `linkAttachments()`로 attachments.refId 업데이트
  - `UploadResult(Long id, String url)` 내부 레코드 정의
  - `uploadImage()`: AttachmentService에 위임, `UploadResult` 반환
  - `toResponse()`: 첨부파일 테이블 우선 조회, 없으면 legacy TEXT 폴백
  ```java
  public record UploadResult(Long id, String url) {}

  @Transactional
  public UploadResult uploadImage(MultipartFile image) {
      Attachment attachment = attachmentService.saveImage(image, Attachment.RefType.INQUIRY);
      return new UploadResult(attachment.getId(), attachment.getFileUrl());
  }

  private InquiryResponse toResponse(Inquiry inquiry) {
      List<Attachment> attachments = attachmentService.findByRef(Attachment.RefType.INQUIRY, inquiry.getId());
      List<String> imageUrls;
      if (!attachments.isEmpty()) {
          imageUrls = attachments.stream().map(Attachment::getFileUrl).toList();
      } else if (inquiry.getImageUrls() != null && !inquiry.getImageUrls().isBlank()) {
          imageUrls = Arrays.stream(inquiry.getImageUrls().split(","))
                  .map(String::trim).filter(s -> !s.isEmpty()).toList();
      } else {
          imageUrls = List.of();
      }
      return InquiryResponse.fromWithUrls(inquiry, imageUrls);
  }
  ```

#### `controller/UserInquiryController.java`
- **변경 전**:
  ```java
  @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(
          @RequestPart("image") MultipartFile image) {
      String url = inquiryService.uploadImage(image);
      return ResponseEntity.ok(ApiResponse.success(Map.of("url", url)));
  }
  ```
- **변경 후**:
  ```java
  @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ApiResponse<Map<String, Object>>> uploadImage(
          @RequestPart("image") MultipartFile image) {
      InquiryService.UploadResult result = inquiryService.uploadImage(image);
      return ResponseEntity.ok(ApiResponse.success(Map.of("id", result.id(), "url", result.url())));
  }
  ```
- **이유**: 프론트엔드가 attachment ID를 저장해 두었다가 문의 등록 시 `attachmentIds`로 전송하기 위해 `id` 필드 추가

### 복원 방법

HIST-20260426-008 복원 시:
- `InquiryRequest.java`: `attachmentIds: List<Long>` → `imageUrls: List<String>` 복원
- `InquiryResponse.java`: `fromWithUrls()` 메서드 제거, `from()` 단독 팩토리로 복원 (URL 파싱 로직 `from()` 내부에 포함)
- `InquiryService.java`:
  - `attachmentService` 의존성 제거
  - `@Value("${app.upload.path}") private String uploadPath` + `ALLOWED_IMAGE_MIME` 상수 복원
  - `UploadResult` 레코드 제거
  - `uploadImage()` 직접 파일 IO 구현으로 복원 (위의 "변경 전" 코드)
  - `create()`: `request.attachmentIds()` → `request.imageUrls()` comma-join으로 복원
  - `toResponse()`: `InquiryResponse.from(inquiry)` 단순 호출로 복원
- `UserInquiryController.java`: `uploadImage()` 반환 타입 `Map<String,String>`, 응답 `Map.of("url", url)` 복원

---

## HIST-20260422-006

- **날짜**: 2026-04-22
- **수정 범위**: 사용자/관리자 백엔드 / 1:1 문의 + FAQ
- **수정 개요**: 1:1 문의 시스템 전면 구현(문의 유형·보류 상태·이미지 첨부) 및 FAQ 신규 도입

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/Inquiry.java` | 수정 | `InquiryType` enum 추가, `Status`에 `ON_HOLD` 추가, `imageUrls` 필드 추가, `toggleHold()` 메서드 추가 |
| `backend/src/main/java/com/tpmp/testprep/repository/InquiryRepository.java` | 수정 | `findByUserIdAndStatus` 메서드 추가 |
| `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java` | 수정 | `INQUIRY_ACCESS_DENIED`, `FAQ_NOT_FOUND` 코드 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/InquiryRequest.java` | 추가 | 문의 등록 요청 DTO (title, content, inquiryType, imageUrls) |
| `backend/src/main/java/com/tpmp/testprep/dto/request/InquiryReplyRequest.java` | 추가 | 관리자 답변 요청 DTO |
| `backend/src/main/java/com/tpmp/testprep/dto/response/InquiryResponse.java` | 추가 | 문의 응답 DTO (imageUrls 파싱, userId/userName 포함) |
| `backend/src/main/java/com/tpmp/testprep/service/InquiryService.java` | 추가 | 사용자/관리자 문의 CRUD + 이미지 업로드 |
| `backend/src/main/java/com/tpmp/testprep/controller/UserInquiryController.java` | 추가 | `/api/user/inquiries` — 목록·상세·등록·삭제·이미지 업로드 |
| `backend/src/main/java/com/tpmp/testprep/controller/AdminInquiryController.java` | 추가 | `/api/admin/inquiries` — 전체 목록·답변·보류 토글 |
| `backend/src/main/java/com/tpmp/testprep/entity/Faq.java` | 추가 | FAQ 엔티티 (question, answer, isActive, displayOrder) |
| `backend/src/main/java/com/tpmp/testprep/repository/FaqRepository.java` | 추가 | `findByIsActiveTrueOrderByDisplayOrderAscCreatedAtAsc` |
| `backend/src/main/java/com/tpmp/testprep/dto/request/FaqRequest.java` | 추가 | FAQ 등록/수정 요청 DTO |
| `backend/src/main/java/com/tpmp/testprep/dto/response/FaqResponse.java` | 추가 | FAQ 응답 DTO |
| `backend/src/main/java/com/tpmp/testprep/service/FaqService.java` | 추가 | 활성 FAQ 조회, 관리자 CRUD, 공개전환 |
| `backend/src/main/java/com/tpmp/testprep/controller/UserFaqController.java` | 추가 | `GET /api/user/faq` — 공개 FAQ 목록 |
| `backend/src/main/java/com/tpmp/testprep/controller/AdminFaqController.java` | 추가 | `/api/admin/faq` — 전체 목록·등록·수정·공개전환·삭제 |
| `backend/src/main/java/com/tpmp/testprep/config/SecurityConfig.java` | 수정 | CORS allowedMethods에 `PATCH` 추가 |

### 수정 상세

#### `Inquiry.java`
- 변경 전: `Status` = {PENDING, ANSWERED}, `imageUrls` 없음
- 변경 후: `InquiryType` enum {EXAM, CONCEPT_NOTE, DAILY_QUIZ, OTHER}, `Status` = {PENDING, ON_HOLD, ANSWERED}, `imageUrls TEXT` 필드, `toggleHold()` 메서드

#### `InquiryService.java`
- 변경 전: 파일 없음
- 변경 후:
  - `getMyInquiries(email, status, pageable)` — 본인 문의 목록 (상태 필터)
  - `create(request, email)` — 문의 등록, imageUrls comma-join
  - `delete(id, email)` — PENDING 상태만 삭제 허용
  - `uploadImage(file)` — /uploads/images 저장
  - `adminGetAll(status, pageable)`, `adminReply`, `adminToggleHold`

#### `Faq.java` (신규)
- question, answer, isActive, displayOrder 필드
- `toggleActive()`, `update()` 메서드

### API 엔드포인트 (신규)

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/user/inquiries` | 내 문의 목록 (상태 필터, 페이징) |
| GET | `/api/user/inquiries/{id}` | 내 문의 상세 |
| POST | `/api/user/inquiries` | 문의 등록 |
| DELETE | `/api/user/inquiries/{id}` | 문의 삭제 (PENDING만) |
| POST | `/api/user/inquiries/images` | 이미지 업로드 |
| GET | `/api/admin/inquiries` | 전체 문의 목록 |
| PUT | `/api/admin/inquiries/{id}/reply` | 답변 등록 (→ ANSWERED) |
| PATCH | `/api/admin/inquiries/{id}/hold` | 보류 토글 (PENDING↔ON_HOLD) |
| GET | `/api/user/faq` | 공개 FAQ 목록 |
| GET | `/api/admin/faq` | 전체 FAQ 목록 |
| POST | `/api/admin/faq` | FAQ 등록 |
| PUT | `/api/admin/faq/{id}` | FAQ 수정 |
| PATCH | `/api/admin/faq/{id}/toggle-active` | 공개 전환 |
| DELETE | `/api/admin/faq/{id}` | FAQ 삭제 |

### 복원 방법

HIST-20260422-006 복원 시:
- `Inquiry.java`에서 `InquiryType` 제거, `Status.ON_HOLD` 제거, `imageUrls` 제거, `toggleHold()` 제거
- `InquiryRepository.java`에서 `findByUserIdAndStatus` 제거
- `ErrorCode.java`에서 `INQUIRY_ACCESS_DENIED`, `FAQ_NOT_FOUND` 제거
- `InquiryRequest.java`, `InquiryReplyRequest.java`, `InquiryResponse.java`, `InquiryService.java`, `UserInquiryController.java`, `AdminInquiryController.java` 삭제
- `Faq.java`, `FaqRepository.java`, `FaqRequest.java`, `FaqResponse.java`, `FaqService.java`, `UserFaqController.java`, `AdminFaqController.java` 삭제
- `SecurityConfig.java` allowedMethods에서 `PATCH` 제거
