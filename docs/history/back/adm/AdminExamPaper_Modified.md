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
