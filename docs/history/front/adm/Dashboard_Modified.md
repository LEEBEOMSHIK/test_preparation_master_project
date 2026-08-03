## HIST-20260804-003

- **날짜**: 2026-08-04
- **수정 범위**: 관리자 프론트엔드 / 대시보드 — "오늘 퀴즈 풀이" 카드 링크 변경
- **수정 개요**: 사용자가 "퀴즈 카드가 카테고리 구분 없이 범용 DB 조회 화면(`/admin/tables/data`)으로 연결되는 게 맞냐"고 문제를 제기(의도된 카테고리 무관 집계는 맞으나, 링크 대상이 목적에 맞지 않는 화면이었음을 인정). HIST-20260804-002에서 임시로 연결했던 `/admin/tables/data`를 신규로 만든 전용 퀴즈 이력 화면 `/admin/quiz/history`(→ `docs/history/front/adm/QuizHistory_Modified.md`, `docs/history/back/adm/QuizHistory_Modified.md`)로 교체.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/dashboard/page.tsx` | 수정 | "오늘 퀴즈 풀이" `StatCard`의 `href`를 `/admin/tables/data` → `/admin/quiz/history`로 변경 |

### 검증

- 브라우저 확인: 대시보드에서 새 경로로 직접 접근 시 퀴즈 이력 목록 화면이 정상 렌더링됨을 확인(상세 검증은 `docs/history/front/adm/QuizHistory_Modified.md` 참고)

---

## HIST-20260804-002

- **날짜**: 2026-08-04
- **수정 범위**: 관리자 프론트엔드 / 대시보드 — "퀴즈" 섹션 신설
- **수정 개요**: "시험" 섹션과 나란히 "퀴즈" 섹션을 신설해 "오늘 퀴즈 풀이" 카드를 추가했다(→ `docs/history/back/adm/AdminInquiry_Modified.md` HIST-20260804-002에서 백엔드 통계 추가 부분 참고). 추이 영역에도 "퀴즈 풀이" 차트를 추가했고, 4개 차트를 깔끔히 배치하기 위해 grid를 `sm:grid-cols-3` → `sm:grid-cols-2 lg:grid-cols-4`로 조정했다. 퀴즈 이력을 위한 전용 관리자 목록 화면이 아직 없어 카드 링크는 범용 "DB 조회"(`/admin/tables/data`) 화면으로 연결했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/adminDashboardService.ts` | 수정 | `DashboardStats`에 `todayQuizAttemptCount`, `DashboardTrend`에 `quizTrend` 필드 추가 |
| `frontend/src/app/admin/dashboard/page.tsx` | 수정 | "퀴즈" `Section`(보라색) 신설 + "오늘 퀴즈 풀이" `StatCard`(질문 아이콘, `href="/admin/tables/data"`) 추가. 추이 grid에 "퀴즈 풀이" `TrendChart`(보라색 `#a855f7`) 추가, grid 컬럼 수 조정(`sm:grid-cols-3` → `sm:grid-cols-2 lg:grid-cols-4`) |

### 검증

- `npx tsc --noEmit` 통과.
- 브라우저 확인: "오늘 퀴즈 풀이" 카드에 실제 풀이 건수 반영, 추이 영역에 4개 차트(로그인/시험 응시/퀴즈 풀이/문의 접수)가 고르게 배치되고 퀴즈 풀이 차트에 당일 막대가 정상 표시됨을 확인.

---

## HIST-20260804-001

