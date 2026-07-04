## HIST-20260704-002

- **날짜**: 2026-07-04
- **수정 범위**: 관리자 프론트엔드 / 시험 이력
- **수정 개요**: localStorage 키 `:v2` 갱신(마지막 컬럼은 읽기전용이라 폭은 유지). 서버 페이징(`fetchData`) 기반 인라인 페이지네이션을 공통 `Pagination` 컴포넌트로 교체.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/history/page.tsx` | 수정 | `useColumnResize` storageKey `tpmp:admin-exam-history:col-widths` → `:v2`(폭 배열 변경 없음); `«`/`‹`/번호/`›`/`»` 인라인 페이지네이션 및 `pageNumbers` 계산 로직 제거 후 `<Pagination page={currentPage} totalPages={totalPages} onChange={handlePage} />`로 교체 |

### 수정 상세

#### `frontend/src/app/admin/exams/history/page.tsx`
- 변경 전: `useColumnResize('tpmp:admin-exam-history:col-widths', [56, 120, 180, 240, 80, 80, 80, 160])`; `pageNumbers` 슬라이딩 윈도우 기반 인라인 페이지네이션.
- 변경 후: `useColumnResize('tpmp:admin-exam-history:col-widths:v2', [56, 120, 180, 240, 80, 80, 80, 160])`; `<Pagination page={currentPage} totalPages={totalPages} onChange={handlePage} />`.
- 이유: 마지막 컬럼("응시 일시")은 읽기전용이라 클리핑 대상이 아니므로 폭은 유지, 페이지네이션 UI/로직만 공통 컴포넌트로 통일.

### 복원 방법
이 ID(HIST-20260704-002)만으로 복원 시: `useColumnResize` storageKey를 `tpmp:admin-exam-history:col-widths`로 되돌리고, Pagination import를 제거한 뒤 `pageNumbers` 계산과 인라인 페이지네이션 블록을 복원한다.

## HIST-20260703-001

- **날짜**: 2026-07-03
- **수정 범위**: 관리자 프론트엔드 / 시험 이력
- **수정 개요**: 시험 이력 목록 표에 컬럼 드래그 리사이즈 적용 (useColumnResize + ColResizeHandle + table-fixed + colgroup)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/history/page.tsx` | 수정 | useColumnResize·ColResizeHandle import, 훅 호출, table-fixed, colgroup, th 인라인 w-* 제거+relative+핸들, 시험명 td overflow-hidden |

### 수정 상세

#### `frontend/src/app/admin/exams/history/page.tsx`
- 변경 전: `<table className="w-full text-sm">`, th에 `w-16`·`w-20` 인라인 고정폭, 시험명 td `max-w-xs truncate`
- 변경 후:
  - `import { useColumnResize }` / `import { ColResizeHandle }` 추가
  - `const { widths, startResize } = useColumnResize('tpmp:admin-exam-history:col-widths', [56, 120, 180, 240, 80, 80, 80, 160]);`
  - `<table className="w-full text-sm table-fixed">`
  - `<colgroup>{widths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>`
  - th 0~6에 `w-*` 삭제 + `relative` + `<ColResizeHandle onMouseDown={(e) => startResize(i, e)} />`, th 7(응시 일시)는 핸들 없음
  - 시험명 td: `max-w-xs` → `overflow-hidden`
- 이유: 컬럼 드래그 리사이즈 기능 추가 (8컬럼, localStorage 영속)

### 복원 방법
HIST-20260703-001 복원 시:
- useColumnResize·ColResizeHandle import 2줄 제거, 훅 호출 라인 제거
- `table-fixed` 제거, `<colgroup>` 블록 삭제
- th 0: `w-16` 복원, th 4~6: `w-20` 복원, 각 th에서 `relative` + `<ColResizeHandle .../>` 제거
- 시험명 td: `overflow-hidden` → `max-w-xs`

---

## HIST-20260516-003

