## HIST-20260707-003

- **날짜**: 2026-07-07
- **수정 범위**: 관리자 백엔드 / 문항(QuestionBank) — 문항번호 DB 문서 보정
- **수정 개요**: `question_bank.question_no` 마이그레이션 파일 상단에 목적/적용/롤백 주석을 추가하고, `docs/db-guidelines.md`의 `question_bank` ERD 및 주요 컬럼 설명에 `question_no`를 반영했다. 출처 그룹 컬럼 이해를 위해 `exam_year`, `exam_round`, `exam_type_id`, `instruction`도 ERD 요약에 함께 보강했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `docs/db-migration/20260707_01_question_bank_question_no.sql` | 수정 | 기존 마이그레이션 스타일에 맞춰 목적/적용/롤백 주석 추가 |
| `docs/db-guidelines.md` | 수정 | `question_bank` ERD와 주요 컬럼 코멘트에 `question_no` 및 관련 그룹 컬럼 설명 추가 |

### 수정 상세

- 변경 전: 마이그레이션 파일에 SQL만 있고 목적/적용/롤백 안내가 없었으며, DB 가이드의 `question_bank` 설명에 `question_no`가 누락되어 있었다.
- 변경 후: 운영 적용 전 확인할 수 있도록 주석을 추가하고, 문항번호 중복 기준이 되는 컬럼 설명을 문서화했다.
- 이유: DB 변경 사항을 운영 적용·롤백·관리자 DB 조회 문서와 일관되게 유지하기 위함.

### 복원 방법

이 ID(HIST-20260707-003)만으로 복원 시: `20260707_01_question_bank_question_no.sql` 상단 주석을 제거하고, `docs/db-guidelines.md`의 `question_no` 및 함께 추가한 `question_bank` 컬럼 설명 행을 제거한다.

## HIST-20260707-002

