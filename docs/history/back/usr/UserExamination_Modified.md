## HIST-20260613-002

- **날짜**: 2026-06-13
- **수정 범위**: 사용자 백엔드 / 시험 상세 DTO
- **수정 개요**: Service→Controller 레이어 역전 해소 — inner record(ExaminationDetailView, QuestionView)를 dto/response 패키지로 이동(ExaminationDetailResponse, ExaminationQuestionView)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../dto/response/ExaminationDetailResponse.java` | 추가 | ExaminationDetailView record를 dto/response로 이동, 클래스명 변경 |
| `backend/.../dto/response/ExaminationQuestionView.java` | 추가 | QuestionView record를 dto/response로 이동, 클래스명 변경 |
| `backend/.../service/UserExaminationService.java` | 수정 | controller import 제거, ExaminationDetailResponse 반환 타입으로 교체 |
| `backend/.../controller/UserExaminationController.java` | 수정 | inner record(ExaminationDetailView·QuestionView) 제거, ExaminationDetailResponse import 추가, 핸들러 반환 타입 갱신 |

### 수정 상세

#### `ExaminationDetailResponse.java` (신규)
- 변경 전: 존재하지 않음 (UserExaminationController의 inner record ExaminationDetailView)
- 변경 후: `dto/response` 패키지 record, 7개 필드(id/title/examPaperId/examPaperTitle/categoryName/timeLimit/questions) + 정적 팩토리 `of(Examination, List<Question>)` 동일 유지
- 이유: Service가 Controller 타입에 의존하는 레이어 역전 해소

#### `ExaminationQuestionView.java` (신규)
- 변경 전: 존재하지 않음 (UserExaminationController의 inner record QuestionView)
- 변경 후: `dto/response` 패키지 record, 7개 필드(id/seq/content/questionType/options/code/language) + 정적 팩토리 `from(Question)` 동일 유지
- 이유: 동반 타입(ExaminationDetailResponse.questions 요소)도 dto/response로 일관 이동

#### `UserExaminationService.java`
- 변경 전: `import com.tpmp.testprep.controller.UserExaminationController.ExaminationDetailView;` / 반환타입 `ExaminationDetailView`
- 변경 후: `import com.tpmp.testprep.dto.response.ExaminationDetailResponse;` / 반환타입 `ExaminationDetailResponse`
- 이유: controller 패키지 의존 제거

#### `UserExaminationController.java`
- 변경 전: inner record `ExaminationDetailView`, `QuestionView` 정의 포함 / 핸들러 반환 `ApiResponse<ExaminationDetailView>`
- 변경 후: inner record 제거 / `import ExaminationDetailResponse` / 핸들러 반환 `ApiResponse<ExaminationDetailResponse>` / 미사용 import(Examination·Question·List) 제거
- 이유: 레이어 역전 해소 + 미사용 entity import 정리

### 동작 보존 확인 포인트

| 항목 | 보존 여부 |
|------|-----------|
| 응답 JSON 필드 7개(id/title/examPaperId/examPaperTitle/categoryName/timeLimit/questions[]) | 동일 |
| questions[] 내 필드 7개(id/seq/content/questionType/options/code/language) | 동일 |
| RANDOM 모드 Collections.shuffle — Service에 유지 | 동일 |
| `of` / `from` 정적 팩토리 생성 로직 | 동일 |
| 채점·이력저장·예외처리 로직 | 무변경 |

### 복원 방법
이 ID(HIST-20260613-002)만으로 복원 시:
1. `ExaminationDetailResponse.java`, `ExaminationQuestionView.java` 삭제
2. `UserExaminationController.java`에 inner record `ExaminationDetailView`·`QuestionView` 복원 및 관련 import 복원
3. `UserExaminationService.java`의 import를 `controller.UserExaminationController.ExaminationDetailView`로, 반환 타입을 `ExaminationDetailView`로 복원

---

## HIST-20260613-001

- **날짜**: 2026-06-13
- **수정 범위**: 사용자 백엔드 / 시험 조회·상세·제출
- **수정 개요**: UserExaminationController의 3레이어 분리 위반 해소 — Repository 직접 주입 제거, 비즈니스 로직을 UserExaminationService로 이전 (동작 100% 보존)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/UserExaminationService.java` | 추가 | 사용자 전용 시험 Service 신설 (목록·상세·제출 로직 이전) |
| `backend/src/main/java/com/tpmp/testprep/controller/UserExaminationController.java` | 수정 | Repository 4개 직접 주입 제거, UserExaminationService 단독 주입으로 전환, @Transactional 제거 |

