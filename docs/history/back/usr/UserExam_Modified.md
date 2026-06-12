## HIST-20260613-001

- **날짜**: 2026-06-13
- **수정 범위**: 사용자 백엔드 / 시험 제출 이력 저장 버그 수정
- **수정 개요**: submitExam이 채점만 하고 ExamHistory를 저장하지 않던 버그 수정 — UserRepository·ExamHistoryRepository 주입, @AuthenticationPrincipal로 로그인 사용자 식별 후 제출 트랜잭션 내 이력 저장 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../controller/UserExaminationController.java` | 수정 | UserRepository·ExamHistoryRepository final 필드 추가, submitExam에 `@AuthenticationPrincipal String email` 파라미터 및 `@Transactional` 추가, 채점 후 ExamHistory.builder()로 이력 저장 |

### 수정 상세

#### `UserExaminationController.java`
- 변경 전: `submitExam(@PathVariable Long id, @RequestBody Map<Long,String> answers)` — 채점 후 `ExaminationSubmitResponse` 반환만. `UserRepository`, `ExamHistoryRepository` 미주입.
- 변경 후: `submitExam(@PathVariable Long id, @RequestBody Map<Long,String> answers, @AuthenticationPrincipal String email)` — 채점 완료 후 `userRepository.findByEmail(email)`으로 User 조회, `ExamHistory.builder().user(user).examination(examination).totalQuestions(total).correctCount(correct).score((double) score).build()` 저장. `@Transactional` 어노테이션 추가.
- 이유: 채점 결과가 DB에 저장되지 않아 UserDashboardService 통계 집계 및 관리자 시험 이력 화면이 항상 0/빈 값으로 표시되던 버그

### ExamHistory 빌더 확인 결과
- `takenAt`: `@PrePersist`로 자동 설정 → 빌더 파라미터 없음
- `score` 타입: `double` → `(double) score` 캐스팅 적용 (계산은 `int`, 저장은 `double`)
- 빌더 파라미터: `user, examination, totalQuestions, correctCount, score` 5개

### 실제 응시 흐름 추적 결과

**Live 경로 (실제 사용자 클릭 시 도달):**
1. `/user/exams` 목록 페이지 → 시험 카드 클릭 → 팝업 → "시험 시작" 버튼
2. `router.push('/exam/${selectedExam.id}')` → `/exam/[id]/page.tsx` 렌더링
3. `examinationService.userSubmitExamination(examId, answers)` 호출
4. **`POST /api/user/examinations/{id}/submit`** (신형 `UserExaminationController`) 도달 → **이번 수정 대상**

**구형 경로 (현재 진입 불가):**
- `/user/exams/[id]/page.tsx`는 `examService.submitExam()` → `POST /api/user/exams/{id}/submit` (구형 `UserExamController`)
- 현재 `/user/exams` 목록 페이지가 신형(`examinationService.userGetExaminations`)만 사용하고 구형 URL로 라우팅하지 않으므로 사용자가 이 경로를 타지 않음
- 구형 `UserExamController`는 `Exam` 기반이라 `Examination` FK를 갖는 `ExamHistory`를 만들 수 없어, 구형 처리는 별도 작업(#2)에서 다룰 예정

### 복원 방법
이 ID(HIST-20260613-001)만으로 복원 시: `UserExaminationController`에서 `UserRepository·ExamHistoryRepository` final 필드 제거, `submitExam` 시그니처에서 `@AuthenticationPrincipal String email` 제거, `@Transactional` 제거, 이력 저장 블록(`User user = ...` ~ `examHistoryRepository.save(...)`) 제거. import 4개(`ExamHistory`, `User`, `ExamHistoryRepository`, `UserRepository`, `AuthenticationPrincipal`, `Transactional`) 제거.

---

## HIST-20260612-001

- **날짜**: 2026-06-12
- **수정 범위**: 사용자 백엔드 / 시험 제출 채점 (신형 Examination + 구형 Exam 두 흐름)
- **수정 개요**: 시험 제출 응답에 문항별 정오·정답·해설 포함 (MVP: 영속화 없음, 새로고침 시 재조회 불가)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../dto/response/QuestionResultResponse.java` | 추가 | 문항별 정오·정답·해설 DTO record, `of(Question, userAnswer, correct)` 팩토리 |
| `backend/.../dto/response/ExaminationSubmitResponse.java` | 추가 | 시험 제출 결과 DTO record (total/correct/score/results) |
| `backend/.../controller/UserExaminationController.java` | 수정 | `submitExam` 반환 타입 `SubmitResult` → `ExaminationSubmitResponse`로 교체, 채점 루프에서 `QuestionResultResponse` 수집, 인라인 `SubmitResult` record 제거 |
| `backend/.../controller/UserExamController.java` | 수정 | 동일 패턴 적용. `SubmitResult` record 제거, `ArrayList` import 추가 |

