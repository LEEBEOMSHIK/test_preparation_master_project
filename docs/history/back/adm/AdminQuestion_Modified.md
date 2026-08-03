## HIST-20260803-002

- **날짜**: 2026-08-03
- **수정 범위**: 관리자 백엔드 / 문항 관리 — "사용 시험" 조회 지원
- **수정 개요**: 문항관리 화면에서 특정 문항이 어떤 시험지에 실제로 사용 중인지 확인할 방법이 없었다(사용자 리포트: "어떤 시험에서 사용되는 문항인지 조회 필터와 데이터 컬럼 확인이 안돼"). `question_bank` ↔ `questions.source_question_bank_id` 역참조로 연결된 `examinations` 제목 목록을 조회해 `QuestionBankResponse`에 `usedInExams` 필드로 추가했다. 이미 응답에 있던 `examTypeId`/`examTypeName`(시험 유형)은 프론트에서 전혀 쓰이지 않고 있었는데, 함께 화면에 노출하도록 프론트만 수정(→ 프론트 히스토리 참고).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionBankResponse.java` | 수정 | `usedInExams`(List&lt;String&gt;) 필드 추가, `from(qb)`는 빈 리스트로 위임하는 `from(qb, usedInExams)` 오버로드 신설 |
| `backend/src/main/java/com/tpmp/testprep/repository/QuestionRepository.java` | 수정 | `findUsedExaminationTitlesByQuestionBankIds` 신규 — `Question`과 `Examination`을 `exam = examPaper`로 조인(JPQL 암묵 조인)해 문제은행 ID별 연결된 시험 제목 조회 |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java` | 수정 | `getQuestions`/`getQuestion`에서 `loadUsedInExams()`로 일괄 조회 후 응답에 반영(N+1 방지 — 페이지 내 전체 ID를 한 번에 조회) |
| `backend/src/test/java/com/tpmp/testprep/service/QuestionBankServiceTest.java` | 수정 | 생성자 시그니처 변경(`QuestionRepository` 인자 추가)에 맞춰 `@Mock` 필드·생성 코드 수정 |

### 검증

- `./gradlew compileJava`/`./gradlew test` 통과.
- 백엔드 재기동 후 `GET /api/admin/questions` 응답에서 리눅스마스터 1급 문항(예: id=407)에 `"usedInExams":["2023년 1회 리눅스마스터 1급"]` 정상 반영 확인, 미사용 문항은 `"usedInExams":[]`.

---

## HIST-20260718-001

- **날짜**: 2026-07-18
- **수정 범위**: 관리자 백엔드 / 문항 관리 — 문항별 "대체 정답(||) 구분자 사용 안 함" 플래그 등록·수정 지원
- **수정 개요**: 코드 조건 정답(예: `a < m || b[a] < x`)의 `||`가 채점 시 대체 정답 구분자로 오인되는 문제를 문항별로 끌 수 있도록, 관리자 문항 등록/수정 요청·응답 DTO(`QuestionBankRequest`/`QuestionBankResponse`, 시험지 개별 문항 DTO `QuestionRequest`/`QuestionDetailResponse`)에 `disableAlternativeAnswer`(boolean, 기본 false) 필드를 추가하고, `QuestionBankService`의 단건 등록·일괄 등록·수정 세 경로 모두에서 `QuestionBank` 엔티티 빌더/`update()`에 반영했다. 채점 로직 자체(`AnswerGrader`)와 시험 응시 스냅샷 전파는 `docs/history/back/usr/UserQuiz_Modified.md` HIST-20260718-002에서 함께 처리했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionBankRequest.java` | 수정 | disableAlternativeAnswer(boolean) 필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionBankResponse.java` | 수정 | disableAlternativeAnswer 필드 추가, from()에 반영 |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java` | 수정 | createQuestion·createQuestionsBulk·updateQuestion에서 disableAlternativeAnswer 전달 |
| `backend/src/test/java/com/tpmp/testprep/service/QuestionBankServiceTest.java` | 수정 | QuestionBankRequest 생성자 시그니처 변경(disableAlternativeAnswer 인자 추가)에 맞춰 헬퍼 수정 |

### 수정 상세

#### `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionBankRequest.java`
- 변경 전: `disableAlternativeAnswer` 필드 없음(정답에 `||`가 있으면 항상 대체 정답 구분자로 채점됨).
- 변경 후: `boolean disableAlternativeAnswer` 필드 추가(생략 시 기본 false, 기존 동작 유지).
- 이유: 관리자가 문항 등록/수정 화면에서 코드 조건 정답을 정확히 저장·표시할 수 있도록 저장 계층을 마련.

### 복원 방법
이 ID(HIST-20260718-001)만으로 복원 시 `QuestionBankRequest`/`QuestionBankResponse`의 disableAlternativeAnswer 필드와 `QuestionBankService`의 세 경로 전달 코드를 제거한다(엔티티·마이그레이션 롤백은 HIST-20260718-002 참고).

## HIST-20260625-001

- **날짜**: 2026-06-25
- **수정 범위**: 관리자 백엔드 / 시험지 문항 관리
- **수정 개요**: Question 엔티티에 문항 카테고리(DomainSlave) FK 추가, ExamService에 카테고리 바인딩 적용, QuestionDetailResponse에 categoryId·categoryName 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/Question.java` | 수정 | DomainSlave category FK(LAZY, nullable) 추가; @Builder·update() 파라미터 반영 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionRequest.java` | 수정 | categoryId(Long, nullable) 필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionDetailResponse.java` | 수정 | categoryId·categoryName 필드 추가; from()에서 null-safe 매핑 |
| `backend/src/main/java/com/tpmp/testprep/service/ExamService.java` | 수정 | DomainSlaveRepository 주입; addQuestion·addQuestionsBulk·createExamWithQuestions에 category 바인딩 추가 |
| `backend/src/main/java/com/tpmp/testprep/repository/QuestionRepository.java` | 수정 | findByExamIdOrderBySeqAscWithCategory (LEFT JOIN FETCH q.category) 추가 |

