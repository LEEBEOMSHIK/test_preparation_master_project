## HIST-20260802-006

- **날짜**: 2026-08-02
- **수정 범위**: 관리자 백엔드 / 대시보드
- **수정 개요**: 대시보드 추이(`getTrend`) N+1성 쿼리를 GROUP BY 집계 3쿼리로 최적화

### 문제 배경

- `getTrend(days)`가 `for (int i = days - 1; i >= 0; i--)` 루프 안에서 하루마다 `countByLoginAtBetween`/`countByTakenAtBetween`/`countByCreatedAtBetween` 3개를 개별 실행 — days=90이면 270개 쿼리를 순차 실행.
- 실측(로컬): days=7 0.18s, days=30 0.31s, days=90 0.71s로 days에 선형 비례해 느려짐. dev 서버 컴파일 지연과 달리 **운영에서도 그대로 재현**되는 구조적 문제라 최적화함.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../repository/LoginHistoryRepository.java` | 수정 | `countDailyByLoginAtBetween(from, to)` — `GROUP BY CAST(loginAt AS date)` 추가 |
| `backend/.../repository/ExamHistoryRepository.java` | 수정 | `countDailyByTakenAtBetween(from, to)` — 전체 사용자 기준 날짜별 응시 건수 집계 추가 (기존 `aggregateDailyStatsByUserAndPeriod`는 사용자별 전용이라 별도 메서드로 추가) |
| `backend/.../repository/InquiryRepository.java` | 수정 | `countDailyByCreatedAtBetween(from, to)` — `GROUP BY CAST(createdAt AS date)` 추가 |
| `backend/.../service/DashboardService.java` | 수정 | `getTrend()`를 일별 루프 대신 3개 GROUP BY 쿼리 결과를 `Map<LocalDate, Long>`으로 변환 후 날짜 순회하며 조회(누락 날짜는 0)로 재작성 |

### 수정 상세

- 쿼리 방식: 기존 `Between` 파생 메서드(`countByLoginAtBetween` 등)는 `getStats()`(오늘 하루 카운트)에서 계속 사용하므로 유지, `getTrend()`만 신규 GROUP BY 메서드로 전환.
- Hibernate가 `CAST(... AS date)` 결과를 버전/경로에 따라 `java.sql.Date` 또는 `LocalDate`로 반환할 수 있어(`UserDashboardService`의 기존 `toDateString` 패턴과 동일한 이유) `DashboardService.toDailyCountMap()`에서 두 타입을 모두 처리.
- 쿼리 수: days와 무관하게 항상 3개 고정 (기존: `days × 3`).

### 검증

- `./gradlew compileJava`, `./gradlew test` 통과.
- 재기동 후 실측: days=7 0.37s(첫 호출, JIT/커넥션 워밍업 포함) → days=30 0.15s → days=90 0.13s로 **days에 따라 느려지지 않음**(기존 대비 90일 기준 약 5.5배 개선).
- 데이터 정합성: 기존 `login_history`의 유일한 실데이터(2026-07-17, user@tpmp.com)가 `days=30` 조회에서 `07/17` 날짜에 정확히 `count:1`로 집계됨을 확인.

### 복원 방법

`DashboardService.getTrend()`를 일별 루프 + `count*Between` 호출 방식으로 되돌리고, 3개 리포지토리에 추가한 `countDailyBy*` 메서드 제거.

---

## HIST-20260528-005

- **날짜**: 2026-05-28
- **수정 범위**: 관리자 백엔드·프론트엔드 / 대시보드
- **수정 개요**: 추이 차트 기간 필터 추가 (7일 / 30일 / 3개월)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/DashboardService.java` | 수정 | getTrend(int days) — 파라미터로 기간 수신, 허용값 외 입력 시 7로 fallback |
| `backend/.../controller/AdminDashboardController.java` | 수정 | `@RequestParam(defaultValue = "7") int days` 추가 |
| `frontend/src/services/adminDashboardService.ts` | 수정 | getTrend(days) — 7\|30\|90 타입 파라미터 추가 |
| `frontend/src/app/admin/dashboard/page.tsx` | 수정 | Period 탭(7일/30일/3개월) 추가, period 변경 시 useEffect 재실행 |

### 수정 상세

#### `DashboardService.java`
- 변경 전: `getTrend()` — 항상 7일 고정
- 변경 후: `getTrend(int days)` — 7/30/90 허용, 그 외 7로 보정, `for (int i = days - 1; i >= 0; i--)` 루프

#### `dashboard/page.tsx`
- 변경 전: 단일 `loadingTrend` useEffect
- 변경 후: `period` state (7\|30\|90) 추가, Period 탭 UI (회색 pill 스타일), `useEffect([period])` 의존성으로 기간 변경 시 자동 재조회, XAxis `interval` 기간별 자동 조정 (7→0, 30→4, 90→13)

### 복원 방법

getTrend 파라미터를 제거하고 hardcode 6일(`i=6`), 프론트에서 period 상태와 탭 UI 제거.

---

## HIST-20260528-003

- **날짜**: 2026-05-28
- **수정 범위**: 관리자 백엔드 / 대시보드
- **수정 개요**: 관리자 로그인 이력 제외 버그 수정 + 최근 7일 추이 API 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/AuthService.java` | 수정 | 로그인 이력 기록 시 ROLE_USER만 저장하도록 조건 추가 |
| `backend/.../dto/response/DashboardTrendResponse.java` | 추가 | 7일 추이 응답 DTO (DayCount 중첩 레코드) |
| `backend/.../service/DashboardService.java` | 수정 | LoginHistoryRepository·ExamHistoryRepository 직접 주입, getTrend() 메서드 추가 |
| `backend/.../controller/AdminDashboardController.java` | 수정 | GET /api/admin/dashboard/trend 엔드포인트 추가 |

### 수정 상세

#### `AuthService.java`
- 변경 전: 역할 구분 없이 모든 로그인 이력 기록 (`loginHistoryService.recordLogin(...)`)
- 변경 후: `if (user.getRole() == User.Role.USER)` 조건 추가 — 관리자 로그인은 이력에 기록하지 않음
- 이유: 대시보드 "오늘 로그인" 카운트에 관리자 본인이 포함되는 버그 수정

#### `DashboardTrendResponse.java`
- 변경 전: 파일 없음
- 변경 후: `List<DayCount> loginTrend / examTrend / inquiryTrend` + 중첩 레코드 `DayCount(String date, long count)`

#### `DashboardService.java`
- 변경 전: LoginHistoryService·ExamHistoryService만 주입
- 변경 후: LoginHistoryRepository·ExamHistoryRepository 추가 주입, getTrend() — 오늘 기준 6일 전부터 오늘까지 날짜별 카운트 반복 조회 (MM/dd 형식 레이블)

#### `AdminDashboardController.java`
- 변경 전: GET /stats 엔드포인트만 존재
- 변경 후: GET /trend 엔드포인트 추가

### 복원 방법

이 ID(HIST-20260528-003)만으로 복원 시:
- `AuthService.java` role check 조건 제거
- `DashboardTrendResponse.java` 삭제
- `DashboardService.java`에서 추가된 repository 주입·getTrend() 제거
- `AdminDashboardController.java`에서 trend 엔드포인트 제거
