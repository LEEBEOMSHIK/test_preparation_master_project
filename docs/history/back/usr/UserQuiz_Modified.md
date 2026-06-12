## HIST-20260613-001

- **날짜**: 2026-06-13
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈
- **수정 개요**: `QuizQuestionView` record에 `examYear`, `examRound` 필드 추가 — 문항의 연도·회차 정보를 FE로 전달

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/controller/UserQuizController.java` | 수정 | `QuizQuestionView` record에 `Integer examYear`, `Integer examRound` 추가 및 `from()` 매핑 추가 |

### 수정 상세

#### `UserQuizController.java` — `QuizQuestionView`
- 변경 전:
  ```java
  public record QuizQuestionView(
          Long id, String content, String questionType,
          List<String> options, String code, String language) {

      public static QuizQuestionView from(QuestionBank qb) {
          return new QuizQuestionView(
                  qb.getId(), qb.getContent(), qb.getQuestionType().name(),
                  qb.getOptions(), qb.getCode(), qb.getLanguage());
      }
  }
  ```
- 변경 후:
  ```java
  public record QuizQuestionView(
          Long id, String content, String questionType,
          List<String> options, String code, String language,
          Integer examYear, Integer examRound) {

      public static QuizQuestionView from(QuestionBank qb) {
          return new QuizQuestionView(
                  qb.getId(), qb.getContent(), qb.getQuestionType().name(),
                  qb.getOptions(), qb.getCode(), qb.getLanguage(),
                  qb.getExamYear(), qb.getExamRound());
      }
  }
  ```
- 이유: `QuestionBank` 엔티티에 `examYear`, `examRound` 필드(nullable)가 있으나 퀴즈 응답 DTO에서 누락되어 FE에 전달되지 않았음. nullable 그대로 `Integer`로 선언.

### 복원 방법
이 ID(HIST-20260613-001)로 복원 시: `QuizQuestionView` record에서 `Integer examYear, Integer examRound` 필드 제거, `from()` 메서드의 마지막 두 인자(`qb.getExamYear(), qb.getExamRound()`) 제거.

---

## HIST-20260501-003

- **날짜**: 2026-05-01
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈
- **수정 개요**: `findRandomByCategory` 쿼리가 `category_id`만 검색하던 것을 `exam_type_id`도 함께 검색하도록 수정 — 시험 유형 카테고리 선택 시 문제가 표시되지 않던 버그 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/repository/QuestionBankRepository.java` | 수정 | `findRandomByCategory` WHERE절 `category_id = :categoryId` → `(category_id = :categoryId OR exam_type_id = :categoryId)` |

### 수정 상세

#### `QuestionBankRepository.java`
- 변경 전: `WHERE category_id = :categoryId AND del_yn = 'N'`
- 변경 후: `WHERE (category_id = :categoryId OR exam_type_id = :categoryId) AND del_yn = 'N'`
- 이유: 퀴즈 카테고리 페이지에서 "시험 유형" 마스터의 슬레이브를 선택하면 해당 슬레이브 ID가 `categoryId` 파라미터로 전달되는데, `question_bank`에서 시험 유형은 `exam_type_id` 컬럼에 저장된다. 이전 쿼리는 `category_id`만 조회해 시험 유형 기반 문항이 한 건도 반환되지 않았음.

### 복원 방법

이 ID(HIST-20260501-003)만으로 복원 시:
- `findRandomByCategory` 쿼리의 WHERE절을 `category_id = :categoryId AND del_yn = 'N'`으로 되돌림

---

## HIST-20260422-007

- **날짜**: 2026-04-22
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈
- **수정 개요**: `/api/user/quiz/categories` 카테고리 없을 때 500 오류 수정 (LazyInitializationException)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../controller/UserQuizController.java` | 수정 | `findAll()` → `findAllWithSlaves()` 로 변경 |

### 수정 상세

#### `UserQuizController.java`
- 변경 전: `domainMasterRepository.findAll().stream()`
- 변경 후: `domainMasterRepository.findAllWithSlaves().stream()`
- 이유: `findAll()`은 `slaves`를 지연 로딩(lazy)으로 가져오는데, 레포지토리 호출 후 JPA 세션이 닫혀 `getSlaves()` 호출 시 `LazyInitializationException` → 500 발생. 이미 존재하는 `findAllWithSlaves()`(LEFT JOIN FETCH)를 사용해 세션 내에서 슬레이브까지 한 번에 로드.

### 복원 방법

`UserQuizController.java` 의 `findAllWithSlaves()` 를 `findAll()` 로 되돌린다.

---

## HIST-20260422-005

- **날짜**: 2026-04-22
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈 API
- **수정 개요**: 퀴즈 카테고리 목록 API가 전체 DomainMaster를 반환하던 것을 "문제 유형", "시험 유형"만 반환하도록 필터 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/controller/UserQuizController.java` | 수정 | `getCategories()`에 name 기반 필터 추가 |