- **날짜**: 2026-05-16
- **수정 범위**: 관리자 프론트엔드 / 시험 이력
- **수정 개요**: 시험 이력 페이지 신규 생성, 대시보드 통계 카드 추가, 레이아웃 메뉴 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/services/adminExamHistoryService.ts | 추가 | 시험 이력 API 클라이언트 서비스 |
| frontend/src/app/admin/exams/history/page.tsx | 추가 | 시험 이력 조회 페이지 (검색/필터/테이블/페이지네이션) |
| frontend/src/services/adminDashboardService.ts | 수정 | DashboardStats에 todayExamAttemptCount 필드 추가 |
| frontend/src/app/admin/dashboard/page.tsx | 수정 | "오늘 시험 응시" 통계 카드 추가 (6번째 카드) |
| frontend/src/components/layout/AdminLayoutShell.tsx | 수정 | FALLBACK_NAV 시험 관리 children에 시험 이력 항목 추가, ICON_MAP에 examhistory 아이콘 추가 |

### 수정 상세

#### `frontend/src/services/adminExamHistoryService.ts`
- 변경 전: 파일 없음
- 변경 후: `ExamHistoryItem`, `ExamHistoryPage`, `ExamHistoryParams` 인터페이스 정의. `adminExamHistoryService.getList(params)` — GET `/admin/exam-history`
- 이유: 시험 이력 API 호출 레이어 분리

#### `frontend/src/app/admin/exams/history/page.tsx`
- 변경 전: 파일 없음
- 변경 후: LoginHistory 페이지 패턴 기반. 검색 타입(이름/이메일/시험명), 날짜 범위 필터. 테이블 8열(No/회원 이름/이메일/시험명/총 문항/정답 수/점수/응시 일시). 점수는 80점 이상 emerald, 60점 이상 amber, 미만 rose 색상 강조. 로딩 시 `<TableSkeleton rows={5} cols={8} />`. 빈 결과 "응시 이력이 없습니다." 텍스트. 페이지네이션 동일 패턴
- 이유: 관리자가 회원별 시험 응시 이력을 조회할 수 있는 화면 필요

#### `frontend/src/services/adminDashboardService.ts`
- 변경 전: `DashboardStats { todayLoginCount, todayInquiryCount, pendingInquiryCount, totalExamCount, totalMemberCount }`
- 변경 후: `DashboardStats { ..., todayExamAttemptCount: number; }` 추가
- 이유: 백엔드 DashboardStatsResponse 변경에 맞춰 타입 동기화

#### `frontend/src/app/admin/dashboard/page.tsx`
- 변경 전: cards 배열 5개 (오늘 로그인, 전체 회원, 오늘 새 문의, 대기 문의, 전체 시험)
- 변경 후: cards 배열 6개 — "오늘 시험 응시" 카드 추가. value: `stats?.todayExamAttemptCount ?? 0`, href: `/admin/exams/history`, color: `bg-indigo-50 ... text-indigo-600 ...`, 막대 차트 SVG 아이콘
- 이유: 대시보드에서 오늘 시험 응시 현황을 한눈에 확인하기 위함

#### `frontend/src/components/layout/AdminLayoutShell.tsx`
- 변경 전: ICON_MAP에 examhistory 없음. FALLBACK_NAV id:1(시험 관리) children에 id:11(문항 관리), id:12(시험지 관리) 2개
- 변경 후: ICON_MAP에 `examhistory` 막대 차트 SVG 아이콘 추가. FALLBACK_NAV id:1 children에 `{ id: 13, name: '시험 이력', url: '/admin/exams/history', displayOrder: 3 }` 추가
- 이유: 사이드바 네비게이션에서 시험 이력 페이지로 이동할 수 있도록 메뉴 항목 추가

### 복원 방법
이 ID(HIST-20260516-003)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.
- adminExamHistoryService.ts, admin/exams/history/page.tsx 삭제
- adminDashboardService.ts에서 `todayExamAttemptCount` 필드 제거
- dashboard/page.tsx에서 "오늘 시험 응시" 카드 항목 제거
- AdminLayoutShell.tsx에서 `examhistory` ICON_MAP 항목 제거, FALLBACK_NAV id:1 children에서 id:13 항목 제거