- **날짜**: 2026-07-07
- **수정 범위**: 관리자 백엔드 / 문항(QuestionBank) — 하이브리드 문항번호 저장·중복 검증·자동 부여
- **수정 개요**: `question_bank.question_no`에 대응하는 nullable `questionNo` 필드를 엔티티·요청 DTO·응답 DTO에 추가했다. 단건 등록·일괄 등록·수정에서 관리자가 입력한 문항번호를 우선 저장하고, 같은 `examTypeId + examYear + examRound + questionNo` 조합의 활성 문항이 있으면 `QUESTION_NO_DUPLICATE` 예외로 거부한다. 문항번호가 비어 있고 시험 그룹이 완전하면 같은 그룹의 `MAX(questionNo) + 1`을 자동 부여하며, 일괄 등록에서는 같은 요청 내 자동 번호를 순차 배정한다. DB 수동 적용용 마이그레이션 파일도 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/QuestionBank.java` | 수정 | nullable `questionNo` 필드와 builder/update 매핑 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionBankRequest.java` | 수정 | `@Positive Integer questionNo` 요청 필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionBankResponse.java` | 수정 | `questionNo` 응답 필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/repository/QuestionBankRepository.java` | 수정 | 그룹별 최대 문항번호 조회, 활성 중복 조회, 수정 자기 제외 중복 조회 JPQL 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java` | 수정 | 단건/수정/일괄 등록의 명시 번호 우선, 중복 검증, 자동 번호 부여 구현 |
| `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java` | 수정 | `QUESTION_NO_DUPLICATE` 추가 |
| `backend/src/test/java/com/tpmp/testprep/service/QuestionBankServiceTest.java` | 수정 | RED 확인 후 자동부여·명시번호·중복·수정 자기 제외·일괄 순차 부여 테스트 추가 |
| `docs/db-migration/20260707_01_question_bank_question_no.sql` | 추가 | `question_no` 컬럼, 양수 check, 활성·그룹완전·문항번호 non-null 부분 유니크 인덱스 |

### 수정 상세

- 변경 전: 문항은행에는 원본 시험지 문항번호 필드가 없어 `examYear`/`examRound`와 별개로 번호를 저장하거나 중복 검증할 수 없었다.
- 변경 후: `QuestionBank.questionNo`를 독립 필드로 저장하고, `questions.seq`는 재사용하지 않는다. 명시 번호는 우선 저장, 비어 있으면 시험 그룹이 완전한 경우에만 자동 부여한다.
- 이유: 시험지 내부 순서와 원본 시험 문항번호를 분리해 관리자 문항은행에서 출처 기준 정렬·중복 방지를 가능하게 하기 위함.

### 복원 방법

이 ID(HIST-20260707-002)만으로 복원 시: `QuestionBank`/`QuestionBankRequest`/`QuestionBankResponse`의 `questionNo` 필드와 매핑을 제거한다. `QuestionBankRepository`의 문항번호 조회 메서드 3개를 제거한다. `QuestionBankService`의 `resolveQuestionNo*`, `validateQuestionNo*`, `QuestionNoGroup`, `QuestionNoKey` 및 builder/update의 `questionNo` 전달을 제거한다. `ErrorCode.QUESTION_NO_DUPLICATE`를 제거하고, 테스트의 문항번호 관련 케이스를 삭제한다. 운영 DB에는 별도 역마이그레이션으로 인덱스/제약/컬럼을 제거한다.

## HIST-20260707-001

- **날짜**: 2026-07-07
- **수정 범위**: 관리자 백엔드 / 문항(QuestionBank) — 발문·내용 "둘 중 하나 필수" 규칙 통일
- **수정 개요**: 발문(instruction)과 문항 내용(content)의 필수 규칙을 통일했다. 기존에는 `content`에 `@NotBlank`가 걸려 있어 항상 필수였으나, CODE·스케줄링 유형처럼 발문+코드/표만으로도 문항을 구성할 수 있도록 `content`의 `@NotBlank`를 해제하고 대신 "발문 또는 내용 중 적어도 하나는 있어야 한다"는 규칙을 서비스단에서 검증한다. 둘 다 blank이면 신규 `QUESTION_BODY_REQUIRED` 예외로 저장을 거부한다. `content` DB 컬럼은 NOT NULL 제약이 유지되므로(운영 마이그레이션 불필요), null 입력 시 엔티티 저장 직전 빈 문자열로 coalesce한다. 기존에 내용만 있던 문항 데이터는 그대로 유효하다.
- **DB 컬럼 nullable 확인**: `docker exec tpmp-db psql -U tpmp -d tpmp -c "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='question_bank' AND column_name IN ('content','instruction');"` 결과 `content`는 `is_nullable = NO`(NOT NULL), `instruction`은 `YES`. 스키마 변경(마이그레이션) 대신 엔티티에서 null→"" coalesce 처리를 택함 — 컬럼 제약을 완화하는 것보다 안전하고 되돌리기 쉬우며, 운영 DB에 별도 마이그레이션 적용이 불필요하기 때문.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionBankRequest.java` | 수정 | `content` 필드에서 `@NotBlank` 제거(미사용된 `NotBlank` import도 삭제), `@Size(max=5000)`는 유지 |
| `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java` | 수정 | `QUESTION_BODY_REQUIRED(HttpStatus.BAD_REQUEST, "발문 또는 문항 내용 중 하나는 입력해야 합니다.")` 신규 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java` | 수정 | `createQuestion`/`createQuestionsBulk`(각 문항마다)/`updateQuestion` 3경로 모두에서 `validateSchedulingData` 옆에 신규 `validateBody(request)` private 메서드를 추가 호출 — 발문·내용 둘 다 blank면 `QUESTION_BODY_REQUIRED` 예외 |
| `backend/src/main/java/com/tpmp/testprep/entity/QuestionBank.java` | 수정 | `@Builder` 생성자·`update()` 메서드에서 `content == null ? "" : content`로 coalesce하여 DB NOT NULL 제약 위반 방지 |
| `backend/src/test/java/com/tpmp/testprep/service/QuestionBankServiceTest.java` | 수정 | `bodyRequestOf(content, instruction)` 헬퍼 추가 + 발문·내용 필수 규칙 테스트 3건 추가: (a) content blank + instruction 있음 → 저장 OK(content는 빈 문자열로 coalesce됨), (b) 둘 다 blank → `QUESTION_BODY_REQUIRED` 예외, (c) content 있음 + instruction blank → OK(회귀) |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionBankRequest.java`
- 변경 전: `content` 필드에 `@NotBlank(message = "문항 내용은 필수입니다.") @Size(max = 5000, ...)` — 항상 필수.
- 변경 후: `@NotBlank` 제거, `@Size(max = 5000, ...)`만 유지(선택 필드). 미사용된 `import jakarta.validation.constraints.NotBlank;`도 삭제.
- 이유: CODE·스케줄링처럼 발문(지시문)+코드/표만으로도 문항을 구성할 수 있게 하기 위함. 대신 "발문 또는 내용 중 하나 필수" 규칙은 서비스단에서 검증.