### 수정 상세

#### `Question.java`
- 변경 전: category 필드 없음.
- 변경 후: `@ManyToOne(fetch=LAZY) @JoinColumn(name="category_id") private DomainSlave category;` 추가. Builder(category 파라미터), update(…, DomainSlave category) 파라미터 추가.
- 이유: 시험지 문항에 카테고리 연결로 채점 시점 스냅샷 집계 가능하게 함

#### `QuestionRequest.java`
- 변경 전: language까지 7필드.
- 변경 후: `Long categoryId` 추가 (nullable).

#### `QuestionDetailResponse.java`
- 변경 전: 9필드 record (id~language).
- 변경 후: categoryId·categoryName 추가. from()에서 null-safe 매핑.

#### `ExamService.java`
- 변경 전: DomainSlaveRepository 미주입. 문항 빌더에 category 없음.
- 변경 후: `DomainSlaveRepository domainSlaveRepository` 주입. addQuestion·addQuestionsBulk·createExamWithQuestions에서 `req.categoryId() != null ? domainSlaveRepository.findById(req.categoryId()).orElse(null) : null`로 category 조회 후 빌더에 전달. 파일업로드 파싱 경로는 category=null 유지.

#### `QuestionRepository.java`
- 변경 전: `findByExamIdOrderBySeqAsc` 파생 쿼리만 존재.
- 변경 후: `findByExamIdOrderBySeqAscWithCategory` 추가 (`LEFT JOIN FETCH q.category`). category LAZY 로딩 N+1 방지.

### 복원 방법
이 ID(HIST-20260625-001)만으로 복원 시:
1. Question.java: category 필드·DomainSlave import·Builder 파라미터·update() 파라미터 제거
2. QuestionRequest.java: categoryId 필드 제거
3. QuestionDetailResponse.java: categoryId·categoryName 필드 및 from() 매핑 제거
4. ExamService.java: DomainSlaveRepository 필드·DomainSlave import 제거; 각 메서드에서 category 조회·빌더 전달 코드 제거
5. QuestionRepository.java: findByExamIdOrderBySeqAscWithCategory 메서드 제거

---

## HIST-20260529-002

- **날짜**: 2026-05-29
- **수정 범위**: 관리자 백엔드 / 문항 관리 — 기출 데이터 등록
- **수정 개요**: chobopark.tistory.com/495(2024년 3회 정보처리기사 실기 복원 문제) 1~20번을 `POST /api/admin/questions`로 일괄 등록

### 등록 데이터 요약

- **출처**: https://chobopark.tistory.com/495
- **공통 필드**: examType=정보처리기사 실기(slaveId 7), examYear=2024, examRound=3
- **등록 건수**: 20건 (question_bank id 81~100)
- **분류**: CODE 10건(1·2·7·10·11·12·16·18·19번 + …), SHORT_ANSWER 10건
- **이미지 표/그림 반영**: 3번 employee/project 테이블, 8번 무결성 위반 테이블(StudentID PK)은 HTML `<table>`로, 9번 URL 구조·14번 UML 관계도는 본문 텍스트로 재구성
- **카테고리 매핑 (QUESTION_TYPE 슬레이브)**