- **날짜**: 2026-08-04
- **수정 범위**: 관리자 프론트엔드 / 대시보드 — "버그 신고 대기" 카드 추가
- **수정 개요**: 문의 섹션에 "버그 신고 대기" `StatCard`를 추가해 대기 상태 버그 신고 건수를 바로 확인할 수 있게 했다(경고 아이콘, 빨간색 강조로 다른 카드와 구분). 클릭 시 `/admin/inquiries?type=BUG`로 이동해 유형 필터가 자동 적용된 목록으로 연결된다(→ `docs/history/front/adm/AdminInquiryFaq_Modified.md` 또는 문의 관리 히스토리에서 유형 필터 추가 부분 참고).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/adminDashboardService.ts` | 수정 | `DashboardStats`에 `pendingBugCount: number` 필드 추가 |
| `frontend/src/app/admin/dashboard/page.tsx` | 수정 | 문의 섹션에 "버그 신고 대기" `StatCard` 추가(경고 삼각형 아이콘, red 색상), `href="/admin/inquiries?type=BUG"` |

### 검증

- `npx tsc --noEmit` 통과.
- 브라우저 확인: 카드에 "1"(대기 중 버그 신고 건수) 정상 표시, 클릭 시 문의 관리 화면으로 이동하며 유형 필터가 "버그 신고"로 자동 선택되고 목록도 정확히 필터링됨을 확인.

---

## HIST-20260724-001

- **날짜**: 2026-07-24
- **수정 범위**: 관리자 프론트엔드 / 대시보드 — 모바일 대응
- **수정 개요**: 기간 토글("7일/30일/3개월") 버튼에 `whitespace-nowrap`이 빠져 좁은 화면에서 "7\n일"처럼 세로로 줄바꿈되던 문제 수정. 사용자 대시보드(`user/dashboard/page.tsx`)에서 동일 패턴을 고친 방식과 동일하게 적용.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/dashboard/page.tsx` | 수정 | 기간 토글 버튼 className에 `whitespace-nowrap` 추가 |

### 수정 상세

#### `frontend/src/app/admin/dashboard/page.tsx`
- 변경 전:
  ```tsx
  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
    period === value
      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
  }`}
  ```
- 변경 후:
  ```tsx
  className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
    period === value
      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
  }`}
  ```
- 이유: 좁은 화면(모바일 390px)에서 버튼 텍스트가 세로로 줄바꿈되어 가독성이 크게 저하됨. `user/dashboard/page.tsx`의 동일 토글에 이미 적용된 패턴을 그대로 이식.

### 복원 방법
이 ID(HIST-20260724-001)만으로 복원 시 `frontend/src/app/admin/dashboard/page.tsx`의 기간 토글 버튼 className에서 `whitespace-nowrap`을 제거한다.

---

## HIST-20260611-003

- **날짜**: 2026-06-11
- **수정 범위**: 관리자 프론트엔드 / 대시보드 — 빌드 타입 오류 수정
- **수정 개요**: tsc --noEmit 실패 — admin/dashboard/page.tsx의 recharts Tooltip formatter 파라미터 타입 가드 처리

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/dashboard/page.tsx` | 수정 | formatter 파라미터 타입 고정(`v: number`) 제거 → `typeof v === 'number'` 가드로 교체 |

### 수정 상세

#### `frontend/src/app/admin/dashboard/page.tsx`
- 변경 전: `formatter={(v: number) => [v.toLocaleString(), '건수']}`
- 변경 후: `formatter={(v) => [typeof v === 'number' ? v.toLocaleString() : '', '건수']}`
- 이유: recharts Formatter 제네릭은 ValueType | undefined를 수신하므로 number 고정 타입이 불일치; any 금지 원칙에 따라 typeof 가드로 처리

### 복원 방법
이 ID(HIST-20260611-003)만으로 복원 시:
- admin/dashboard/page.tsx: formatter를 `(v: number) => [v.toLocaleString(), '건수']` 형태로 되돌림 (단, 빌드 실패 재발함)

---

## HIST-20260528-004

- **날짜**: 2026-05-28
- **수정 범위**: 관리자 프론트엔드 / 대시보드
- **수정 개요**: 최근 7일 막대 그래프 추이 섹션 추가 (recharts 설치), 통계 카드 로딩 상태 분리

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/adminDashboardService.ts` | 수정 | DayCount·DashboardTrend 인터페이스 추가, getTrend() API 추가 |
| `frontend/src/app/admin/dashboard/page.tsx` | 수정 | TrendChart 컴포넌트 추가, 최근 7일 추이 섹션(로그인·시험응시·문의) 추가, loadingStats/loadingTrend 분리 |
| `frontend/package.json` | 수정 | recharts 의존성 추가 |

### 수정 상세

#### `dashboard/page.tsx`
- 변경 전: 통계 카드 6개(3섹션) + 단일 loading 상태
- 변경 후: 기존 3섹션 유지 + "최근 7일 추이" 섹션 추가 (violet 도트), loadingStats·loadingTrend 분리
  - TrendChart: recharts BarChart 사용, 오늘 날짜 막대는 진한 색·이전 날짜는 60% 투명도로 강조
  - 로딩 중: 막대형 Skeleton 7개