#### `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java`
- 변경 전: `QUESTION_BODY_REQUIRED` 없음.
- 변경 후: `SCHEDULING_DATA_INVALID` 다음에 `QUESTION_BODY_REQUIRED(HttpStatus.BAD_REQUEST, "발문 또는 문항 내용 중 하나는 입력해야 합니다.")` 추가.
- 이유: 발문·내용 필수 규칙 위반 시 전용 에러코드로 명확히 응답하기 위함.

#### `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java`
- 변경 전: `createQuestion`/`createQuestionsBulk`/`updateQuestion`에서 `validateSchedulingData`만 호출. 발문·내용 필수 규칙 없음.
- 변경 후: 3경로 모두에서 `validateSchedulingData` 다음에 `validateBody(request)`(bulk는 각 문항마다 `forEach`)를 추가 호출. `validateBody`는 `instruction`·`content`가 각각 null 또는 blank(trim 후 빈 문자열)인지 판정해 둘 다 blank이면 `BusinessException(ErrorCode.QUESTION_BODY_REQUIRED)`를 던진다.
- 이유: 발문·내용 "둘 중 하나 필수" 규칙을 한 곳(private 헬퍼)에서 일관되게 검증하기 위함(3경로 누락 방지).

#### `backend/src/main/java/com/tpmp/testprep/entity/QuestionBank.java`
- 변경 전: `@Builder` 생성자·`update()` 모두 `this.content = content;` — null이 그대로 들어오면 DB `NOT NULL` 제약(`content`) 위반으로 저장 실패.
- 변경 후: 두 곳 모두 `this.content = content == null ? "" : content;`로 coalesce.
- 이유: `content`가 이제 요청 DTO에서 선택 필드가 되어 null이 들어올 수 있으나, DB 컬럼은 여전히 NOT NULL(마이그레이션 없이 유지)이므로 저장 직전 빈 문자열로 안전하게 치환.

### 복원 방법
이 ID(HIST-20260707-001)만으로 복원 시: `QuestionBankRequest.content`에 `@NotBlank(message = "문항 내용은 필수입니다.")`를 다시 추가하고 `import jakarta.validation.constraints.NotBlank;`를 복원한다. `ErrorCode.QUESTION_BODY_REQUIRED` 항목을 제거한다. `QuestionBankService`의 3경로에서 `validateBody(request)` 호출과 `validateBody` 메서드 자체를 제거한다. `QuestionBank` 엔티티의 `content == null ? "" : content` coalesce를 `content`로 되돌린다. `QuestionBankServiceTest`에서 `bodyRequestOf` 헬퍼와 관련 테스트 3건을 제거한다.

## HIST-20260706-003

- **날짜**: 2026-07-06
- **수정 범위**: 관리자 백엔드 / 문항(QuestionBank) — 발문(지시문) 필드 신설
- **수정 개요**: 문항의 "다음 설명을 보고 알맞은 용어를 작성하시오." 같은 발문(지시문)을 문항 내용(content, 문제 본문)과 분리 저장하기 위해 `instruction` 컬럼을 신설했다. 모든 문항 유형 공용(선택) plain TEXT 필드이며 enum·CHECK 제약과 무관하다. 등록(단건/일괄)·수정 3개 경로 모두 반영. 범위는 QuestionBank(문제은행)까지이며 Question(시험지)/exam 풀이는 이번 범위가 아니다(후속 예정).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/QuestionBank.java` | 수정 | `instruction`(TEXT, nullable) 컬럼 추가, `@Builder` 생성자·`update()` 메서드 파라미터 마지막(`createdByUno`/`modifiedByUno` 직전)에 `instruction` 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionBankRequest.java` | 수정 | `content` 다음에 `@Size(max=1000) String instruction` 필드(선택) 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionBankResponse.java` | 수정 | `content` 다음에 `instruction` 필드 추가 + `from()` 매핑에 `qb.getInstruction()` 반영 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuizQuestionView.java` | 수정 | `content` 다음에 `instruction` 필드 추가 + `from()` 매핑에 `qb.getInstruction()` 반영 |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java` | 수정 | `createQuestion`/`createQuestionsBulk`/`updateQuestion` 3경로 모두 builder·`update()` 호출에 `instruction` 전달 |
| `backend/src/test/java/com/tpmp/testprep/service/QuestionBankServiceTest.java` | 수정 | `QuestionBankRequest` positional 생성자 헬퍼(`requestOf`)에 신규 `instruction`(null) 인자 위치 추가 |
| `docs/db-migration/20260706_02_question_bank_instruction.sql` | 추가 | `ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS instruction TEXT;` — dev/local은 ddl-auto=update 자동 반영, 운영은 기동 전 수동 적용 필요 |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/entity/QuestionBank.java`
- 변경 전: `content` 컬럼 바로 위에 발문 관련 필드 없음. `@Builder` 생성자·`update()` 파라미터에 `instruction` 없음.
- 변경 후: `content` 위에 `@Column(columnDefinition = "TEXT") private String instruction;` 추가. `@Builder` 생성자와 `update()` 메서드 모두 파라미터 목록 마지막(각각 `createdByUno`/`modifiedByUno` 직전)에 `String instruction`을 추가하고 필드 대입(`this.instruction = instruction;`)을 본문에 반영.
- 이유: 발문(지시문)을 문제 본문(content)과 분리 저장해 사용자 화면에서 시각적으로 구분 표시하기 위함.