### 수정 상세

#### `UserExaminationController.java`
- 변경 전: `ResponseEntity<ApiResponse<SubmitResult>>`, 채점 루프에서 `correct` 집계만, `record SubmitResult(int total, int correct, int score) {}`
- 변경 후: `ResponseEntity<ApiResponse<ExaminationSubmitResponse>>`, 채점 루프에서 `QuestionResultResponse.of()` 수집, `ExaminationSubmitResponse.of(total, correct, score, results)` 반환. 인라인 record 제거.
- 이유: 결과 화면에서 문항별 정오/정답/해설 표시를 위해 응답 확장

#### `UserExamController.java`
- 변경 전: `ResponseEntity<ApiResponse<SubmitResult>>`, `record SubmitResult(int total, int correct, int score) {}`
- 변경 후: `ResponseEntity<ApiResponse<ExaminationSubmitResponse>>`, 동일 패턴. import 정리(ArrayList 추가).
- 이유: 구형 시험 흐름에도 동일 결과 확장 적용

#### STEP4 본문 형식 불일치 해소
- 기존 `examService.submitExam`이 `{ answers }` 래핑 전송 → BE `Map<Long,String>` 직접 수신 불일치 확인
- FE `examService.ts`의 호출부를 `answers` 직접 전달로 수정(FE STEP7에서 처리)

### MVP 제약사항
새로고침 시 문항별 결과를 재조회할 수 없음(의도된 제한). DB 저장 없이 제출 응답에만 포함.

### 복원 방법
이 ID(HIST-20260612-001)만으로 복원 시: 두 컨트롤러의 `submitExam`을 변경 전 `SubmitResult` record 사용 코드로 되돌리고, 두 DTO 파일(`QuestionResultResponse.java`, `ExaminationSubmitResponse.java`)을 삭제한다.

---

## HIST-20260430-013

- **날짜**: 2026-04-30
- **수정 범위**: 사용자 백엔드 / 시험 관리, 퀴즈
- **수정 개요**: Exam 엔티티에 del_yn 소프트 삭제 추가, ExamService/ExamRepository를 del_yn 필터링으로 전환, UserQuizController 정답 확인 시 삭제된 문항 방어 처리

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/Exam.java` | 수정 | `del_yn` 컬럼 필드 및 `softDelete()` 메서드 추가 |
| `backend/src/main/java/com/tpmp/testprep/repository/ExamRepository.java` | 수정 | `findAllByDelYn`, `findByIdAndDelYn` 메서드 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/ExamService.java` | 수정 | `getExams`, `getExamDetail`, `deleteExam` del_yn 필터링 적용 |
| `backend/src/main/java/com/tpmp/testprep/controller/UserQuizController.java` | 수정 | `checkAnswer`에서 삭제된 문항(`del_yn=Y`) 방어 처리 추가 |

### 수정 상세

#### `entity/Exam.java`
- 변경 전: `del_yn` 컬럼 없음, `deleteExam`은 실제 DB 삭제
- 변경 후: `@Column(name = "del_yn") private String delYn = "N"` 추가, `softDelete()` 메서드 추가
- 이유: 소프트 삭제 지원으로 데이터 복원 가능성 확보

#### `repository/ExamRepository.java`
- 변경 전: `findAll(Pageable)` 단일 메서드
- 변경 후: `findAllByDelYn(String, Pageable)`, `findByIdAndDelYn(Long, String)` 추가
- 이유: del_yn 조건부 조회를 위한 JPA derived query

#### `service/ExamService.java`
- 변경 전: `findAll(pageable)`, `findById(id)`, `examRepository.delete(exam)`
- 변경 후: `findAllByDelYn("N", pageable)`, `findByIdAndDelYn(id, "N")`, `exam.softDelete()`
- 이유: 삭제된 시험이 목록/상세 조회에 노출되지 않도록 하고 물리 삭제를 소프트 삭제로 전환

#### `controller/UserQuizController.java`
- 변경 전: `questionBankRepository.findById(request.questionId()).orElseThrow()`
- 변경 후: `.filter(q -> "N".equals(q.getDelYn()))` 체인 추가
- 이유: 삭제된 문항으로 정답 확인 요청이 오는 경우 방어

### 복원 방법

이 ID(HIST-20260430-013)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.

---
