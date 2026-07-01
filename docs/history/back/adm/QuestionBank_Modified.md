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
