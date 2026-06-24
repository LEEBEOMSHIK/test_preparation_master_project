## HIST-20260624-001

- **날짜**: 2026-06-24
- **수정 범위**: 사용자 프론트엔드 / 통계 대시보드
- **수정 개요**: 연습장 풀이 통계 섹션 추가 — PracticeDailyStat 타입 정의, UserDashboardData 4필드 확장, 스켈레톤 추가, 대시보드 페이지 연습장 섹션 렌더링

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | PracticeDailyStat 인터페이스 추가; UserDashboardData에 4필드(practiceTotalExecutions, practiceSuccessCount, practiceSuccessRate, practiceDailyStats) 추가 |
| `frontend/src/components/ui/Skeleton.tsx` | 수정 | DashboardSkeleton 말미에 연습장 섹션 헤더(2줄) + 날짜별 실행량 수직 막대 스켈레톤 추가 |
| `frontend/src/app/user/dashboard/page.tsx` | 수정 | PracticeDailyStat import, 빈 화면 조건 확장, 구조분해 4필드 추가, practiceDailyChartData 변환, 연습장 섹션 렌더링, PageHeader 부제 갱신 |
| `CLAUDE.md` | 수정 | DashboardSkeleton 설명에 `+ 연습장 날짜별 실행량 막대` 추가 |

### 수정 상세

#### `frontend/src/types/index.ts`
- 변경 전: QuizDailyStat 인터페이스까지만 존재. UserDashboardData에 9개 필드.
- 변경 후:
  - `PracticeDailyStat { date: string; totalExecutions: number; }` 추가 (QuizDailyStat 뒤)
  - UserDashboardData에 4개 필드 추가: `practiceTotalExecutions: number; practiceSuccessCount: number; practiceSuccessRate: number; practiceDailyStats: PracticeDailyStat[];`
- 이유: BE UserDashboardResponse 4필드 확장에 대응

#### `frontend/src/components/ui/Skeleton.tsx`
- 변경 전: DashboardSkeleton이 퀴즈 도메인별 풀이량 막대에서 종료.
- 변경 후: 퀴즈 도메인별 막대 직후 2개 블록 추가
  - 연습장 섹션 헤더 스켈레톤 (제목줄 h-3.5 w-28 + 부제줄 h-3 w-40 + 뱃지 h-4 w-24)
  - 연습장 날짜별 실행량 수직 막대 스켈레톤 (헤더 h-3.5 w-32 + flex h-24 막대 14개)
- 이유: 연습장 섹션 데이터 로딩 중 스켈레톤 표시

