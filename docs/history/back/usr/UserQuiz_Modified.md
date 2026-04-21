## HIST-20260421-037

- **날짜**: 2026-04-21
- **수정 범위**: 사용자 백엔드 / 데일리 퀴즈
- **수정 개요**: `/api/user/quiz/categories` 500 오류 수정 — `findAll()` → `findAllWithSlaves()` 교체로 LazyInitializationException 해결

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/main/java/.../controller/UserQuizController.java | 수정 | getCategories()에서 findAll() → findAllWithSlaves() |

### 수정 상세

#### `UserQuizController.getCategories()`
- 변경 전: `domainMasterRepository.findAll().stream().map(DomainMasterResponse::from).toList()`
- 변경 후: `domainMasterRepository.findAllWithSlaves().stream().map(DomainMasterResponse::from).toList()`
- 이유: `DomainMasterResponse.from()`이 `master.getSlaves()`를 접근하는데, `findAll()`은 slaves를 지연 로딩으로 가져옴. 트랜잭션 범위 밖에서 접근 시 `LazyInitializationException` 발생. `findAllWithSlaves()`는 LEFT JOIN FETCH로 slaves를 즉시 로딩하여 해결

### 복원 방법

HIST-20260421-037 복원 시:
- `UserQuizController.getCategories()`에서 `findAllWithSlaves()` → `findAll()`로 되돌림

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
