## HIST-20260717-003

- **날짜**: 2026-07-17
- **수정 범위**: 관리자 백엔드 / 구조화 문항 검증·100문항 백필 안전장치 보완
- **수정 개요**: 문제은행과 수동 시험지 문항이 동일한 SCHEDULING·SQL 구조 검증기를 사용하도록 공통화하고, 100문항 백필의 전체 건수·source 연결·과거 이력 불변 검증을 강화했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `backend/src/main/java/com/tpmp/testprep/service/support/StructuredQuestionValidator.java` | 추가 | RR quantum·priority·SQL 테이블/결과 정합성 공통 검증 |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java` | 수정 | 기존 구조 검증을 공통 검증기로 위임 |
| `backend/src/main/java/com/tpmp/testprep/service/ExamService.java` | 수정 | 원본 없는 수동 시험지 문항에도 동일 검증 적용 |
| `backend/src/test/java/com/tpmp/testprep/service/ExamServiceStructuredQuestionTest.java` | 추가 | 수동 SCHEDULING·SQL 저장 검증 회귀 테스트 |
| `docs/db-migration/20260717_03_backfill_all_exam_question_sources.sql` | 수정 | 100건·source·ExamHistoryDetail checksum 사전/사후 검증 |

### 수정 상세

- SQL/SCHEDULING 구조 검증의 중복 구현을 제거하고 두 저장 경로의 정책 차이를 없앴다.
- 백필 전후 대상 시험 전체 100건, 정확한 source 100건, 미연결·중복 0건을 검증하며 과거 제출 이력 전체 행 JSON checksum이 달라지면 롤백한다.

---

## HIST-20260717-002

- **날짜**: 2026-07-17
- **수정 범위**: 관리자 백엔드 / 전체 기출 100문항 원본 동기화·구조화 유형 확장
- **수정 개요**: 시험지 문항도 문제은행과 동일하게 SCHEDULING·SQL을 지원하고, 시험유형까지 포함한 구조화 키로 후보를 제한했다. 5개 시험지 100행을 제자리 동기화하는 검증·롤백형 SQL을 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `backend/src/main/java/com/tpmp/testprep/entity/Question.java` 외 | 수정 | 구조화 JSONB 스냅샷·6종 유형·TEXT 정답 지원 |
| `backend/src/main/java/com/tpmp/testprep/service/ExamQuestionSyncService.java` 외 | 수정 | SCHEDULING·SQL 동기화 및 examTypeId 후보 키 적용 |
| `docs/db-migration/20260717_02_expand_question_structured_types.sql` | 추가 | 구조화 컬럼·TEXT·CHECK DDL |
| `docs/db-migration/20260717_03_backfill_all_exam_question_sources.sql` | 추가 | 100행 명시 매핑·원본 보정·사전/사후 검증 |
| `backend/src/test/java/com/tpmp/testprep/service/ExamQuestionSyncServiceTest.java` | 수정 | 시험유형 키와 구조화 유형 동기화 회귀 테스트 |

### 수정 상세

- 기존 questions PK/seq는 유지하고, 활성 응시 세션이 있으면 세션 삭제 없이 전체 백필을 중단한다.
- 2024년 3회 ID 81~100과 2026년 1회 ID 6·15의 문항번호, 2026년 1회 4번 정답을 보정하며 2025년 2회 20번 정답 원문을 검증한다.
- 이유: 5개 기출 시험지의 100문항을 동일한 원본 스냅샷 정책으로 완결하고 미래 SQL 문항도 손실 없이 동기화하기 위함.

---

## HIST-20260717-001

- **날짜**: 2026-07-17
- **수정 범위**: 관리자 백엔드 / 시험지 문항 원본 연결·동기화
- **수정 개요**: `Question`을 QuestionBank 원본의 출제 스냅샷으로 유지하고 GET sync-preview/POST sync API를 신규 서비스·Repository 계층으로 구현했다. 자동 전파 없이 행을 제자리 갱신하며, 정답 승인·활성 세션·지원 유형·후보 유일성 가드를 적용했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `backend/src/main/java/com/tpmp/testprep/entity/Question.java` | 수정 | 원본 링크·instruction 및 명시적 syncFrom 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/ExamService.java` | 수정 | 원본을 재조회해 신뢰 가능한 스냅샷 생성 |
| `backend/src/main/java/com/tpmp/testprep/service/ExamQuestionSyncService.java` | 추가 | 미리보기·선택 적용·안전 가드 구현 |
| `backend/src/main/java/com/tpmp/testprep/controller/AdminExamController.java` | 수정 | sync-preview/sync API 추가 |
| `backend/src/main/java/com/tpmp/testprep/repository/QuestionRepository.java` 외 | 수정 | 원본 fetch, 구조화 유일 후보, 실제 만료시각 기반 활성 세션 조회, Exam 행 잠금 |
| `backend/src/test/java/com/tpmp/testprep/service/ExamQuestionSyncServiceTest.java` | 추가 | 실제 제목 5종 파싱·구조화 후보·0/복수 후보·미지원·세션 만료·정답 승인/보존·제자리 갱신 단위 테스트 |
| `docs/db-migration/20260717_01_add_question_source_sync.sql` | 추가 | 원본 FK와 instruction 컬럼 DDL |

