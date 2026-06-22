## HIST-20260622-001

- **날짜**: 2026-06-22
- **수정 범위**: 사용자 백엔드 / 통계 대시보드
- **수정 개요**: 대시보드 통계에 퀴즈 이력 합산 — `QuizHistoryRepository` 주입, 총 문항·도메인별·날짜별 집계를 시험+퀴즈 병합 후 반환

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/UserDashboardService.java` | 수정 | `QuizHistoryRepository` 주입, `getDashboard`에 퀴즈 집계 병합 로직 추가, `toDateString` 헬퍼 추출 |

### 수정 상세

#### `UserDashboardService.java`
- 변경 전: `ExamHistoryRepository`만 집계. 총 문항/정답, 도메인별, 날짜별 모두 시험 이력만 반영.
- 변경 후:
  - 총 문항/정답: `examTotals + quizTotals` 합산
  - 도메인별: `examHistoryRepository.aggregateDomainStats` + `quizHistoryRepository.aggregateDomainStats`를 도메인명 기준 `Map<String, long[]>` 병합 → 정답률 ASC 정렬 (`DomainStatResponse::correctRate`)
  - 날짜별: `examHistoryRepository.aggregateDailyStats` + `quizHistoryRepository.aggregateDailyStats`를 날짜 문자열 기준 병합 → 날짜 ASC 정렬
  - `toDateString(Object)` 헬퍼 추출 (java.sql.Date/LocalDate 처리, 기존 인라인 코드 이동)
  - DTO·응답 구조 무변경 (`UserDashboardResponse`, `DomainStatResponse`, `DailyStatResponse`)
- 이유: 퀴즈 풀이 이력이 quiz_history에 쌓이기 시작하므로 대시보드 통계에 반영

### 복원 방법
이 ID(HIST-20260622-001)만으로 복원 시:
1. `UserDashboardService.java`에서 `QuizHistoryRepository quizHistoryRepository` 필드 제거, import 제거
2. `getDashboard`의 퀴즈 합산 부분 제거 — 기존 `examHistoryRepository` 단독 집계 로직으로 되돌림
3. `toDateString` 헬퍼 제거 후 날짜 변환 로직을 `dailyTrend` 스트림 내부에 인라인 복원

---

## HIST-20260613-001

- **날짜**: 2026-06-13
- **수정 범위**: 사용자 백엔드 / 통계 대시보드
- **수정 개요**: 집계 쿼리 결과 ClassCastException 수정 — exam_history에 데이터가 생기면 대시보드 통계 API가 500 나던 버그

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/UserDashboardService.java` | 수정 | 단일 행 집계 결과의 중첩 배열 언랩 헬퍼(`normalizeSingleAggregateRow`, `longValueAt`) 추가 |

### 수정 상세

#### `UserDashboardService.java`
- 증상: 시험 응시 결과(ExamHistory) 영속화 버그 수정 후 exam_history에 데이터가 쌓이자, `getDashboard`의 `sumTotalAndCorrectByUserAndPeriod` 결과를 `((Number) totals[0])`로 캐스팅하다 `ClassCastException: [Ljava.lang.Object; cannot be cast to Number` 발생(L48). 데이터가 없을 땐 `[null,null]`이라 안 터졌음.
- 원인: 단일 행 다중 컬럼 집계 쿼리(`Object[]` 반환)가 Hibernate 경로에 따라 `[[sum1,sum2]]`로 한 번 더 감싸져 반환됨. `totals[0]`이 Number가 아닌 `Object[]`.
- 수정: `normalizeSingleAggregateRow(row)`로 `length==1 && row[0] instanceof Object[]`이면 내부 배열을 꺼내고, `longValueAt(row, i)`로 안전하게 long 추출.

### 복원 방법
이 ID(HIST-20260613-001)로 복원 시 두 헬퍼를 제거하고 `totals[0]/totals[1]`을 직접 캐스팅하는 원래 코드로 되돌린다(단, exam_history에 데이터가 있으면 다시 500 발생).

---

## HIST-20260612-001

- **날짜**: 2026-06-12
- **수정 범위**: 사용자 백엔드 / 통계 대시보드
- **수정 개요**: DataInitializer에 `ensureDashboardMenu()` 추가 — `/user/dashboard` 메뉴를 MenuConfig DB에 멱등 시딩

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java` | 수정 | `ensureDashboardMenu()` 메서드 추가 및 `run()`에서 호출 |

### 수정 상세

#### `DataInitializer.java`
- 변경 전: `ensureDashboardMenu()` 없음. `run()` 내 `ensureBookmarkMenu()` 다음에 바로 `ensurePracticeAdminMenus()` 호출.
- 변경 후:
  - `ensureDashboardMenu()` 신규 추가 — `existsByUrl("/user/dashboard")` 체크 후 없으면 `saveMenu(null, "통계 대시보드", "/user/dashboard", "dashboard", -1, MenuConfig.MenuType.USER, "USER,ADMIN")` 실행
  - `run()` 내 `ensureBookmarkMenu()` 바로 아래 `ensureDashboardMenu()` 호출 추가 (ensurePermissionMenuAssociations 이전이므로 GENERAL_USER allowedRoles 자동 연결 적용됨)
- displayOrder 선택 근거: USER 메뉴 중 `/user/exam-info`가 displayOrder=0(최상단), 그 외 exams=1~inquiries=5, practice=7, bookmarks=8 순서. 프론트엔드 USER_FALLBACK_NAV에서 dashboard가 displayOrder=0으로 최상단에 위치. dashboard를 exam-info보다도 앞에 두기 위해 displayOrder=-1로 설정.
- 이유: frontend USER_FALLBACK_NAV에만 있던 dashboard 메뉴를 DB 기반 네비게이션과 일치시키기 위한 시딩 추가

### 복원 방법
이 ID(HIST-20260612-001)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 적용한다.
- `ensureDashboardMenu()` 메서드 삭제
- `run()` 내 `ensureDashboardMenu();` 호출 라인 삭제

---

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