### 복원 방법

이 ID(HIST-20260528-004)만으로 복원 시 adminDashboardService.ts에서 trend 관련 코드 제거, page.tsx를 HIST-20260516-004 기준으로 되돌리고 recharts 제거.

---

## HIST-20260516-004

- **날짜**: 2026-05-16
- **수정 범위**: 관리자 프론트엔드 / 대시보드
- **수정 개요**: 대시보드 카드 레이아웃을 영역별 섹션(회원·시험·문의)으로 재구성

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/dashboard/page.tsx` | 수정 | 단순 6카드 그리드 → 회원/시험/문의 섹션 분리 레이아웃 |

### 수정 상세

#### `dashboard/page.tsx`
- 변경 전: 6개 카드를 `grid-cols-3` 단순 나열
- 변경 후: `Section` 컴포넌트를 도입해 회원(indigo dot) / 시험(emerald dot) / 문의(amber dot) 3개 섹션으로 분리; 각 섹션 내 2열 그리드
- 이유: 카드가 늘어날수록 영역 구분 없이 나열되면 가독성이 저하됨

### 복원 방법

이 ID(HIST-20260516-004)로 복원 시 `dashboard/page.tsx`를 Section 도입 전 단일 `grid-cols-3` 구조로 되돌린다.

---

## HIST-20260516-001

- **날짜**: 2026-05-16
- **수정 범위**: 관리자 프론트엔드 / 대시보드 + 로그인 히스토리 + 레이아웃
- **수정 개요**: 대시보드 페이지 신규 생성, 로그인 히스토리 페이지 신규 생성, 레이아웃 메뉴 개편

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/dashboard/page.tsx` | 추가 | 대시보드 페이지 (통계 카드 5종) |
| `frontend/src/app/admin/login-history/page.tsx` | 추가 | 로그인 히스토리 페이지 (테이블, 검색, 필터, 페이지네이션) |
| `frontend/src/services/adminDashboardService.ts` | 추가 | 대시보드 통계 API 클라이언트 |
| `frontend/src/services/adminLoginHistoryService.ts` | 추가 | 로그인 히스토리 API 클라이언트 |
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | ICON_MAP에 dashboard/loginhistory 아이콘 추가; FALLBACK_NAV에 대시보드(id:0) 최상단 추가; 계정 관리(id:9)에 서브메뉴(계정 목록, 로그인 히스토리) 추가; isParentActive 로직을 자식 URL까지 포함하도록 수정 |
| `frontend/src/app/admin/login/page.tsx` | 수정 | 로그인 성공 후 redirect를 /admin/exams → /admin/dashboard 로 변경 |

### 수정 상세

#### `AdminLayoutShell.tsx`
- 변경 전: 대시보드 메뉴 없음; 계정 관리가 자식메뉴 없는 단일 항목; 로그인 후 /admin/exams로 이동
- 변경 후:
  - FALLBACK_NAV 첫 번째 항목으로 대시보드(/admin/dashboard) 추가
  - 계정 관리 → 자식 [계정 목록(/admin/users), 로그인 히스토리(/admin/login-history)]
  - isParentActive: `pathname.startsWith(item.url) || children.some(c => pathname.startsWith(c.url))`
- 이유: 관리자 로그인 진입 시 대시보드를 첫 화면으로 표시; 계정 관련 메뉴 그룹화

#### `login/page.tsx`
- 변경 전: `router.push('/admin/exams')`
- 변경 후: `router.push('/admin/dashboard')`
- 이유: 로그인 후 대시보드를 첫 진입 화면으로 통일

### 복원 방법

이 ID(HIST-20260516-001)로 복원 시:
- dashboard/page.tsx, login-history/page.tsx, adminDashboardService.ts, adminLoginHistoryService.ts 삭제
- AdminLayoutShell.tsx에서 dashboard/loginhistory 아이콘, 대시보드 메뉴 항목, 계정 관리 서브메뉴 제거; isParentActive를 `pathname.startsWith(item.url)`로 복원
- login/page.tsx redirect를 `/admin/exams`로 복원