### 수정 상세

- 변경 전: 시험지 문항은 원본 출처를 잃은 복사본이었고 클라이언트가 보낸 복사값을 그대로 저장했으며 원본 차이 확인·선택 반영 경로가 없었다.
- 변경 후: 원본 ID가 있으면 활성 QuestionBank를 서버에서 다시 읽어 스냅샷을 만들고, 동기화는 변경 필드·후보·위험 상태를 먼저 반환한다. 미연결 문항은 시험지 제목에서 단일 연도·단일 회차를 보수적으로 파싱한 뒤 `examYear+examRound+Question.seq`가 정확히 일치하는 활성 원본이 하나일 때만 후보로 제시한다. apply는 Exam 행 `PESSIMISTIC_WRITE` 잠금 후 실제 세션 만료시각을 재확인하며 SCHEDULING/SQL, 불확실 후보, 무확인 정답 변경을 차단한다.
- 이유: 클라이언트 변조와 응시 중 데이터 변경을 막고 원본/스냅샷 생명주기를 명확히 분리하기 위함.

### 복원 방법

이 ID(`AdminExamPaper_Modified.md` 기준 HIST-20260717-001)로 복원 시 신규 동기화 서비스/DTO/API/테스트를 제거하고 Question·ExamService·Repository·DDL 변경을 이전 상태로 되돌린다.

---

## HIST-20260707-001

- **날짜**: 2026-07-07
- **수정 범위**: 관리자 백엔드 / 시험지 관리 — 목록 기본 최신순 정렬
- **수정 개요**: `ExamService.getExams(Pageable)`에서 요청 Pageable에 sort가 없을 때 `createdAt DESC` 기본 정렬을 적용하도록 변경했다. 명시 sort가 포함된 요청은 기존 정렬을 그대로 유지한다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/ExamService.java` | 수정 | sort 없는 Pageable을 `PageRequest.of(page, size, Sort.by(DESC, "createdAt"))`로 변환 후 조회 |

### 수정 상세

- 변경 전: 관리자 시험지 목록 API가 sort 없는 Pageable을 그대로 Repository에 전달해 DB 기본 순서에 의존했다.
- 변경 후: sort가 없는 경우 최신 등록 시험지가 먼저 오도록 `createdAt DESC` 기본 정렬을 적용한다.
- 이유: 관리자 시험지 관리 목록에서 최근 등록한 시험지를 우선 확인할 수 있게 하기 위함.

### 복원 방법

이 ID(HIST-20260707-001)만으로 복원 시: `ExamService.getExams`에서 `effectivePageable` 생성 로직을 제거하고 기존처럼 `examRepository.findAllByDelYn("N", pageable)`을 호출하도록 되돌린다.

## HIST-20260626-001

- **날짜**: 2026-06-26
- **수정 범위**: 관리자 백엔드 / 시험지 관리 — getExamQuestions N+1 수정
- **수정 개요**: `getExamQuestions`가 `findByExamIdOrderBySeqAsc`(category LAZY) 를 사용하던 것을 기존 `findByExamIdOrderBySeqAscWithCategory`(LEFT JOIN FETCH category)로 교체하여 N+1 방지 및 categoryName 응답 보장

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/ExamService.java` | 수정 | `getExamQuestions` 내 조회 메서드를 fetch join 버전으로 교체 |