#### `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionBankRequest.java`
- 변경 전: `content` 필드 다음이 바로 `questionType`.
- 변경 후: `content` 다음에 `@Size(max = 1000, message = "발문은 1000자를 초과할 수 없습니다.") String instruction` (선택, `@NotBlank` 없음) 추가.
- 이유: 등록/수정 요청에서 발문을 선택적으로 받기 위함.

#### `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionBankResponse.java`
- 변경 전: record 필드에 `instruction` 없음, `from()`도 매핑 없음.
- 변경 후: `content` 다음에 `String instruction` 필드 추가, `from()`에서 `qb.getInstruction()` 전달.
- 이유: 관리자 화면(목록/상세/수정 폼)에서 발문을 조회하기 위함.

#### `backend/src/main/java/com/tpmp/testprep/dto/response/QuizQuestionView.java`
- 변경 전: record 필드에 `instruction` 없음, `from()`도 매핑 없음.
- 변경 후: `content` 다음에 `String instruction` 필드 추가, `from()`에서 `qb.getInstruction()` 전달. 정답(answer)은 기존과 동일하게 계속 미노출.
- 이유: 퀴즈 화면에서 발문을 본문 위에 강조 표시하기 위함.

#### `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java`
- 변경 전: `createQuestion`/`createQuestionsBulk`(스트림 map)/`updateQuestion` 3곳 모두 builder·`update()` 호출에 `instruction` 전달 없음.
- 변경 후: 3곳 모두 `.instruction(request.instruction())`(또는 `req.instruction()`) / `update(...)` 호출 인자에 `request.instruction()`을 추가.
- 이유: 등록(단건/일괄)·수정 어느 경로로 저장해도 발문이 누락되지 않도록 함.

#### `backend/src/test/java/com/tpmp/testprep/service/QuestionBankServiceTest.java`
- 변경 전: `requestOf()` 헬퍼가 `QuestionBankRequest`를 15개 positional 인자로 생성(`content` 다음 바로 `type`).
- 변경 후: `content` 다음에 `null`(instruction) 인자를 추가해 필드 개수 증가에 맞춤.
- 이유: record에 필드가 추가되어 기존 positional 생성자 호출이 컴파일 실패하므로 테스트 헬퍼를 동기화.

#### `docs/db-migration/20260706_02_question_bank_instruction.sql`
- 변경 전: 파일 없음.
- 변경 후: `ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS instruction TEXT;` 신규 작성. 목적/롤백(`DROP COLUMN instruction`) 주석 포함.
- 이유: dev/local은 Hibernate `ddl-auto=update`로 자동 반영되지만 운영은 `ddl-auto=validate`라 기동 전 수동 DDL 적용이 필요함.

