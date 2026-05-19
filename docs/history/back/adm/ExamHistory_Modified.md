## HIST-20260516-002

- **날짜**: 2026-05-16
- **수정 범위**: 관리자 백엔드 / 시험 이력
- **수정 개요**: 시험 응시 이력 조회 기능 및 대시보드 통계 신규 구현

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| backend/src/main/java/com/tpmp/testprep/entity/ExamHistory.java | 추가 | 시험 응시 이력 엔티티 (user, examination, score, takenAt) |
| backend/src/main/java/com/tpmp/testprep/dto/response/ExamHistoryResponse.java | 추가 | 시험 이력 응답 DTO (record 타입, from() 팩토리 메서드) |
| backend/src/main/java/com/tpmp/testprep/repository/ExamHistoryRepository.java | 추가 | 시험 이력 레포지토리 (날짜 범위 + 키워드 타입별 조회 메서드) |
| backend/src/main/java/com/tpmp/testprep/service/ExamHistoryService.java | 추가 | 시험 이력 서비스 (페이징 조회, 오늘 응시 횟수 집계) |
| backend/src/main/java/com/tpmp/testprep/controller/AdminExamHistoryController.java | 추가 | 관리자 시험 이력 컨트롤러 (GET /api/admin/exam-history) |
| backend/src/main/java/com/tpmp/testprep/dto/response/DashboardStatsResponse.java | 수정 | todayExamAttemptCount 필드 추가 |
| backend/src/main/java/com/tpmp/testprep/service/DashboardService.java | 수정 | ExamHistoryService 주입 및 countTodayExamAttempts() 호출 추가 |

### 수정 상세

#### `backend/.../entity/ExamHistory.java`
- 변경 전: 파일 없음
- 변경 후: `exam_history` 테이블 매핑 엔티티. user(ManyToOne), examination(ManyToOne), totalQuestions, correctCount, score(double, 백분율), takenAt(@PrePersist 자동 설정). 인덱스: user_id, examination_id, taken_at
- 이유: 시험 응시 이력 영속화를 위한 신규 엔티티 필요

#### `backend/.../dto/response/ExamHistoryResponse.java`
- 변경 전: 파일 없음
- 변경 후: `record ExamHistoryResponse(id, no, userName, userEmail, examinationTitle, totalQuestions, correctCount, score, takenAt)`. `from(ExamHistory h, long no)` 팩토리 메서드로 엔티티 → DTO 변환
- 이유: API 응답 레이어 분리

#### `backend/.../repository/ExamHistoryRepository.java`
- 변경 전: 파일 없음
- 변경 후: JpaRepository 확장. `findByTakenAtBetween`, `findByUser_NameContainingIgnoreCase...`, `findByUser_EmailContainingIgnoreCase...`, `findByExamination_TitleContainingIgnoreCase...`, `countByTakenAtBetween` 메서드 선언
- 이유: 이름/이메일/시험명 타입별 검색 및 날짜 필터링 지원

#### `backend/.../service/ExamHistoryService.java`
- 변경 전: 파일 없음
- 변경 후: `getExamHistories(keyword, type, from, to, pageable)` — keyword 유무 및 type(name/email/exam)에 따라 레포지토리 메서드 분기. `countTodayExamAttempts()` — 오늘 00:00~23:59:59 범위 count 반환
- 이유: LoginHistoryService 패턴과 동일한 구조로 일관성 유지

#### `backend/.../controller/AdminExamHistoryController.java`
- 변경 전: 파일 없음
- 변경 후: `GET /api/admin/exam-history`. @PreAuthorize("hasRole('ADMIN')"). keyword, type, from, to, page, size 파라미터. takenAt DESC 정렬
- 이유: 관리자 전용 시험 이력 조회 엔드포인트

#### `backend/.../dto/response/DashboardStatsResponse.java`
- 변경 전: `record DashboardStatsResponse(todayLoginCount, todayInquiryCount, pendingInquiryCount, totalExamCount, totalMemberCount)`
- 변경 후: `record DashboardStatsResponse(todayLoginCount, todayInquiryCount, pendingInquiryCount, totalExamCount, totalMemberCount, todayExamAttemptCount)`
- 이유: 대시보드에 오늘 시험 응시 횟수 통계 추가

#### `backend/.../service/DashboardService.java`
- 변경 전: `private final LoginHistoryService loginHistoryService;` 등 4개 필드. `getStats()`에서 5개 통계 집계 후 DashboardStatsResponse 생성
- 변경 후: `private final ExamHistoryService examHistoryService;` 필드 추가. `long todayExamAttemptCount = examHistoryService.countTodayExamAttempts();` 추가. DashboardStatsResponse 생성 시 6번째 인자로 todayExamAttemptCount 전달
- 이유: 대시보드 통계에 시험 응시 집계 포함

### 복원 방법
이 ID(HIST-20260516-002)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.
- ExamHistory.java, ExamHistoryResponse.java, ExamHistoryRepository.java, ExamHistoryService.java, AdminExamHistoryController.java 삭제
- DashboardStatsResponse.java에서 `todayExamAttemptCount` 필드 제거
- DashboardService.java에서 `examHistoryService` 필드 제거 및 `getStats()` 원복