### 수정 상세

#### `service/ExamService.java`
- 변경 전: `questionRepository.findByExamIdOrderBySeqAsc(examId)` — category LAZY, N+1 발생
- 변경 후: `questionRepository.findByExamIdOrderBySeqAscWithCategory(examId)` — `LEFT JOIN FETCH q.category`, N+1 방지
- 이유: `open-in-view: false` 환경에서 트랜잭션 내부라 LazyInit 예외는 발생하지 않지만, category 건당 SELECT N+1이 발생했음. 이미 `QuestionRepository`에 fetch join 쿼리가 존재했으므로 재사용. categoryName이 `QuestionDetailResponse`에 정상 채워지는 것을 보장.

### 복원 방법
이 ID(HIST-20260626-001)로 복원 시 `ExamService.getExamQuestions`의 `findByExamIdOrderBySeqAscWithCategory` → `findByExamIdOrderBySeqAsc`로 되돌린다.

---

## HIST-20260619-001

- **날짜**: 2026-06-19
- **수정 범위**: 관리자 백엔드 / 시험지 관리 — PDF 포맷 기반 문항 분리 파서
- **수정 개요**: PDF rawText에서 문항 경계 패턴을 인식하여 문항별 ParsedQuestion으로 분리하는 PdfQuestionParser 구현 및 ExamService 연동

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/parser/ParsedQuestion.java` | 추가 | PDF 파싱 중간 표현 record (content, questionType, options, answer, explanation) |
| `backend/.../service/parser/PdfQuestionParser.java` | 추가 | 포맷 기반 파서 — 문항 경계 탐지·블록 분리·보기/정답/해설 추출 |
| `backend/.../service/ExamService.java` | 수정 | `parsePdfAndSaveQuestions` 교체 — 파서 연동, 폴백 로직, `buildAndSaveQuestions` 헬퍼, 길이 클램프 |
| `backend/.../service/parser/PdfQuestionParserTest.java` | 추가 | 순수 JUnit5 단위 테스트 (Spring 컨텍스트 없음, 10개 케이스) |

### 수정 상세

#### `service/parser/ParsedQuestion.java` (신규)
- 변경 전: 없음
- 변경 후: `record ParsedQuestion(String content, Question.QuestionType questionType, List<String> options, String answer, String explanation)` — Bean Validation 없는 순수 중간 표현
- 이유: 파서와 서비스 레이어 사이 결합 없는 데이터 전달 객체 필요

#### `service/parser/PdfQuestionParser.java` (신규)
- 변경 전: 없음
- 변경 후: `public List<ParsedQuestion> parse(String rawText)` 구현
  - 문항 경계: `^\s{0,2}(\d+)\.\s`, `^\s{0,2}문\s*(\d+)\.\s`, `^\s{0,2}제\s*(\d+)\s*문` 3패턴
  - 보기: 원문자(①~⑩), 괄호형((1)), 닫힌괄호형(1)) 중 블록 내 첫 발견 유형 고정
  - 정답/해설: `정답\s*[:：]\s*(.*)`, `해설\s*[:：]\s*(.*)` 라벨 추출
  - 블록 파싱 실패 시 RuntimeException 던지지 않고 skip + log.warn
- 이유: PDF 업로드 시 텍스트 전체를 단일 문항으로 저장하던 임시 로직 대체

#### `service/ExamService.java` (수정)
- 변경 전: `parsePdfAndSaveQuestions` — PDF 전체 텍스트를 단일 SHORT_ANSWER 1개로 저장
- 변경 후:
  1. rawText 빈 경우 → `saveFallbackQuestion()` (기존 단일 저장 로직 동일)
  2. `new PdfQuestionParser().parse(rawText)` 실행
  3. 결과 없으면 폴백, 있으면 `buildAndSaveQuestions()` 호출
  4. `buildAndSaveQuestions()`: content(5000), answer(2000), explanation(5000), option(1000) 클램프 후 `saveAll`
  5. blank content ParsedQuestion은 건너뜀 (NOT NULL 위반 방지)
  6. `clamp(String, int)` 정적 헬퍼 추가
- 이유: 단일 문항 임시 저장에서 다문항 자동 추출로 전환; addQuestionsBulk와 중복 없이 헬퍼로 분리

#### `service/parser/PdfQuestionParserTest.java` (신규)
- 변경 전: 없음
- 변경 후: 10개 케이스 — null/blank/패턴없음(빈 리스트), 원문자·괄호·닫힌괄호 보기(MULTIPLE_CHOICE·options 개수), 주관식(SHORT_ANSWER), 정답/해설 추출, 라벨없음→null, 문N. 패턴, 제N문 패턴, 다문항 분리, CRLF 처리
- 이유: 파서 로직은 정규식·분기가 복잡해 단위 테스트로 회귀 방지 필수

### 복원 방법

HIST-20260619-001 복원 시:
- `ParsedQuestion.java` 삭제
- `PdfQuestionParser.java` 삭제
- `PdfQuestionParserTest.java` 삭제
- `ExamService.java` 에서 `parsePdfAndSaveQuestions`를 아래 원본으로 교체, `saveFallbackQuestion`·`buildAndSaveQuestions`·`clamp` 메서드 제거, `@Slf4j` 제거, import 2줄(`ParsedQuestion`, `PdfQuestionParser`) 제거:
  ```java
  private int parsePdfAndSaveQuestions(Long examId, Path pdfPath, String originalName) {
      try (PDDocument doc = Loader.loadPDF(pdfPath.toFile())) {
          String text = new PDFTextStripper().getText(doc);
          Exam exam = getExamDetail(examId);
          int seq = questionRepository.maxSeqByExamId(examId) + 1;
          Question q = Question.builder()
                  .exam(exam).seq(seq).content(text.trim())
                  .questionType(Question.QuestionType.SHORT_ANSWER)
                  .answer("(파일 업로드 후 수동 입력 필요)")
                  .sourceFile(originalName).build();
          questionRepository.save(q);
          return 1;
      } catch (IOException e) {
          throw new BusinessException(ErrorCode.FILE_PARSE_FAILED);
      }
  }
  ```

---

## HIST-20260529-001

- **날짜**: 2026-05-29
- **수정 범위**: 관리자 백엔드 / 시험지 관리 — 시험지 데이터 생성 (코드 변경 없음)
- **수정 개요**: 등록된 문항 풀(question_bank 100건)을 회차별로 묶어 `POST /api/admin/exams/with-questions`로 시험지(Exam) 5개 생성

### 생성 데이터 요약

- **방식**: 문항을 (examYear, examRound)로 그룹화 → 회차별 시험지 1개, 문항 1~20번 순서(questionMode=SEQUENTIAL)
- **문항 매핑**: question_bank → QuestionRequest(content/questionType/options/answer/explanation/code/language) 복사. 표(`<table>`)·코드 본문 모두 보존
- **생성 결과**

| examId | 제목 | 문항 수 | 비고 |
|--------|------|---------|------|
| 1 | 2024년 3회 정보처리기사 실기 | 20 | CODE 9 / SHORT_ANSWER 11, 표 2 |
| 2 | 2025년 1회 정보처리기사 실기 | 20 | CODE 9 / SHORT_ANSWER 11, 표 3 |
| 3 | 2025년 2회 정보처리기사 실기 | 20 | CODE 9 / SHORT_ANSWER 11, 표 2 |
| 4 | 2025년 3회 정보처리기사 실기 | 20 | CODE 7 / SHORT_ANSWER 13 |
| 5 | 2026년 1회 정보처리기사 실기 | 20 | CODE 7 / SHORT_ANSWER 13 |

> 비고: 생성 직전 기존 시험지는 0건이었음. 문항 순서는 제목의 'N번'을 파싱해 오름차순 정렬함.

### 복원 방법

`DELETE /api/admin/exams/{id}` (id 1~5) — 소프트 삭제(exams.del_yn='Y'), 연결된 question 행은 cascade.

---

## HIST-20260502-001

- **날짜**: 2026-05-02
- **수정 범위**: 관리자 백엔드 / 시험지 관리
- **수정 개요**: `exams.del_yn` 컬럼 누락으로 인한 500 오류 수정 — columnDefinition에 DEFAULT 추가, `getExams()` lazy load 제거

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `entity/Exam.java` | 수정 | `del_yn` 컬럼에 `columnDefinition = "char(1) not null default 'N'"` 추가 |
| `service/ExamService.java` | 수정 | `getExams()` — lazy `exam.getQuestions().size()` → `questionRepository.countByExamId` COUNT 쿼리로 교체 |
| `service/ExamService.java` | 수정 | `updateExam()` — 동일하게 COUNT 쿼리 사용으로 변경 |

### 수정 상세

#### 원인

`Exam.java`에 `del_yn` 컬럼(NOT NULL)이 추가되었지만 `@Column` 어노테이션에 DEFAULT가 없었다.
- **로컬 프로파일** (`ddl-auto: update`): `exams` 테이블에 이미 데이터가 있으면 PostgreSQL이 NOT NULL 컬럼 추가를 거부 → `del_yn` 컬럼이 생성되지 않음 → `findAllByDelYn()` 실행 시 `column "del_yn" does not exist` → 500
- **도커 프로파일** (`ddl-auto: validate`): 스키마에 `del_yn` 컬럼이 없으면 Hibernate 기동 시 `SchemaManagementException` → 앱 시작 실패 → 전체 엔드포인트 500/502

메뉴 관리도 도커 프로파일에서 앱 기동 실패 시 동일하게 500 응답.

#### `entity/Exam.java`
- 변경 전: `@Column(name = "del_yn", nullable = false, length = 1)`
- 변경 후: `@Column(name = "del_yn", nullable = false, length = 1, columnDefinition = "char(1) not null default 'N'")`
- 이유: `ddl-auto: update` 시 기존 행이 있는 테이블에도 DEFAULT 'N'으로 컬럼이 추가될 수 있도록 함

#### `service/ExamService.java` — `getExams()`
- 변경 전: `.map(ExamSummaryResponse::from)` → `exam.getQuestions().size()` lazy 컬렉션 로드 (N+1)
- 변경 후: `.map(exam -> ExamSummaryResponse.from(exam, questionRepository.countByExamId(exam.getId())))`
- 이유: lazy 컬렉션 의존 제거, N+1 방지

#### `service/ExamService.java` — `updateExam()`
- 변경 전: `return ExamSummaryResponse.from(exam)` → `exam.getQuestions().size()` lazy 로드
- 변경 후: `int count = questionRepository.countByExamId(id); return ExamSummaryResponse.from(exam, count);`
- 이유: 일관성 확보

### 도커 환경 수동 조치 (validate 모드)

`ddl-auto: validate` 사용 시 아래 SQL을 DB에 직접 실행 후 백엔드를 재시작한다.

```sql
ALTER TABLE exams ADD COLUMN IF NOT EXISTS del_yn CHAR(1) NOT NULL DEFAULT 'N';
```

### 복원 방법

HIST-20260502-001 복원 시:
- `Exam.java`에서 `columnDefinition` 제거 → `@Column(name = "del_yn", nullable = false, length = 1)`으로 되돌림
- `ExamService.getExams()` → `.map(ExamSummaryResponse::from)` 으로 되돌림
- `ExamService.updateExam()` → `return ExamSummaryResponse.from(exam);` 으로 되돌림

---

## HIST-20260420-001

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 백엔드 / 시험지 관리
- **수정 개요**: 시험지 내 문항 목록 조회 및 문항 개별 제거 API 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| entity/Question.java | 수정 | `update()` 메서드 추가 |
| repository/QuestionRepository.java | 수정 | `findByExamIdOrderBySeqAsc()` 추가 |
| dto/response/QuestionDetailResponse.java | 추가 | 시험지 소속 문항 응답 DTO |
| service/ExamService.java | 수정 | `getExamQuestions()`, `removeQuestion()` 추가 |
| controller/AdminExamController.java | 수정 | `GET /{id}/questions`, `DELETE /{id}/questions/{questionId}` 추가 |

### 수정 상세

#### `entity/Question.java`
- 변경 전: `update()` 메서드 없음
- 변경 후: `update(content, questionType, options, answer, explanation, code, language)` 추가
- 이유: 시험지 문항 인라인 수정 지원을 위한 도메인 메서드 추가

#### `repository/QuestionRepository.java`
- 변경 전: `maxSeqByExamId`, `countByExamId` 만 존재
- 변경 후: `findByExamIdOrderBySeqAsc(Long examId)` 추가

#### `dto/response/QuestionDetailResponse.java`
- 변경 전: 없음
- 변경 후: `record(id, seq, content, questionType, options, answer, explanation, code, language)` + `from(Question)` 정적 팩토리

#### `service/ExamService.java` / `controller/AdminExamController.java`
- 변경 전: 시험지 내 문항 목록 조회·삭제 API 없음
- 변경 후:
  - `GET /api/admin/exams/{id}/questions` → `List<QuestionDetailResponse>`
  - `DELETE /api/admin/exams/{id}/questions/{questionId}` → 문항 단건 제거 (하드 삭제)

### 복원 방법

HIST-20260420-001 복원 시:
- `Question.java`에서 `update()` 메서드 제거
- `QuestionRepository.java`에서 `findByExamIdOrderBySeqAsc()` 제거
- `QuestionDetailResponse.java` 삭제
- `ExamService.java`에서 `getExamQuestions()`, `removeQuestion()` 제거
- `AdminExamController.java`에서 두 엔드포인트 제거

---

## HIST-20260419-015

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 백엔드 / 시험지 관리
- **수정 개요**: POST /with-questions 500 오류 수정 — question_type CHECK 제약 재생성, questionCount lazy 접근 제거

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| backend/.../config/DataInitializer.java | 수정 | fixQuestionTypeConstraints() 추가 (CODE 포함하도록 제약 재생성) |
| backend/.../service/ExamService.java | 수정 | createExamWithQuestions — `exam.getQuestions().size()` → `questions.size()` |

### 수정 상세

#### `DataInitializer.java` — `fixQuestionTypeConstraints()`
- 변경 전: question_type CHECK 제약이 최초 생성 당시 enum 값(MULTIPLE_CHOICE, SHORT_ANSWER, OX)만 허용
- 변경 후: `questions`, `question_bank` 양쪽 CHECK 제약을 DROP IF EXISTS → ADD 로 CODE 포함 재생성
- 이유: Hibernate ddl-auto:update 는 기존 CHECK 제약을 수정하지 않아 CODE 유형 INSERT 시 `questions_question_type_check` 위반 → 500 발생

#### `ExamService.createExamWithQuestions`
- 변경 전: `ExamSummaryResponse.from(exam, exam.getQuestions().size())` — 메모리 내 미반영 lazy 컬렉션 접근
- 변경 후: `questionCount = questions.size()` 지역 변수로 카운트 전달
- 이유: 저장 직후 in-memory 컬렉션이 빈 상태일 수 있어 0 반환 + 불필요한 SELECT 방지

### 복원 방법

HIST-20260419-015 복원 시:
- `DataInitializer.run()`에서 `fixQuestionTypeConstraints()` 호출 제거 및 메서드 삭제
- `ExamService.createExamWithQuestions`의 questionCount 로직을 `exam.getQuestions().size()`로 되돌림

---

## HIST-20260419-014

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 백엔드 / 시험지 관리
- **수정 개요**: addQuestionsBulk 루프→saveAll 리팩터, 원자적 생성 엔드포인트 추가, LazyInitializationException 수정, 파일 로깅 설정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| backend/src/main/resources/application.yml | 수정 | logging.file.name, level(DEBUG) 추가 |
| backend/.../service/ExamService.java | 수정 | addQuestionsBulk 루프→saveAll, createExamWithQuestions, getExamSummary 추가 |
| backend/.../repository/QuestionRepository.java | 수정 | countByExamId 쿼리 추가 |
| backend/.../dto/response/ExamSummaryResponse.java | 수정 | from(Exam, int) 오버로드 추가 |
| backend/.../dto/request/ExamCreateWithQuestionsRequest.java | 추가 | 시험지+문항 통합 생성 요청 DTO |
| backend/.../controller/AdminExamController.java | 수정 | POST /with-questions 엔드포인트 추가, getExam LazyInit 수정 |

### 수정 상세

#### `ExamService.addQuestionsBulk`
- 변경 전: `requests.forEach(req -> addQuestion(examId, req))` — 루프마다 DB 쿼리, seq 중복 위험
- 변경 후: startSeq 한 번 조회 후 i 오프셋으로 seq 계산, `questionRepository.saveAll(questions)`
- 이유: Hibernate 자동 flush 타이밍 의존 제거, 단일 INSERT 배치로 성능·안전성 개선

#### `AdminExamController.getExam`
- 변경 전: `ExamSummaryResponse.from(examService.getExamDetail(id))` → 트랜잭션 종료 후 lazy 컬렉션 접근 → LazyInitializationException → 500
- 변경 후: `examService.getExamSummary(id)` — 트랜잭션 내에서 COUNT 쿼리로 문항 수 조회
- 이유: open-in-view=false 환경에서 LazyInit 방지

#### 통합 생성 엔드포인트
- 변경 전: 없음
- 변경 후: `POST /api/admin/exams/with-questions` — 시험지 생성 + 문항 추가를 하나의 @Transactional로 처리, 문항 추가 실패 시 시험지도 롤백

### 복원 방법

HIST-20260419-014 복원 시:
- `addQuestionsBulk`를 `requests.forEach(req -> addQuestion(examId, req))`로 되돌림
- `getExam` 컨트롤러를 `ExamSummaryResponse.from(examService.getExamDetail(id))`로 되돌림
- `ExamCreateWithQuestionsRequest.java` 삭제
- `application.yml`에서 logging 블록 제거

---

## HIST-20260419-013

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 백엔드 / 시험지 관리
- **수정 개요**: AdminExamController에 GET /{id} 단건 조회 엔드포인트 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| backend/src/main/java/com/tpmp/testprep/controller/AdminExamController.java | 수정 | GET /api/admin/exams/{id} 단건 조회 엔드포인트 추가 |

### 수정 상세

#### `backend/.../controller/AdminExamController.java`
- 변경 전: `GET /{id}` 엔드포인트 없음
- 변경 후:
  ```java
  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<ExamSummaryResponse>> getExam(@PathVariable Long id) {
      return ResponseEntity.ok(ApiResponse.success(
              ExamSummaryResponse.from(examService.getExamDetail(id))));
  }
  ```
- 이유: 프론트엔드 시험지 수정 페이지에서 기존 데이터 로드에 필요

### 복원 방법

이 ID(HIST-20260419-013)만으로 복원 시 AdminExamController.java에서 `@GetMapping("/{id}")` 메서드 블록 전체 제거.