### 복원 방법
이 ID(HIST-20260706-003)만으로 복원 시: `QuestionBank.java`에서 `instruction` 필드·생성자/`update()` 파라미터를 제거, `QuestionBankRequest`/`QuestionBankResponse`/`QuizQuestionView`에서 `instruction` 필드와 관련 매핑을 제거, `QuestionBankService`의 3개 호출부에서 `instruction` 전달 인자를 제거, `QuestionBankServiceTest.requestOf()`에서 추가한 `null` 인자를 제거, `docs/db-migration/20260706_02_question_bank_instruction.sql` 파일을 삭제한다(단, 운영 DB에 이미 컬럼을 적용했다면 별도로 `DROP COLUMN instruction` 실행 필요).

## HIST-20260706-002

- **날짜**: 2026-07-06
- **수정 범위**: 관리자 백엔드 / 문항(QuestionBank) — SCHEDULING 저장 400 수정(CHECK 제약) + 검증 실패 로그
- **수정 개요**: SCHEDULING 유형 문항 저장 시 `question_bank.question_type` 컬럼의 기존 CHECK 제약(MULTIPLE_CHOICE/SHORT_ANSWER/OX/CODE만 허용)이 새 값 SCHEDULING을 막아 `DataIntegrityViolationException`(400)이 발생하던 문제 수정. Hibernate ddl-auto=update가 enum 컬럼의 기존 CHECK 제약을 자동 갱신하지 않는 것이 원인. 마이그레이션 SQL에 제약 재생성(SCHEDULING 포함)을 추가하고 dev DB에 즉시 적용. 아울러 `GlobalExceptionHandler.handleValidationException`이 검증 실패 사유(필드=메시지)를 로그로 남기도록 보강(향후 400 원인 진단 용이).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `docs/db-migration/20260706_01_question_bank_scheduling_data.sql` | 수정 | `question_bank_question_type_check` 제약을 DROP 후 SCHEDULING 포함 5개 값으로 재생성하는 DDL 추가(재실행 안전, `IF EXISTS`). 운영 배포 시 필수 적용 |
| `backend/src/main/java/com/tpmp/testprep/exception/GlobalExceptionHandler.java` | 수정 | `handleValidationException`에 `log.warn("Validation failed: 필드=메시지")` 추가 |

### 되돌림 방법

이 ID(HIST-20260706-002)로 복원 시: 마이그레이션 SQL에서 CHECK 제약 재생성 블록 제거(제약을 이전 4개 값으로 되돌리려면 별도 SQL 필요), GlobalExceptionHandler의 log.warn 라인 제거.

---

## HIST-20260706-001