#### `frontend/src/app/user/dashboard/page.tsx`
- 변경 전: PracticeDailyStat 미사용. 빈 화면 조건 `totalQuestions===0 && quizTotalQuestions===0`. 구조분해 9필드. PageHeader 부제 "내 시험 응시 결과를 한눈에 확인하세요."
- 변경 후:
  - import에 `PracticeDailyStat` 추가
  - 빈 화면 조건에 `&& data.practiceTotalExecutions === 0` 추가
  - 구조분해에 practiceTotalExecutions/practiceSuccessCount/practiceSuccessRate/practiceDailyStats 추가
  - `practiceDailyChartData` 변환: `{ date: d.date.slice(5), count: d.totalExecutions }`
  - 퀴즈 섹션 앞에 연습장 섹션 추가 (`{practiceTotalExecutions > 0 && (...)}`)
    - 섹션 헤더: 제목 "연습장 풀이 통계", 부제 "SQL 연습 실행 현황", 총 실행수 뱃지(teal 색상)
    - 요약 3카드: 총 실행 / 성공 / 성공률(domainBarColor 색상 기준 적용)
    - 날짜별 실행량 수직 BarChart: teal(#14b8a6) 계열, 마지막 막대 진한 색
  - PageHeader 부제: "내 시험·퀴즈·연습장 결과를 한눈에 확인하세요."
- 이유: 연습장 집계 BE 4필드 대응 렌더링 추가

### 복원 방법
이 ID(HIST-20260624-001)만으로 복원 시:
1. `types/index.ts`에서 `PracticeDailyStat` 인터페이스 삭제, `UserDashboardData`에서 4개 필드 제거
2. `Skeleton.tsx`의 DashboardSkeleton에서 연습장 섹션 헤더 + 날짜별 막대 2개 블록 제거
3. `dashboard/page.tsx`에서 PracticeDailyStat import 제거, 빈 화면 조건 복원, 구조분해 4필드 제거, practiceDailyChartData 제거, 연습장 섹션 JSX 제거, PageHeader 부제 복원

---

## HIST-20260622-001

- **날짜**: 2026-06-22
- **수정 범위**: 사용자 프론트엔드 / 통계 대시보드
- **수정 개요**: 대시보드 퀴즈 풀이량 섹션 추가 + 요약 카드 라벨 시험 기준으로 명확화 + 빈 화면 조건 퀴즈 포함으로 확장

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | QuizDomainStat, QuizDailyStat 인터페이스 추가; UserDashboardData에 퀴즈 3필드 추가 |
| `frontend/src/components/ui/Skeleton.tsx` | 수정 | DashboardSkeleton 말미에 퀴즈 도메인별 풀이량 막대 스켈레톤 영역 추가 |
| `frontend/src/app/user/dashboard/page.tsx` | 수정 | 요약 카드 라벨 명확화, 빈 화면 조건 확장, 퀴즈 풀이량 섹션(도메인별 수평+일자별 수직 BarChart) 추가 |

### 수정 상세

#### `frontend/src/types/index.ts`
- 변경 전: UserDashboard 섹션에 DomainStat, DailyStat, UserDashboardData만 존재.
- 변경 후:
  ```ts
  export interface QuizDomainStat { domainName: string; totalQuestions: number; }
  export interface QuizDailyStat { date: string; totalQuestions: number; }
  export interface UserDashboardData {
    ...기존 6필드...
    quizTotalQuestions: number;
    quizDomainStats: QuizDomainStat[];
    quizDailyStats: QuizDailyStat[];
  }
  ```
- 이유: BE UserDashboardResponse 3필드 추가에 대응하는 FE 타입 확장.

#### `frontend/src/components/ui/Skeleton.tsx`
- 변경 전: DashboardSkeleton에 약점 Top5 섹션까지만 있음.
- 변경 후: DashboardSkeleton 말미에 퀴즈 도메인별 풀이량 수평 막대 4행 스켈레톤 블록 추가.
- 이유: 퀴즈 풀이량 섹션 신규 추가에 따른 스켈레톤 UI 컨벤션 준수.

#### `frontend/src/app/user/dashboard/page.tsx`
- 변경 전:
  - 요약 카드 라벨: "총 풀이 문항", "총 정답", "전체 정답률", "응시 도메인"
  - 빈 화면 조건: `!data || data.totalQuestions === 0`
  - 퀴즈 풀이량 섹션 없음
- 변경 후:
  - 요약 카드 라벨: "시험 풀이 문항", "시험 정답", "시험 정답률", "시험 도메인"
  - 빈 화면 조건: `!data || (data.totalQuestions === 0 && data.quizTotalQuestions === 0)`
  - 퀴즈 풀이량 섹션 추가 (`quizTotalQuestions > 0`일 때):
    - 섹션 헤더: "퀴즈 풀이량" + "데일리 퀴즈 풀이 현황 · 정오답 무관, 풀이 수 기준" + "총 N문제 풀이"
    - 도메인별 수평 BarChart (layout="vertical", 단색 #6366f1, 풀이수 기준 XAxis, 많이 푼 도메인이 위로 오도록 오름차순 sort)
    - 일자별 수직 BarChart (마지막 날 #6366f1, 나머지 #6366f155, Tooltip "N문제")
  - import에 QuizDomainStat, QuizDailyStat 추가
- 이유: 시험 정답률과 퀴즈 풀이량을 명확히 분리하여 사용자 혼선 방지.

### 복원 방법
이 ID(HIST-20260622-001)만으로 복원 시:
- types/index.ts: QuizDomainStat, QuizDailyStat 제거; UserDashboardData에서 quizTotalQuestions/quizDomainStats/quizDailyStats 제거.
- Skeleton.tsx: DashboardSkeleton에서 퀴즈 도메인 블록 제거.
- dashboard/page.tsx: 요약 카드 라벨 원복, 빈 화면 조건 원복, 퀴즈 풀이량 섹션 제거, import에서 QuizDomainStat/QuizDailyStat 제거.

---

## HIST-20260611-003

- **날짜**: 2026-06-11
- **수정 범위**: 사용자 프론트엔드 / 통계 대시보드 — 빌드 타입 오류 수정
- **수정 개요**: tsc --noEmit 실패 4건 해소 — SkeletonProps에 style prop 추가, recharts Tooltip formatter 파라미터 타입 가드 처리

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/Skeleton.tsx` | 수정 | SkeletonProps에 `style?: React.CSSProperties` 추가, Skeleton div에 style 전달 |
| `frontend/src/app/user/dashboard/page.tsx` | 수정 | formatter 파라미터 타입 고정(`v: number`) 제거 → `typeof v === 'number'` 가드로 교체 (2곳) |

### 수정 상세

#### `frontend/src/components/ui/Skeleton.tsx`
- 변경 전: `interface SkeletonProps { className?: string; }`, div에 style 미전달
- 변경 후: `interface SkeletonProps { className?: string; style?: React.CSSProperties; }`, `<div ... style={style} />`, `import React from 'react'` 추가
- 이유: DashboardSkeleton 내부 막대 높이를 인라인 style로 지정하는 코드가 SkeletonProps 타입 불일치로 빌드 실패

#### `frontend/src/app/user/dashboard/page.tsx`
- 변경 전: `formatter={(v: number) => [\`${v}%\`, '정답률']}` (2곳)
- 변경 후: `formatter={(v) => [typeof v === 'number' ? \`${v}%\` : '', '정답률']}` (2곳)
- 이유: recharts Formatter 제네릭은 ValueType | undefined를 수신하므로 number 고정 타입이 불일치; any 금지 원칙에 따라 typeof 가드로 처리

### 복원 방법
이 ID(HIST-20260611-003)만으로 복원 시:
- Skeleton.tsx: `style?: React.CSSProperties` 제거, `style={style}` 제거, React import 제거
- user/dashboard/page.tsx: formatter 두 곳을 `(v: number) =>` 형태로 되돌림 (단, 빌드 실패 재발함)

---

## HIST-20260611-002

- **날짜**: 2026-06-11
- **수정 범위**: 사용자 프론트엔드 / 통계 대시보드
- **수정 개요**: 사용자 통계 대시보드 페이지 신규 구현 (요약카드 4개 + 도메인별 수평 BarChart + 날짜별 BarChart + 약점 Top5 진행바)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | DomainStat, DailyStat, UserDashboardData 인터페이스 추가 |
| `frontend/src/services/userDashboardService.ts` | 추가 | 대시보드 API 클라이언트 |
| `frontend/src/components/ui/Skeleton.tsx` | 수정 | DashboardSkeleton 컴포넌트 추가 |
| `frontend/src/app/user/dashboard/page.tsx` | 추가 | 통계 대시보드 페이지 |
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | ICON_MAP에 dashboard 아이콘 추가, USER_FALLBACK_NAV 최상단에 통계 대시보드 메뉴 추가 |
| `CLAUDE.md` | 수정 | Skeleton UI Convention 표에 DashboardSkeleton 행 추가 |

### 수정 상세

#### `frontend/src/types/index.ts`
- 변경 전: UserDashboard 관련 타입 없음
- 변경 후: DomainStat, DailyStat, UserDashboardData 인터페이스 추가 (파일 하단에 섹션으로 추가)
- 이유: TypeScript strict 준수, any 금지 원칙

#### `frontend/src/services/userDashboardService.ts` (신규)
- 변경 전: 없음
- 변경 후: `userDashboardService.getStats(days)` — apiClient.get('/user/dashboard/stats', { params: { days } })
- 이유: 기존 adminDashboardService.ts 패턴 일치

#### `frontend/src/components/ui/Skeleton.tsx`
- 변경 전: DashboardSkeleton 없음
- 변경 후: DashboardSkeleton 추가 — 요약카드 4개 + 수평 막대 5행 + 날짜 추이 막대 + 약점 진행바 5행 (animate-pulse)
- 이유: 데이터 페칭 화면 스켈레톤 필수 정책 준수

#### `frontend/src/app/user/dashboard/page.tsx` (신규)
- 변경 전: 없음
- 변경 후:
  - 기간 탭 (7일/30일/전체), period state로 API 재호출
  - loading=true → DashboardSkeleton 표시
  - totalQuestions=0 → 빈 상태 메시지
  - 요약카드(2x2/sm:4열): 총 풀이 문항, 총 정답, 전체 정답률, 응시 도메인 수
  - 도메인별 수평 BarChart (layout="vertical"): 정답률 구간별 색상 (≥70% emerald / ≥40% amber / else rose)
  - 날짜별 수직 BarChart: 최신 막대 진한 색(#6366f1), 이전 막대 반투명
  - 약점 Top5: Tailwind 진행바, 정답률 색상 동일 기준
- 이유: 관리자 대시보드 recharts 패턴 참조, SSR 이슈 회피를 위해 PieChart 미사용

#### `frontend/src/components/layout/UserLayoutShell.tsx`
- 변경 전: ICON_MAP에 dashboard 없음, USER_FALLBACK_NAV 7개 항목
- 변경 후: ICON_MAP에 dashboard SVG 아이콘 추가, USER_FALLBACK_NAV 최상단(id:100, displayOrder:0)에 통계 대시보드 항목 추가
- 이유: 사이드바/하단탭바 네비게이션 연결

### 복원 방법
이 ID(HIST-20260611-002)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.
- types/index.ts: UserDashboard 섹션(DomainStat, DailyStat, UserDashboardData) 제거
- userDashboardService.ts: 파일 삭제
- Skeleton.tsx: DashboardSkeleton 함수 제거
- app/user/dashboard/page.tsx: 파일 삭제
- UserLayoutShell.tsx: ICON_MAP dashboard 항목 제거, USER_FALLBACK_NAV id=100 항목 제거

### 주의사항
- MenuConfig DB 테이블에 `/user/dashboard` 경로와 `dashboard` iconKey를 가진 항목을 관리자 메뉴 관리 화면에서 별도 등록해야 API 기반 네비게이션이 정상 동작한다. (현재는 USER_FALLBACK_NAV에만 추가된 상태이므로, DB 메뉴 항목이 없으면 menuService.getMyMenus 응답에 포함되지 않아 접근 차단될 수 있음)
