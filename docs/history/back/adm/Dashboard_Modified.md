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
