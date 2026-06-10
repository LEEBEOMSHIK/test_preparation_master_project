## HIST-20260611-001

- **날짜**: 2026-06-11
- **수정 범위**: 사용자 백엔드 / 통계 대시보드
- **수정 개요**: 사용자 시험 응시 이력 기반 통계 대시보드 API 신규 구현 (총 풀이·정답률·도메인별·날짜별·약점 Top5)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/repository/ExamHistoryRepository.java` | 수정 | 사용자별 집계 JPQL 메서드 3개 추가 |
| `backend/src/main/java/com/tpmp/testprep/dto/response/DomainStatResponse.java` | 추가 | 도메인 통계 응답 record |
| `backend/src/main/java/com/tpmp/testprep/dto/response/DailyStatResponse.java` | 추가 | 날짜별 통계 응답 record |
| `backend/src/main/java/com/tpmp/testprep/dto/response/UserDashboardResponse.java` | 추가 | 사용자 대시보드 통합 응답 record |
| `backend/src/main/java/com/tpmp/testprep/service/UserDashboardService.java` | 추가 | 통계 집계 서비스 |
| `backend/src/main/java/com/tpmp/testprep/controller/UserDashboardController.java` | 추가 | GET /api/user/dashboard/stats 엔드포인트 |

### 수정 상세

#### `ExamHistoryRepository.java`
- 변경 전: 관리자용 집계 메서드만 존재 (countByTakenAtBetween 등)
- 변경 후: 사용자별 3개 집계 JPQL 추가
  - `sumTotalAndCorrectByUserAndPeriod` — 전체 문항/정답 SUM
  - `aggregateDomainStatsByUserAndPeriod` — 도메인별 GROUP BY, 정답률 ASC 정렬
  - `aggregateDailyStatsByUserAndPeriod` — 날짜별 GROUP BY, ASC 정렬
- 이유: DB 집계로 N+1/OOM 방지, category IS NOT NULL INNER JOIN으로 null 도메인 제외

#### `UserDashboardService.java` (신규)
- 변경 전: 없음
- 변경 후: `getDashboard(email, days)` 구현
  - days=0이면 from=2000-01-01 (전체), 아니면 now().minusDays(days)
  - Object[] 집계 결과를 DTO로 변환, java.sql.Date/LocalDate 모두 처리
  - weakDomains = domainStats (정답률 ASC 정렬) 앞 5개 추출
- 이유: @Transactional(readOnly=true)로 읽기 최적화

#### `UserDashboardController.java` (신규)
- 변경 전: 없음
- 변경 후: GET /api/user/dashboard/stats, @AuthenticationPrincipal String email, @RequestParam(defaultValue="30") int days
- 이유: /api/user/** 는 SecurityConfig에서 authenticated() 처리 완료되어 별도 보안 설정 불필요

### 복원 방법
이 ID(HIST-20260611-001)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.
- ExamHistoryRepository.java: 추가된 3개 @Query 메서드 및 import 제거
- DomainStatResponse.java, DailyStatResponse.java, UserDashboardResponse.java: 파일 삭제
- UserDashboardService.java: 파일 삭제
- UserDashboardController.java: 파일 삭제

### 주의사항
- MenuConfig DB 테이블에 `/user/dashboard` 경로와 `dashboard` iconKey를 가진 항목을 관리자 메뉴 관리에서 별도 등록해야 API 기반 네비게이션이 정상 동작한다. (현재는 USER_FALLBACK_NAV에만 추가된 상태)
