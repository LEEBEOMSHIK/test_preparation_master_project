## HIST-20260516-001

- **날짜**: 2026-05-16
- **수정 범위**: 관리자 백엔드 / 로그인 히스토리 + 대시보드 통계
- **수정 개요**: 로그인 이력 추적 기능 및 대시보드 통계 API 신규 구현

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/entity/LoginHistory.java` | 추가 | 로그인 히스토리 엔티티 |
| `backend/src/main/java/com/tpmp/testprep/repository/LoginHistoryRepository.java` | 추가 | 로그인 히스토리 JPA Repository |
| `backend/src/main/java/com/tpmp/testprep/service/LoginHistoryService.java` | 추가 | 히스토리 기록/조회/집계 서비스 |
| `backend/src/main/java/com/tpmp/testprep/controller/AdminLoginHistoryController.java` | 추가 | GET /api/admin/login-history 엔드포인트 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/LoginHistoryResponse.java` | 추가 | 로그인 히스토리 응답 DTO |
| `backend/src/main/java/com/tpmp/testprep/dto/response/PagedResponse.java` | 추가 | 페이징 공통 응답 DTO |
| `backend/src/main/java/com/tpmp/testprep/service/DashboardService.java` | 추가 | 대시보드 통계 집계 서비스 |
| `backend/src/main/java/com/tpmp/testprep/controller/AdminDashboardController.java` | 추가 | GET /api/admin/dashboard/stats 엔드포인트 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/DashboardStatsResponse.java` | 추가 | 대시보드 통계 응답 DTO |
| `backend/src/main/java/com/tpmp/testprep/service/AuthService.java` | 수정 | login() 메서드에 HttpServletRequest 추가 + loginHistoryService.recordLogin() 호출 |
| `backend/src/main/java/com/tpmp/testprep/controller/AuthController.java` | 수정 | login() 엔드포인트에 HttpServletRequest 파라미터 추가 |
| `backend/src/main/java/com/tpmp/testprep/repository/InquiryRepository.java` | 수정 | countByCreatedAtBetween, countByStatus 메서드 추가 |
| `backend/src/main/java/com/tpmp/testprep/repository/ExamRepository.java` | 수정 | countByDelYn 메서드 추가 |

### 수정 상세

#### `entity/LoginHistory.java` (신규)
- 변경 전: 없음
- 변경 후: id, memberName, email, ipAddress, userAgent, loginAt 필드; @PrePersist로 loginAt 자동 설정
- 이유: 로그인 이력 저장을 위한 독립 엔티티 (BaseEntity 미상속, audit 불필요한 로그 성격)

#### `service/AuthService.java`
- 변경 전: `login(LoginRequest, HttpServletResponse)` — 히스토리 기록 없음
- 변경 후: `login(LoginRequest, HttpServletResponse, HttpServletRequest)` — X-Forwarded-For/RemoteAddr로 IP 추출, User-Agent 수집 후 LoginHistoryService.recordLogin() 호출
- 이유: 로그인 성공 시점에 이력 기록

#### `repository/LoginHistoryRepository.java` (신규)
- keyword + 날짜 범위 조합 조회를 위한 derived query 메서드 4종
- countByLoginAtBetween 집계 메서드

### 복원 방법

이 ID(HIST-20260516-001)로 복원 시:
- 신규 파일(LoginHistory, LoginHistoryRepository, LoginHistoryService, AdminLoginHistoryController, LoginHistoryResponse, PagedResponse, DashboardService, AdminDashboardController, DashboardStatsResponse) 삭제
- AuthService.login 시그니처를 `(LoginRequest, HttpServletResponse)`로 복원
- AuthController.login 파라미터에서 HttpServletRequest 제거
- InquiryRepository, ExamRepository에서 추가한 집계 메서드 제거