| 번호 | 주제 | questionType | categoryId(이름) |
|------|------|--------------|------------------|
| 1·2 | Java/Python 코드 | CODE | 3(프로그래밍 언어) |
| 3 | SQL 서브쿼리 | SHORT_ANSWER | 2(SQL) |
| 4 | LRU 페이지 부재 | SHORT_ANSWER | 1(운영체제) |
| 5 | 스머프 공격 | SHORT_ANSWER | 5(정보보안) |
| 6 | GoF 행위 패턴 | SHORT_ANSWER | 30(소프트웨어공학) |
| 7 | C언어 static | CODE | 3(프로그래밍 언어) |
| 8 | 개체 무결성 위반 | SHORT_ANSWER | 31(관계형 DB 이론) |
| 9 | URL 구조 | SHORT_ANSWER | 33(웹 기술) |
| 10·11·12 | Python/Java/C 코드 | CODE | 3(프로그래밍 언어) |
| 13 | 테스트 커버리지 | SHORT_ANSWER | 30(소프트웨어공학) |
| 14 | UML 클래스 관계 | SHORT_ANSWER | 30(소프트웨어공학) |
| 15 | DB 키 종류 | SHORT_ANSWER | 31(관계형 DB 이론) |
| 16 | C언어 이중 포인터 | CODE | 3(프로그래밍 언어) |
| 17 | VPN | SHORT_ANSWER | 5(정보보안) |
| 18·19 | Java 코드 | CODE | 3(프로그래밍 언어) |
| 20 | Ad-hoc Network | SHORT_ANSWER | 4(네트워크) |

> 비고: 9번 URL 구조는 웹 기술(slaveId 33)로 분류함. 원문 이미지의 표 2종(3·8번)을 HTML `<table>`로 보강 등록함.

### 복원 방법

`DELETE /api/admin/questions/{id}` (id 81~100) 또는 `DELETE FROM question_bank WHERE exam_year=2024 AND exam_round=3` (소프트 삭제는 del_yn='Y').

---

## HIST-20260529-001

- **날짜**: 2026-05-29
- **수정 범위**: 관리자 백엔드 / 문항 관리 — 기출 데이터 등록
- **수정 개요**: chobopark.tistory.com/540(2025년 1회 정보처리기사 실기 복원 문제) 1~20번을 `POST /api/admin/questions`로 일괄 등록

### 등록 데이터 요약

- **출처**: https://chobopark.tistory.com/540
- **공통 필드**: examType=정보처리기사 실기(slaveId 7), examYear=2025, examRound=1
- **등록 건수**: 20건 (question_bank id 61~80)
- **분류**: CODE 9건(5·10·11·13·16·17·18·19·20번), SHORT_ANSWER 11건
- **카테고리 매핑 (QUESTION_TYPE 슬레이브)**

| 번호 | 주제 | questionType | categoryId(이름) |
|------|------|--------------|------------------|
| 1 | 세션 하이재킹 | SHORT_ANSWER | 5(정보보안) |
| 2 | 무결성 제약조건 | SHORT_ANSWER | 31(관계형 DB 이론) |
| 3 | CRC 오류 검출 | SHORT_ANSWER | 4(네트워크) |
| 4 | 악성코드(스캐어웨어) | SHORT_ANSWER | 5(정보보안) |
| 5 | Java 예외 처리 | CODE | 3(프로그래밍 언어) |
| 6 | ARP/RARP | SHORT_ANSWER | 4(네트워크) |
| 7 | SQL 조인 | SHORT_ANSWER | 2(SQL) |
| 8 | 관계형 DB 용어 | SHORT_ANSWER | 31(관계형 DB 이론) |
| 9 | 서브넷 브로드캐스트 | SHORT_ANSWER | 4(네트워크) |
| 10·11 | C언어 배열/포인터 | CODE | 3(프로그래밍 언어) |
| 12 | 결합도 | SHORT_ANSWER | 30(소프트웨어공학) |
| 13 | Java 상속/static | CODE | 3(프로그래밍 언어) |
| 14 | 디자인 패턴(Adapter) | SHORT_ANSWER | 30(소프트웨어공학) |
| 15 | 문장 커버리지 | SHORT_ANSWER | 30(소프트웨어공학) |
| 16~20 | Java/Python/C 코드 | CODE | 3(프로그래밍 언어) |

> 비고: 원문 이미지에 있던 표를 모두 HTML `<table>`로 보강 등록함(PUT 갱신) — 2번 무결성 제약조건 비교표(id 62), 7번 emp/sal 테이블(id 67), 14번 GoF 디자인 패턴 분류표(id 74).

### 복원 방법

`DELETE /api/admin/questions/{id}` (id 61~80) 또는 `DELETE FROM question_bank WHERE exam_year=2025 AND exam_round=1` (소프트 삭제는 del_yn='Y').

---

## HIST-20260528-009