### 수정 상세

#### `UserQuizController.java`
- 변경 전: `domainMasterRepository.findAll()` 전체 반환
- 변경 후: `List.of("문제 유형", "시험 유형")`에 해당하는 마스터만 stream filter 후 반환
- 이유: 관리자가 시험 분류 등 다른 목적으로 DomainMaster를 추가해도 퀴즈 화면에 노출되지 않도록 분리

### 복원 방법

HIST-20260422-005 복원 시:
- `UserQuizController.getCategories()`에서 `filter(m -> quizMasterNames.contains(m.getName()))` 라인과 `quizMasterNames` 변수 제거

---

## HIST-20260421-022

- **날짜**: 2026-04-21
- **수정 범위**: 사용자 백엔드 / 시험 응시 API
- **수정 개요**: `UserExaminationController.QuestionView`에 `code`·`language` 필드 추가 — 코드 문항의 코드 본문이 응시 화면에 전달되도록 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/main/java/.../controller/UserExaminationController.java | 수정 | QuestionView record에 code, language 추가 |

### 수정 상세

#### `UserExaminationController.QuestionView`
- 변경 전: `record QuestionView(Long id, int seq, String content, String questionType, List<String> options)`
- 변경 후: `record QuestionView(Long id, int seq, String content, String questionType, List<String> options, String code, String language)`

### 복원 방법

HIST-20260421-022 복원 시:
- `QuestionView` record에서 `code`, `language` 필드 제거

---

## HIST-20260421-019

- **날짜**: 2026-04-21
- **수정 범위**: 사용자 백엔드 / 시험 응시 API
- **수정 개요**: 사용자용 시험(Examination) 목록·상세·제출 API 신규 추가 (`/api/user/examinations`), `ExaminationRepository`에 단건 페치 조인 쿼리 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/main/java/.../controller/UserExaminationController.java | 추가 | GET 목록·상세, POST 제출 3개 엔드포인트 |
| src/main/java/.../repository/ExaminationRepository.java | 수정 | `findByIdWithPaper` 페치 조인 쿼리 추가 |

### 수정 상세

#### `UserExaminationController.java` (신규)
- 변경 전: 파일 없음
- 변경 후:
  - `GET /api/user/examinations` — `findAllWithDetails` 페이지 목록 반환
  - `GET /api/user/examinations/{id}` — `findByIdWithPaper` 조회 후 시험지 문항(RANDOM이면 shuffle) 포함한 `ExaminationDetailView` 반환
  - `POST /api/user/examinations/{id}/submit` — 시험지 문항 채점 후 `SubmitResult(total, correct, score)` 반환
  - 내부 레코드: `ExaminationDetailView`, `QuestionView`, `SubmitResult`

#### `ExaminationRepository.java`
- 변경 전: `findAllWithDetails` 쿼리만 존재
- 변경 후: `findByIdWithPaper` — examPaper·category 페치 조인 단건 조회 쿼리 추가

### 복원 방법

HIST-20260421-019 복원 시:
- `UserExaminationController.java` 삭제
- `ExaminationRepository.java`에서 `findByIdWithPaper` 메서드 제거

---

## HIST-20260420-008

- **날짜**: 2026-04-20
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈 + 시험 응시
- **수정 개요**: 데일리 퀴즈 API (카테고리 목록·랜덤 문항·단건 채점) 및 시험 제출·채점 API 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| controller/UserQuizController.java | 추가 | 퀴즈 카테고리 조회, 랜덤 문항, 단건 채점 |
| controller/UserExamController.java | 수정 | POST /{id}/submit — 시험 제출·채점 엔드포인트 추가 |
| repository/QuestionBankRepository.java | 수정 | findRandomByCategory() 네이티브 쿼리 추가 |

### API 엔드포인트 (신규)

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/user/quiz/categories` | 도메인 마스터 전체 (카테고리 선택용) |
| GET | `/api/user/quiz/questions?categoryId={id}&limit={n}` | 카테고리별 랜덤 문항 (최대 30개) |
| POST | `/api/user/quiz/check` | `{ questionId, userAnswer }` → 정오 판정 |
| POST | `/api/user/exams/{id}/submit` | `{ questionId: userAnswer }` map → score 반환 |

### 복원 방법

HIST-20260420-008 복원 시:
- UserQuizController.java 삭제
- UserExamController.java에서 submitExam 메서드 및 SubmitResult record 제거, QuestionRepository 의존 제거
- QuestionBankRepository.java에서 findRandomByCategory 제거
