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