- **날짜**: 2026-05-28
- **수정 범위**: 관리자 백엔드·프론트엔드 / 문항 관리 — AI 태그 시스템
- **수정 개요**: keyword_tag 테이블 및 태그 저장·조회 API 추가, AI 패널에 태그 저장·콤보박스·태그 기반 문제 생성 통합

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../entity/KeywordTag.java` | 추가 | keyword_tag 엔티티 (KEYWORD/DOMAIN, use_count, uq 제약) |
| `backend/.../repository/KeywordTagRepository.java` | 추가 | 이름+타입 단건 조회, 타입별 use_count 내림차순 목록 |
| `backend/.../dto/request/KeywordTagBulkRequest.java` | 추가 | 태그 일괄 저장 요청 DTO |
| `backend/.../dto/response/KeywordTagResponse.java` | 추가 | 태그 응답 DTO |
| `backend/.../service/KeywordTagService.java` | 추가 | saveBulk (upsert + use_count 증가), search |
| `backend/.../controller/AdminKeywordTagController.java` | 추가 | POST /bulk, GET /?type&q 엔드포인트 |
| `backend/.../service/QuestionAnalysisService.java` | 수정 | originalContent 없이도 regenerate 가능하도록 프롬프트 분기 |
| `frontend/src/services/keywordTagService.ts` | 추가 | saveBulk, search API |
| `frontend/src/components/ui/QuestionAnalysisPanel.tsx` | 수정 | 태그 저장 버튼, TagMultiSelect 컴포넌트, 저장된 태그로 문제 생성 섹션 추가 |

### 복원 방법

KeywordTag 관련 백엔드 파일 삭제, QuestionAnalysisPanel에서 태그 관련 섹션 제거, keywordTagService.ts 삭제.

---

## HIST-20260528-008

- **날짜**: 2026-05-28
- **수정 범위**: 관리자 백엔드·프론트엔드 / 문항 관리
- **수정 개요**: UI 미리보기 기능 + 문제 재구성(키워드 기반 새 문제 생성) 기능 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../dto/request/QuestionRegenerateRequest.java` | 추가 | 재구성 요청 DTO (keywords, domains, difficulty, originalContent) |
| `backend/.../dto/response/QuestionRegenerateResponse.java` | 추가 | 재구성 응답 DTO (content: HTML) |
| `backend/.../service/QuestionAnalysisService.java` | 수정 | callAnthropicText() 공통 헬퍼 추출, regenerate() 메서드 추가 |
| `backend/.../controller/AdminQuestionController.java` | 수정 | POST /admin/questions/regenerate 엔드포인트 추가 |
| `frontend/src/services/questionAnalysisService.ts` | 수정 | RegenerateRequest·QuestionRegenerate 타입 + regenerate() API 추가 |
| `frontend/src/components/ui/QuestionAnalysisPanel.tsx` | 수정 | UI 미리보기 버튼(MOCK_RESULT), 문제 재구성 버튼, 재구성 결과 패널 추가 |
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | onApplyContent 콜백 연결 |
| `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx` | 수정 | onApplyContent 콜백 연결 |

### 복원 방법

regenerate 엔드포인트·서비스 메서드·DTO 제거, QuestionAnalysisPanel을 이전 버전으로 롤백.

---

## HIST-20260528-006

- **날짜**: 2026-05-28
- **수정 범위**: 관리자 백엔드 / 문항 관리
- **수정 개요**: 문항 내용 AI 키워드·도메인 추출 API 추가 (Claude Haiku 연동)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../exception/ErrorCode.java` | 수정 | AI_SERVICE_UNAVAILABLE, AI_ANALYSIS_FAILED 에러 코드 추가 |
| `backend/src/main/resources/application.yml` | 수정 | app.anthropic.api-key, app.anthropic.model 설정 추가 |
| `backend/.../dto/request/QuestionAnalysisRequest.java` | 추가 | AI 분석 요청 DTO |
| `backend/.../dto/response/QuestionAnalysisResponse.java` | 추가 | AI 분석 응답 DTO (keywords, domains, difficulty, summary) |
| `backend/.../service/QuestionAnalysisService.java` | 추가 | Anthropic API 호출 서비스 (RestClient, HTML 스트리핑, JSON 파싱) |
| `backend/.../controller/AdminQuestionController.java` | 수정 | POST /api/admin/questions/analyze 엔드포인트 추가 |

### 복원 방법

`AdminQuestionController`에서 analyze 엔드포인트 제거, `QuestionAnalysisService` 삭제, DTO 2개 삭제, `ErrorCode` AI 코드 2개 제거, `application.yml` anthropic 설정 제거.

---

## HIST-20260505-002

- **날짜**: 2026-05-05
- **수정 범위**: 관리자 백엔드 / 문항 관리
- **수정 개요**: `QuestionBankRequest`에서 `categoryId`(문항 유형), `examTypeId`(시험 유형) 필수값 처리

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../dto/request/QuestionBankRequest.java` | 수정 | `categoryId`, `examTypeId`에 `@NotNull` 추가 |

### 수정 상세

#### `QuestionBankRequest.java`
- 변경 전: `Long categoryId`, `Long examTypeId` (nullable, 검증 없음)
- 변경 후: `@NotNull Long categoryId`, `@NotNull Long examTypeId`
- 이유: 문항 풀 단독 등록·수정 API에서 유형 미지정 데이터 차단

### 복원 방법

이 ID(HIST-20260505-002)만으로 복원 시 `categoryId`, `examTypeId`에서 `@NotNull` 어노테이션을 제거한다.

---

## HIST-20260505-001

