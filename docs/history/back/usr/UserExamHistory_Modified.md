## HIST-20260614-001

- **날짜**: 2026-06-14
- **수정 범위**: 사용자 백엔드 / 시험 이력 목록 + 과거 응시 결과 재조회
- **수정 개요**: 사용자 전체 응시 이력 페이징 조회 및 과거 단건 결과 재조회 API 구현

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/repository/ExamHistoryRepository.java` | 수정 | `findByUser_IdOrderByTakenAtDesc`, `findByIdAndUser_Id` 메서드 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/UserExamHistoryResponse.java` | 추가 | 사용자 이력 목록 응답 DTO (record, from() 팩토리) |
| `backend/src/main/java/com/tpmp/testprep/service/UserExaminationService.java` | 수정 | `getUserExamHistories`, `getUserExamHistoryResult` 메서드 추가 |
| `backend/src/main/java/com/tpmp/testprep/controller/UserExaminationController.java` | 수정 | `GET /history`, `GET /history/{historyId}` 엔드포인트 추가 |
| `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java` | 수정 | `ensureExamHistoryMenu()` 추가, run()에서 호출 |

### 수정 상세

#### `ExamHistoryRepository.java`
- 변경 전: `findTopByUser_IdAndExamination_IdOrderByTakenAtDesc` 등 관리자용/통계용 쿼리만 존재
- 변경 후: 사용자 전체 이력 페이징 조회(`findByUser_IdOrderByTakenAtDesc`) + 소유권 검증 단건 조회(`findByIdAndUser_Id`) 추가
- 이유: 사용자 이력 목록 API 및 과거 결과 재조회 API 지원

#### `UserExamHistoryResponse.java` (신규)
- 변경 전: 없음
- 변경 후: `record UserExamHistoryResponse(id, examinationTitle, totalQuestions, correctCount, score, takenAt)`, `from(ExamHistory)` 팩토리 포함. userName/userEmail 미노출(본인 화면 최소 노출 원칙)
- 이유: 이력 목록 응답 전용 DTO

#### `UserExaminationService.java`
- 변경 전: `getExaminations`, `getExaminationDetail`, `submitExam`, `getLatestResult` 4개 메서드
- 변경 후: `getUserExamHistories(email, pageable) -> PagedResponse<UserExamHistoryResponse>`, `getUserExamHistoryResult(historyId, email) -> ExamHistoryDetailResponse` 추가. 후자는 `findByIdAndUser_Id`로 소유권 검증 후 없으면 `EXAM_HISTORY_NOT_FOUND`
- 이유: 이력 목록 및 단건 재조회 서비스 로직

#### `UserExaminationController.java`
- 변경 전: 4개 핸들러(`GET /`, `GET /{id}`, `POST /{id}/submit`, `GET /{id}/result`)
- 변경 후: `GET /history`(이력 목록), `GET /history/{historyId}`(단건 결과) 2개 핸들러 추가. 리터럴 경로 `/history`가 `/{id}` Long 변환 실패로 자연 비충돌
- 이유: 이력 관련 엔드포인트 노출

#### `DataInitializer.java`
- 변경 전: `ensureBookmarkMenu()` → `ensureDashboardMenu()` 순 호출
- 변경 후: `ensureExamHistoryMenu()` 메서드 추가 및 두 메서드 사이에 호출. url `/user/exam-history`, name `시험 이력`, iconKey `history`, displayOrder 9, MenuType USER, allowedRoles `USER,ADMIN`
- 이유: 서버 시작 시 메뉴 자동 등록

### 복원 방법
HIST-20260614-001 복원 시:
- `ExamHistoryRepository.java`에서 추가된 두 메서드(`findByUser_IdOrderByTakenAtDesc`, `findByIdAndUser_Id`) 제거
- `UserExamHistoryResponse.java` 파일 삭제
- `UserExaminationService.java`에서 추가된 두 메서드 및 관련 import(`PagedResponse`, `UserExamHistoryResponse`) 제거
- `UserExaminationController.java`에서 추가된 두 핸들러 및 관련 import 제거
- `DataInitializer.java`에서 `ensureExamHistoryMenu()` 메서드 및 run() 내 호출 제거