### Service 구조 선택 근거

**`UserExaminationService` 신설** (기존 `ExaminationService` 확장 아님)

- `ExaminationService`는 관리자 CRUD 전담 (`AdminExaminationController`에서만 사용)
- 프로젝트 패턴: 사용자 전용 기능은 별도 Service로 분리 (`UserDashboardService`, `PracticeService` 등 다수 존재)
- 사용자용 제출/채점/이력저장은 `ExamHistoryRepository`, `UserRepository` 추가 의존이 필요해 관심사가 명확히 다름
- `ExaminationService` 기존 메서드 시그니처 무변경 보장

### 수정 상세

#### `UserExaminationController.java`
- 변경 전:
  - `ExaminationRepository`, `QuestionRepository`, `UserRepository`, `ExamHistoryRepository` 4개 Repository 직접 주입
  - `getExaminationDetail`: examinationRepository·questionRepository 직접 호출 + 셔플 + DTO 조립 인라인
  - `submitExam`: 조회·채점·점수계산·이력저장 전체 인라인, `@Transactional` 컨트롤러에 선언
  - `getExaminations`: `examinationRepository.findAllWithDetails().map(...)` 인라인
- 변경 후:
  - `UserExaminationService` 단독 주입
  - 각 핸들러: 파라미터 수신 → Service 호출 → `ApiResponse.success(result)` 반환만 수행
  - `@Transactional` 제거 (Service 레이어로 이동)
  - `ExaminationDetailView`, `QuestionView` record를 dto/response로 이동(레이어 역전 해소) → `ExaminationDetailResponse`, `ExaminationQuestionView` ※ HIST-20260613-001 정정: 최초 기술("record 위치 유지")은 이후 HIST-20260613-002 작업으로 해소됨
- 이유: CLAUDE.md "Controller → Service → Repository" 3레이어 원칙 준수

#### `UserExaminationService.java` (신규)
- 변경 전: 존재하지 않음
- 변경 후:
  - `getExaminations(Pageable)` → `Page<ExaminationResponse>` 반환
  - `getExaminationDetail(Long id)` → `ExaminationDetailView` 반환 (RANDOM 모드 셔플 포함)
  - `submitExam(Long id, Map<Long,String> answers, String email)` → `ExaminationSubmitResponse` 반환
  - `@Transactional(readOnly = true)` 클래스 기본, `submitExam`에 `@Transactional` 오버라이드
  - `ExamHistory` 저장 로직 동일하게 이전 (user 조회 → builder 패턴 → save)
- 이유: 비즈니스 로직을 Service 레이어로 분리

### 동작 보존 확인 포인트

| 항목 | 보존 여부 |
|------|-----------|
| `GET /api/user/examinations` 응답 (`Page<ExaminationResponse>`) | 동일 |
| `GET /api/user/examinations/{id}` 응답 (`ExaminationDetailView` 필드) | 동일 |
| RANDOM 모드 시 `Collections.shuffle(questions)` | 동일 |
| `POST /api/user/examinations/{id}/submit` 채점 로직 | 동일 |
| 점수 계산식 (`Math.round(correct * 100.0 / total)`) | 동일 |
| `ExamHistory` 저장 (user·examination·totalQuestions·correctCount·score) | 동일 |
| `ErrorCode.EXAMINATION_NOT_FOUND`, `USER_NOT_FOUND` 예외 | 동일 |
| `@AuthenticationPrincipal String email` → Service에 인자 전달 | 동일 |

### 컨트롤러에서 제거된 Repository 주입

- `ExaminationRepository` 제거
- `QuestionRepository` 제거
- `UserRepository` 제거
- `ExamHistoryRepository` 제거

### 복원 방법
이 ID(HIST-20260613-001)만으로 복원 시:
1. `UserExaminationService.java` 파일 삭제
2. `UserExaminationController.java`를 변경 전 상태(Repository 4개 직접 주입, 로직 인라인)로 복원
