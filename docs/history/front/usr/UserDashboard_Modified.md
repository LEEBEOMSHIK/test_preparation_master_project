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