- **날짜**: 2026-05-05
- **수정 범위**: 관리자 백엔드 / 문항 관리
- **수정 개요**: `question_bank` 테이블에 `title`, `exam_year`, `exam_round` 컬럼 추가 — 문항 제목 및 시험 연도/회차 관리

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../entity/QuestionBank.java` | 수정 | `title`, `examYear`, `examRound` 필드 추가; builder/update 메서드 파라미터 추가 |
| `backend/.../dto/request/QuestionBankRequest.java` | 수정 | `title`, `examYear`, `examRound` 필드 추가 (선택) |
| `backend/.../dto/response/QuestionBankResponse.java` | 수정 | 동일 필드 추가; `from()` 매핑 추가 |
| `backend/.../service/QuestionBankService.java` | 수정 | createQuestion·createQuestionsBulk·updateQuestion에서 새 필드 builder/update에 전달 |

### 수정 상세

#### `QuestionBank.java`
- 변경 전: `content`, `questionType`, ... 순
- 변경 후: `title`(VARCHAR 200, nullable), `examYear`(INTEGER, nullable), `examRound`(INTEGER, nullable) 필드 앞쪽 추가
- 이유: ddl-auto=update 환경에서 Hibernate가 컬럼 자동 추가

#### `QuestionBankRequest.java` / `QuestionBankResponse.java`
- 변경 전: title/examYear/examRound 없음
- 변경 후: 세 필드 추가 (request는 `@Size` 검증만, examYear/examRound는 null 허용)

#### `QuestionBankService.java`
- createQuestion, createQuestionsBulk, updateQuestion 모두 새 필드를 builder/update에 전달

### 복원 방법

이 ID(HIST-20260505-001)만으로 복원 시:
- 엔티티에서 세 필드 제거, builder/update 시그니처 복원
- Request/Response에서 세 필드 제거
- Service에서 세 필드 전달 구문 제거
- DB 컬럼(`title`, `exam_year`, `exam_round`)은 수동 DROP COLUMN 필요

---

## HIST-20260501-001

- **날짜**: 2026-05-01
- **수정 범위**: 관리자 백엔드 / 문항 관리
- **수정 개요**: QuestionBankResponse에 `updatedAt`(최종 수정일) 필드 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionBankResponse.java` | 수정 | `updatedAt` 필드 추가, `from()`에서 `qb.getModifiedDt()` 매핑 |

### 수정 상세

#### `dto/response/QuestionBankResponse.java`
- 변경 전: `createdAt` 필드만 존재 (`qb.getCreateDt()` 매핑)
- 변경 후: `updatedAt` 필드 추가 (`qb.getModifiedDt()` 매핑), record 14번째 컴포넌트로 삽입
- 이유: 프론트엔드 문항 목록에서 최근 수정일 기준 정렬 지원

### 복원 방법

이 ID(HIST-20260501-001)만으로 복원 시:
- `QuestionBankResponse.java`에서 `LocalDateTime updatedAt` 필드 제거, `from()` 메서드에서 `qb.getModifiedDt()` 인수 제거

---

## HIST-20260430-014