- **날짜**: 2026-07-06
- **수정 범위**: 관리자 백엔드 / 문항(QuestionBank) — CPU 스케줄링 구조화 문항(SCHEDULING 유형) 신설
- **수정 개요**: 새 `QuestionType.SCHEDULING` 추가. 스케줄링 데이터(알고리즘·타임퀀텀·프로세스 목록)를 JSONB 컬럼 `scheduling_data` 하나에 구조화 저장(entity/support/SchedulingData.java 신규 record). 등록(단건/일괄)·수정 3개 경로 모두 schedulingData 반영 + RR/PRIORITY 계열 필수값 검증(SCHEDULING_DATA_INVALID). 채점은 SHORT_ANSWER와 동일한 콤마 다중값 비교로 라우팅(AnswerGrader). 자동 스케줄링 계산·채점은 하지 않음(정답 수동 입력).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/support/SchedulingData.java` | 추가 | `SchedulingAlgorithm`(FCFS/SJF/SRTF/PRIORITY_NON_PREEMPTIVE/PRIORITY_PREEMPTIVE/RR) enum + `ProcessRow`(pid,arrivalTime,burstTime,priority?) record + `SchedulingData`(algorithm,timeQuantum?,processes) record, Bean Validation 포함 |
| `docs/db-migration/20260706_01_question_bank_scheduling_data.sql` | 추가 | `question_bank.scheduling_data JSONB` 컬럼 추가 DDL (dev는 ddl-auto=update 자동 반영, 운영 수동 적용 필요) |
| `backend/src/main/java/com/tpmp/testprep/entity/QuestionBank.java` | 수정 | `QuestionType`에 `SCHEDULING` 추가; `schedulingData` 필드(@JdbcTypeCode JSONB, 기존 options 패턴과 동일) 추가; @Builder·update()에 schedulingData 파라미터 추가 |
| `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java` | 수정 | `SCHEDULING_DATA_INVALID(BAD_REQUEST)` 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionBankRequest.java` | 수정 | `@Valid SchedulingData schedulingData`(선택) 필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionBankResponse.java` | 수정 | `schedulingData` 필드 추가 + from() 매핑 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuizQuestionView.java` | 수정 | `schedulingData` 필드 추가 + from() 매핑 (정답은 계속 미노출) |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java` | 수정 | createQuestion/createQuestionsBulk/updateQuestion 3곳 모두 schedulingData 전달; private `validateSchedulingData(request)` 신규 — SCHEDULING 유형일 때만 schedulingData null 체크, RR은 timeQuantum>0, PRIORITY 계열은 모든 행 priority 필수 검증 |
| `backend/src/main/java/com/tpmp/testprep/service/support/AnswerGrader.java` | 수정 | `"SHORT_ANSWER".equals(questionType)` 분기에 `\|\| "SCHEDULING".equals(questionType)` 추가 — multiSetMatch로 동일 라우팅 |
| `docs/db-guidelines.md` | 수정 | question_bank ERD·컬럼 코멘트에 `scheduling_data JSONB nullable` 추가 |
| `frontend/src/data/tableComments.ts` | 수정 | question_bank.scheduling_data 코멘트 추가 |

### 수정 상세

#### `QuestionBank.java`
- 변경 전: `enum QuestionType { MULTIPLE_CHOICE, SHORT_ANSWER, OX, CODE }`; schedulingData 필드 없음
- 변경 후: `enum QuestionType { MULTIPLE_CHOICE, SHORT_ANSWER, OX, CODE, SCHEDULING }`; `@JdbcTypeCode(SqlTypes.JSON) @Column(name="scheduling_data", columnDefinition="jsonb") private SchedulingData schedulingData;` 추가, @Builder·update() 마지막 도메인 파라미터로 추가

#### `QuestionBankService.java`
- 변경 전: create/createBulk/update 3곳 builder·update 호출에 schedulingData 없음; 검증 로직 없음
- 변경 후: 3곳 모두 `.schedulingData(request.schedulingData())` / `qb.update(..., request.schedulingData(), adminId)` 전달; 각 메서드 진입 시 `validateSchedulingData(request)`(bulk는 `.forEach`) 호출

#### `AnswerGrader.java`
- 변경 전: `if ("SHORT_ANSWER".equals(questionType)) return multiSetMatch(...)`
- 변경 후: `if ("SHORT_ANSWER".equals(questionType) || "SCHEDULING".equals(questionType)) return multiSetMatch(...)` — SHORT_ANSWER 기존 동작 영향 없음

### 마이그레이션 SQL 경로
`docs/db-migration/20260706_01_question_bank_scheduling_data.sql`

롤백:
```sql
ALTER TABLE question_bank DROP COLUMN scheduling_data;
```

### 복원 방법
이 ID(HIST-20260706-001)만으로 복원 시:
- DB: 롤백 SQL 실행(scheduling_data 컬럼 DROP)
- `entity/support/SchedulingData.java`: 파일 삭제
- `QuestionBank.java`: QuestionType에서 SCHEDULING 제거, schedulingData 필드·builder/update 파라미터 제거
- `ErrorCode.java`: SCHEDULING_DATA_INVALID 제거
- `QuestionBankRequest.java`/`QuestionBankResponse.java`/`QuizQuestionView.java`: schedulingData 필드·매핑 제거
- `QuestionBankService.java`: schedulingData 전달·validateSchedulingData() 제거
- `AnswerGrader.java`: `|| "SCHEDULING".equals(questionType)` 제거
- `docs/db-guidelines.md`/`frontend/src/data/tableComments.ts`: scheduling_data 코멘트 제거

## HIST-20260701-001

- **날짜**: 2026-07-01
- **수정 범위**: 관리자 백엔드 / 문항 AI 분석 결과 영속화 — ai_* 컬럼 추가, 즉시저장 API(PATCH), 등록·수정 시 ai 필드 포함
- **수정 개요**: question_bank 테이블에 ai_keywords/ai_domains/ai_difficulty/ai_summary 4컬럼 추가(JSONB·TEXT). 수정 화면 "분석 시작" 후 PATCH /api/admin/questions/{id}/analysis 즉시저장. 문항 등록·수정 submit 시에도 ai 필드 함께 저장. 재분석 시 덮어쓰기 보장.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `docs/db-migration/20260701_02_question_bank_ai_analysis.sql` | 추가 | ai_keywords JSONB, ai_domains JSONB, ai_difficulty VARCHAR(10), ai_summary TEXT 컬럼 추가 DDL |
| `backend/src/main/java/com/tpmp/testprep/entity/QuestionBank.java` | 수정 | ai* 필드 4개 추가(@JdbcTypeCode JSONB·TEXT); @Builder에 4필드 추가; update()에 4파라미터 추가; updateAnalysis() 신규(ai 4컬럼만 갱신) |
| `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionBankRequest.java` | 수정 | aiKeywords/aiDomains/aiDifficulty/aiSummary optional 필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionBankResponse.java` | 수정 | aiKeywords/aiDomains/aiDifficulty/aiSummary 필드 추가 + from() 매핑 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionAnalysisSaveRequest.java` | 추가 | PATCH 즉시저장 전용 record(keywords@NotNull, domains@NotNull, difficulty@NotBlank, summary) |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java` | 수정 | createQuestion/createQuestionsBulk/updateQuestion에 ai 4필드 반영; saveAnalysis() 신규 @Transactional 메서드 |
| `backend/src/main/java/com/tpmp/testprep/controller/AdminQuestionController.java` | 수정 | PATCH /{id}/analysis 엔드포인트 추가; QuestionAnalysisSaveRequest import 추가 |