- **날짜**: 2026-04-30
- **수정 범위**: 관리자 백엔드 / 문항 관리
- **수정 개요**: QuestionBank에 examType(시험 유형) 필드 추가, categoryId 선택 필드로 완화, QuestionBankResponse에 examTypeId/examTypeName 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/QuestionBank.java` | 수정 | `examType` ManyToOne 필드 추가, `@Builder`/`update()` 파라미터에 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/request/QuestionBankRequest.java` | 수정 | `categoryId` @NotNull 제거, `examTypeId` 필드 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/QuestionBankResponse.java` | 수정 | `examTypeId`, `examTypeName` 필드 및 `from()` 팩토리 업데이트 |
| `backend/src/main/java/com/tpmp/testprep/service/QuestionBankService.java` | 수정 | `resolveCategory` null-safe, `createQuestion`/`createQuestionsBulk`/`updateQuestion`에 `examType` 적용 |

### 수정 상세

#### `entity/QuestionBank.java`
- 변경 전: `category` 필드만 존재, `@Builder`/`update()`에 `DomainSlave category` 하나
- 변경 후: `@ManyToOne @JoinColumn(name="exam_type_id") DomainSlave examType` 추가, `@Builder`/`update()` 파라미터에 `DomainSlave examType` 추가 (category 뒤)
- 이유: 문항에 시험 유형을 별도로 분류하기 위한 필드 추가

#### `dto/request/QuestionBankRequest.java`
- 변경 전: `@NotNull Long categoryId`
- 변경 후: `Long categoryId` (@NotNull 제거), `Long examTypeId` 추가
- 이유: 프론트엔드 신규 등록 화면에서 카테고리 선택을 선택 사항으로 변경

#### `dto/response/QuestionBankResponse.java`
- 변경 전: `categoryId`, `categoryName` 이후 바로 `options`
- 변경 후: `examTypeId`, `examTypeName` 두 필드 추가 (categoryName 뒤), `from()`에서 null-safe getter 매핑
- 이유: 프론트엔드에서 시험 유형 표시 및 수정 화면 기본값 채우기 지원

#### `service/QuestionBankService.java`
- 변경 전: `resolveCategory`가 null 전달 시 `findById(null)` 호출로 예외 발생
- 변경 후: `if (categoryId == null) return null;` 선행 체크 추가, create/update에 examType 파라미터 적용
- 이유: categoryId/examTypeId가 선택 필드이므로 null에 대한 방어 처리 필요

### 복원 방법

이 ID(HIST-20260430-014)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.

---

## HIST-20260420-002

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 백엔드 / 문항 관리
- **수정 개요**: 문항 이미지 업로드 API 추가, 업로드 파일 정적 제공 설정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| service/QuestionBankService.java | 수정 | `uploadImage()` 메서드 추가 — ./uploads/images/ 저장 후 URL 반환 |
| controller/AdminQuestionController.java | 수정 | `POST /api/admin/questions/images` 엔드포인트 추가 |
| config/WebMvcConfig.java | 추가 | `/uploads/**` → `./uploads/` 정적 파일 제공 ResourceHandler |
| config/SecurityConfig.java | 수정 | `/uploads/**` permitAll 추가 |

### 수정 상세

#### `service/QuestionBankService.java`
- 변경 전: 이미지 업로드 없음
- 변경 후: `uploadImage(MultipartFile)` — JPEG/PNG/GIF/WEBP 허용, UUID 파일명으로 `./uploads/images/` 저장, `/uploads/images/{filename}` URL 반환

#### `config/WebMvcConfig.java`
- 변경 전: 없음
- 변경 후: `WebMvcConfigurer` 구현 — 업로드 디렉토리를 `/uploads/**` URL로 정적 노출

#### `config/SecurityConfig.java`
- 변경 전: `/uploads/**` 경로 없음
- 변경 후: `.requestMatchers("/uploads/**").permitAll()` — 인증 없이 이미지 접근 허용

### 복원 방법

HIST-20260420-002 복원 시:
- `QuestionBankService.java`에서 `uploadImage()` 및 관련 import 제거
- `AdminQuestionController.java`에서 `/images` 엔드포인트 제거
- `WebMvcConfig.java` 삭제
- `SecurityConfig.java`에서 `/uploads/**` permitAll 제거

---

## HIST-20260419-018

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 백엔드 / 문항 관리
- **수정 개요**: 문항 등록/수정에 카테고리(문제 유형) 필수 필드 추가, DTO @Size 유효성 검사 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| entity/QuestionBank.java | 수정 | category 필드(DomainSlave FK) 추가, language/question_type 컬럼 길이 조정 |
| dto/request/QuestionBankRequest.java | 수정 | categoryId @NotNull 추가, @Size 제약 추가 |
| dto/request/QuestionRequest.java | 수정 | @Size 제약 추가 |
| dto/request/ExamCreateRequest.java | 수정 | title @Size(max=200) 추가 |
| dto/response/QuestionBankResponse.java | 수정 | categoryId, categoryName 필드 추가 |
| service/QuestionBankService.java | 수정 | DomainSlaveRepository 주입, resolveCategory() 헬퍼 추가, create/update에 category 적용 |

### 수정 상세

#### `entity/QuestionBank.java`
- 변경 전: category 필드 없음
- 변경 후: `@ManyToOne(fetch=LAZY) @JoinColumn(name="category_id") DomainSlave category` 추가
- 이유: 문항의 문제 유형(카테고리) 분류 지원

#### `dto/request/QuestionBankRequest.java`
- 변경 전: categoryId 필드 없음
- 변경 후: `@NotNull Long categoryId` 추가, content(@Size 5000), answer(@Size 2000), code(@Size 10000)
- 이유: 카테고리 필수 등록 및 입력값 길이 제한

### 복원 방법

이 ID(HIST-20260419-018)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.

---

## HIST-20260419-012

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 백엔드 / 시험지 등록
- **수정 개요**: POST `/api/admin/exams` 401 오류 수정 — DataInitializer 트랜잭션 분리, ExamService UNAUTHORIZED → INTERNAL_ERROR 변경

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../config/DataInitializer.java` | 수정 | `run()`의 `@Transactional` 제거, DDL/user 작업 메서드 분리 |
| `backend/.../service/ExamService.java` | 수정 | `createExam`의 `UNAUTHORIZED` → `INTERNAL_ERROR` (HTTP 401 → 500) |

### 수정 상세

#### `config/DataInitializer.java`
- 변경 전: `run()` 전체에 `@Transactional` — DDL + JPA를 같은 트랜잭션에 묶어 커밋 누락 가능성
- 변경 후: `run()`에서 `@Transactional` 제거, DDL은 `fixAnswerNullable()`에서 try-catch로 독립 실행, 유저 관리는 `ensureAdminUser()` `@Transactional` 별도 트랜잭션

#### `service/ExamService.java`
- 변경 전: `userRepository.findByEmail` 실패 시 `UNAUTHORIZED(401)` 반환 → Spring Security 401과 혼동
- 변경 후: `INTERNAL_ERROR(500)` 반환 — 인증 실패(401)와 명확히 구분

### 복원 방법

이 ID(HIST-20260419-012)만으로 복원 시:
- `DataInitializer.java`: `run()`에 `@Transactional` 추가, `fixAnswerNullable`/`ensureAdminUser` 메서드 제거 후 인라인
- `ExamService.java`: `INTERNAL_ERROR` → `UNAUTHORIZED` 변경

---

## HIST-20260419-011

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 백엔드 / 문항 관리
- **수정 개요**: `/api/admin/exams/{id}/questions/bulk` 500 오류 수정 — questions.answer NOT NULL 제약 위반

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../entity/Question.java` | 수정 | `answer` 필드 `@Column(nullable = false)` → `@Column` |
| `backend/.../config/DataInitializer.java` | 수정 | 시작 시 `ALTER TABLE questions ALTER COLUMN answer DROP NOT NULL` 실행 |

### 수정 상세

#### `entity/Question.java`
- 변경 전: `@Column(nullable = false) private String answer` — DB NOT NULL 제약
- 변경 후: `@Column private String answer` — nullable 허용
- 이유: CODE 유형 문항은 answer가 선택 사항이나 DB 제약으로 INSERT 실패(500)

#### `config/DataInitializer.java`
- 변경 전: JdbcTemplate 없음
- 변경 후: `JdbcTemplate` 주입 후 `ALTER TABLE questions ALTER COLUMN answer DROP NOT NULL` 실행
- 이유: `ddl-auto: update`는 nullable 제약 변경을 자동 적용하지 않으므로 직접 DDL 실행

### 복원 방법

이 ID(HIST-20260419-011)만으로 복원 시:
- `Question.java`: `answer`에 `@Column(nullable = false)` 복구
- `DataInitializer.java`: JdbcTemplate 주입 및 ALTER TABLE 실행 코드 제거
- DB: `ALTER TABLE questions ALTER COLUMN answer SET NOT NULL`

---

## HIST-20260419-008

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 백엔드 / 인증
- **수정 개요**: DataInitializer — existsByEmail 조건 제거, 매 시작 시 삭제+재생성으로 비밀번호/역할 항상 일치 보장

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../config/DataInitializer.java` | 수정 | 기존 계정 삭제 후 재생성 패턴으로 변경 (`@Transactional`, `flush()` 추가) |

### 수정 상세

#### `config/DataInitializer.java`
- 변경 전: `existsByEmail` 체크 후 없을 때만 생성 → 이전에 다른 비밀번호로 생성된 계정이 있으면 수정 불가
- 변경 후: `findByEmail` → `delete` → `flush` → `save` 패턴으로 항상 올바른 비밀번호/역할 보장
- 이유: DB에 기존 admin@tpmp.com 계정이 다른 비밀번호로 존재해 INVALID_CREDENTIALS(401) 발생

### 복원 방법

이 ID(HIST-20260419-008)만으로 복원 시:
- `DataInitializer.java`: 삭제+재생성 로직을 `existsByEmail` 체크 방식으로 되돌림

---

## HIST-20260419-005

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 백엔드 / 인증 및 보안
- **수정 개요**: 테스트 관리자 계정 자동 생성(DataInitializer), 미인증 요청에 대한 401 응답 처리(SecurityConfig) 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../config/DataInitializer.java` | 추가 | 앱 시작 시 admin@tpmp.com / Admin1234! 계정이 없으면 자동 생성 |
| `backend/.../config/SecurityConfig.java` | 수정 | authenticationEntryPoint 추가 — 미인증 요청에 403 대신 401 반환 |

### 수정 상세

#### `config/DataInitializer.java`
- 변경 전: 파일 없음 (관리자 계정 수동 DB INSERT 필요)
- 변경 후: `ApplicationRunner` 구현 — 앱 시작 시 `admin@tpmp.com`(Role: ADMIN) 계정이 없으면 자동 생성
- 이유: 테스트 환경에서 관리자 API 접근을 위한 계정 부재 문제 해결

#### `config/SecurityConfig.java`
- 변경 전: `exceptionHandling` 미설정 → 미인증 요청도 403 반환
- 변경 후: `authenticationEntryPoint`로 미인증 요청 시 401 반환 (`response.sendError(401)`)
- 이유: 프론트엔드 apiClient의 401 핸들러(refresh → 로그인 리다이렉트)가 정상 동작하도록 보정

### 복원 방법

이 ID(HIST-20260419-005)만으로 복원 시:
- `DataInitializer.java` 삭제
- `SecurityConfig.java`: `exceptionHandling(...)` 블록 제거, `HttpServletResponse` import 제거

---

## HIST-20260419-001

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 백엔드 / 문항 관리 (DB 설계 + 문항 풀 API)
- **수정 개요**: DB 가이드라인 정의, 표준 공통 컬럼(BaseEntity) 도입, 글로벌 문항 풀(question_bank) 전체 스택 구현, Question 엔티티에 CODE 유형 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `docs/db-guidelines.md` | 추가 | DB 테이블 설계 규칙 문서 (표준 컬럼, 네이밍, ERD) |
| `backend/.../entity/BaseEntity.java` | 추가 | MappedSuperclass — 공통 컬럼(create_dt/uno, modified_dt/uno, del_yn, use_yn) |
| `backend/.../entity/QuestionBank.java` | 추가 | 글로벌 문항 풀 엔티티 (BaseEntity 상속, question_bank 테이블) |
| `backend/.../repository/QuestionBankRepository.java` | 추가 | 문항 풀 JPA 레포지토리 (del_yn 필터 메서드 포함) |
| `backend/.../dto/request/QuestionBankRequest.java` | 추가 | 문항 단건 등록/수정 요청 DTO |
| `backend/.../dto/request/QuestionBankBulkRequest.java` | 추가 | 문항 일괄 등록 요청 DTO |
| `backend/.../dto/response/QuestionBankResponse.java` | 추가 | 문항 응답 DTO (프론트엔드 QuestionSummary 구조 일치) |
| `backend/.../service/QuestionBankService.java` | 추가 | 문항 CRUD 서비스 (소프트 삭제 지원) |
| `backend/.../controller/AdminQuestionController.java` | 추가 | `/api/admin/questions` 엔드포인트 — GET/POST/POST bulk/PUT/DELETE |
| `backend/.../entity/Question.java` | 수정 | QuestionType에 CODE 추가, code/language 필드 추가 |
| `backend/.../dto/request/QuestionRequest.java` | 수정 | code, language 필드 추가, answer NotBlank 제거(CODE 유형 유연성) |
| `backend/.../service/ExamService.java` | 수정 | addQuestion에 code/language 빌더 파라미터 추가 |

### 수정 상세

#### `docs/db-guidelines.md`
- 변경 전: 파일 없음
- 변경 후: DB 표준 컬럼 정의, 테이블/컬럼 네이밍 규칙, Java/JPA 구현 표준, question_bank ERD 포함 가이드 문서
- 이유: 프로젝트 전체 DB 설계 일관성 확보

#### `entity/BaseEntity.java`
- 변경 전: 파일 없음
- 변경 후: `@MappedSuperclass` — `createDt`, `createUno`, `modifiedDt`, `modifiedUno`, `delYn('N')`, `useYn('Y')` 필드. `initAudit(userNo)`, `updateAudit(userNo)`, `softDelete(userNo)`, `deactivate(userNo)` 메서드 제공
- 이유: 공통 컬럼을 상속으로 재사용, 신규 엔티티에 일관된 감사(audit) 컬럼 보장

#### `entity/QuestionBank.java`
- 변경 전: 파일 없음
- 변경 후: `question_bank` 테이블 매핑 엔티티. content, questionType(MULTIPLE_CHOICE/SHORT_ANSWER/OX/CODE), options(JSONB), answer, code, language, explanation + BaseEntity 공통 컬럼
- 이유: 시험지에 종속되지 않는 독립 문항 풀 필요

#### `entity/Question.java`
- 변경 전: `QuestionType { MULTIPLE_CHOICE, SHORT_ANSWER, OX }`, code/language 필드 없음
- 변경 후: `QuestionType { MULTIPLE_CHOICE, SHORT_ANSWER, OX, CODE }`, `code TEXT`, `language VARCHAR(20)` 추가
- 이유: 코드 문항 유형 지원

#### `dto/request/QuestionRequest.java`
- 변경 전: `answer`에 `@NotBlank`, code/language 없음
- 변경 후: `answer`에서 `@NotBlank` 제거(CODE 유형은 expected output으로 nullable 가능), `code`, `language` 필드 추가
- 이유: CODE 유형의 유연한 입력 지원

#### `service/ExamService.java`
- 변경 전: `Question.builder()` 에 code/language 없음
- 변경 후: `.code(request.code()).language(request.language())` 추가
- 이유: QuestionRequest의 code/language를 실제 DB에 저장

### API 엔드포인트

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/admin/questions?page=0&size=50` | 문항 목록 (페이징) |
| GET | `/api/admin/questions/{id}` | 문항 단건 조회 |
| POST | `/api/admin/questions` | 문항 단건 등록 |
| POST | `/api/admin/questions/bulk` | 문항 일괄 등록 `{ questions: [...] }` |
| PUT | `/api/admin/questions/{id}` | 문항 수정 |
| DELETE | `/api/admin/questions/{id}` | 문항 소프트 삭제 (del_yn = 'Y') |

### 복원 방법

이 ID(HIST-20260419-001)만으로 복원 시:
- `docs/db-guidelines.md` 삭제
- `BaseEntity.java`, `QuestionBank.java`, `QuestionBankRepository.java` 삭제
- `QuestionBankRequest.java`, `QuestionBankBulkRequest.java`, `QuestionBankResponse.java` 삭제
- `QuestionBankService.java`, `AdminQuestionController.java` 삭제
- `Question.java`: CODE 제거, code/language 필드 제거
- `QuestionRequest.java`: `answer`에 `@NotBlank` 복구, code/language 제거
- `ExamService.java`: `.code(...)`, `.language(...)` 줄 제거