### 마이그레이션 SQL 경로
`docs/db-migration/20260701_02_question_bank_ai_analysis.sql`

롤백:
```sql
ALTER TABLE question_bank DROP COLUMN ai_keywords, ai_domains, ai_difficulty, ai_summary;
```

### 수정 상세

#### `QuestionBank.java`
- 변경 전: 필드 title·examYear·examRound·content·questionType·category·examType·options·answer·code·language·explanation
- 변경 후: 위 필드 유지 + aiKeywords(JSONB)·aiDomains(JSONB)·aiDifficulty(VARCHAR10)·aiSummary(TEXT) 추가. @JdbcTypeCode(SqlTypes.JSON)+@Column(columnDefinition="jsonb") 패턴은 기존 options 필드와 동일. @Builder/update()에 4파라미터 추가. updateAnalysis(keywords,domains,difficulty,summary,modifiedByUno) 신규 — ai 4컬럼+updateAudit만 갱신.

#### `QuestionBankRequest.java`
- 변경 전: 12필드(title~explanation)
- 변경 후: aiKeywords/aiDomains/aiDifficulty/aiSummary 4필드 추가(검증 없음, 모두 선택)

#### `QuestionBankResponse.java`
- 변경 전: 17필드
- 변경 후: aiKeywords/aiDomains/aiDifficulty/aiSummary 4필드 추가 + from(qb) 매핑 추가

#### `QuestionAnalysisSaveRequest.java` (신규)
- keywords: @NotNull List<String>
- domains: @NotNull List<String>
- difficulty: @NotBlank String
- summary: String

#### `QuestionBankService.java`
- createQuestion: builder에 .aiKeywords/.aiDomains/.aiDifficulty/.aiSummary 추가
- createQuestionsBulk: 각 req.ai*() 호출 추가
- updateQuestion: qb.update()에 4파라미터 추가
- saveAnalysis(Long id, QuestionAnalysisSaveRequest req, String adminEmail): 신규 @Transactional 메서드. findActive → updateAnalysis → from 반환. 재분석 호출 시 기존값 덮어씀.

#### `AdminQuestionController.java`
- 변경 전: GET/POST(bulk)/PUT/DELETE + analyze/regenerate 6엔드포인트
- 변경 후: PATCH /{id}/analysis 추가. @PreAuthorize 클래스 레벨 유지. QuestionAnalysisSaveRequest import 추가.

### 복원 방법
이 ID(HIST-20260701-001)만으로 복원 시:
- DB: 롤백 SQL 실행(ai_* 4컬럼 DROP)
- QuestionBank.java: ai* 4필드 제거, @Builder/update() 파라미터 제거, updateAnalysis() 제거
- QuestionBankRequest.java: ai 4필드 제거
- QuestionBankResponse.java: ai 4필드 제거, from() 매핑 4줄 제거
- QuestionAnalysisSaveRequest.java: 파일 삭제
- QuestionBankService.java: builder/update의 ai 파라미터 제거, saveAnalysis() 제거, import 제거
- AdminQuestionController.java: PATCH 엔드포인트 제거, import 제거
