## HIST-20260704-002

- **날짜**: 2026-07-04
- **수정 범위**: 관리자 프론트엔드 / 연습장 관리 (기록 관리)
- **수정 개요**: localStorage 키 `:v2` 갱신(마지막 컬럼은 읽기전용이라 폭은 유지). 슬라이딩 윈도우(최대 7개) 인라인 페이지네이션을 공통 `Pagination` 컴포넌트로 교체.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/practice/history/page.tsx` | 수정 | `useColumnResize` storageKey `tpmp:admin-practice-history:col-widths` → `:v2`(폭 배열 변경 없음); `이전`/번호(최대 7개 슬라이딩)/`다음` 인라인 페이지네이션을 `<Pagination page={page} totalPages={totalPages} onChange={setPage} />`로 교체 |

### 수정 상세

#### `frontend/src/app/admin/practice/history/page.tsx`
- 변경 전: `useColumnResize('tpmp:admin-practice-history:col-widths', [56, 160, 280, 96, 100, 72, 160])`; `Array.from({length: Math.min(totalPages,7)}, ...)` 슬라이딩 윈도우(생략부호 없음).
- 변경 후: `useColumnResize('tpmp:admin-practice-history:col-widths:v2', [56, 160, 280, 96, 100, 72, 160])`; `<Pagination page={page} totalPages={totalPages} onChange={setPage} />`.
- 이유: 마지막 컬럼("실행 시각")은 읽기전용이라 클리핑 대상이 아니므로 폭은 유지, 페이지네이션을 생략부호가 있는 공통 컴포넌트로 통일.

### 복원 방법
이 ID(HIST-20260704-002)만으로 복원 시: `useColumnResize` storageKey를 `tpmp:admin-practice-history:col-widths`로 되돌리고, Pagination import를 제거한 뒤 슬라이딩 윈도우(최대 7개) 인라인 페이지네이션 블록을 복원한다.

## HIST-20260703-001

- **날짜**: 2026-07-03
- **수정 범위**: 관리자 프론트엔드 / 연습장 관리 (기록 관리)
- **수정 개요**: 기록 관리 목록 표에 컬럼 드래그 리사이즈 적용 (useColumnResize + ColResizeHandle + table-fixed + colgroup)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/practice/history/page.tsx` | 수정 | useColumnResize·ColResizeHandle import, 훅 호출, table-fixed, colgroup, th 인라인 w-* 제거+relative+핸들, SQL내용 td overflow-hidden |

### 수정 상세

#### `frontend/src/app/admin/practice/history/page.tsx`
- 변경 전: `<table className="w-full text-sm">`, th에 `w-12`(순번)·`w-24`(결과유형)·`w-28`(DB종류)·`w-16`(행수)·`w-40`(실행시각) 인라인 고정폭, SQL내용 td `max-w-xs`
- 변경 후:
  - `import { useColumnResize }` / `import { ColResizeHandle }` 추가
  - `const { widths, startResize } = useColumnResize('tpmp:admin-practice-history:col-widths', [56, 160, 280, 96, 100, 72, 160]);`
  - `<table className="w-full text-sm table-fixed">`
  - `<colgroup>{widths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>`
  - 5개 th에서 `w-*` 삭제, th 0~5에 `relative` + `<ColResizeHandle onMouseDown={(e) => startResize(i, e)} />`, th 6(실행시각)은 핸들 없음
  - SQL내용 td: `max-w-xs` → `overflow-hidden`; 확장행 `<td colSpan={7}>` 그대로 유지
- 이유: 컬럼 드래그 리사이즈 기능 추가 (7컬럼, localStorage 영속)

### 복원 방법
HIST-20260703-001 복원 시:
- useColumnResize·ColResizeHandle import 2줄 제거, 훅 호출 라인 제거
- `table-fixed` 제거, `<colgroup>` 블록 삭제
- th 인라인 고정폭 복원(순번 w-12, 결과유형 w-24, DB종류 w-28, 행수 w-16, 실행시각 w-40)
- 각 th에서 `relative` + `<ColResizeHandle .../>` 제거
- SQL내용 td: `overflow-hidden` → `max-w-xs`

---

## HIST-20260512-004

- **날짜**: 2026-05-12
- **수정 범위**: 관리자 프론트엔드 / 연습장 관리
- **수정 개요**: 규칙 관리 화면에 방언 변환 규칙 섹션(MySQL/Oracle 탭 + 토글 스위치) 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/.../services/practiceAdminService.ts` | 수정 | `ConversionRule` 인터페이스 추가, `PracticeRules`에 `mysqlConversionRules`, `oracleConversionRules` 필드 추가, `toggleConversionRule(id)` API 추가 |
| `frontend/.../admin/practice/rules/page.tsx` | 수정 | `toggling`, `convTab` 상태 추가, `handleToggle()` 함수 추가, 방언 변환 규칙 섹션(탭·토글 스위치) 추가 |

### 수정 상세

#### `practiceAdminService.ts`
- `ConversionRule { id, dialect, ruleKey, adminLabel, userLabel, enabled, displayOrder, complex }` 추가
- `PracticeRules`에 `mysqlConversionRules`, `oracleConversionRules` 배열 추가
- `toggleConversionRule(id)` — `PATCH /admin/practice/conversion-rules/{id}/toggle`

#### `admin/practice/rules/page.tsx`
- MySQL/Oracle 탭으로 변환 규칙 목록 표시
- 각 규칙 행: adminLabel, 복합 로직 배지, 비활성화 배지, ON/OFF 토글 스위치
- 토글 클릭 시 API 호출 후 로컬 상태 즉시 반영 (낙관적 업데이트)
- 복합 로직 규칙은 "복합 로직" 주황 배지로 표시

### 복원 방법

HIST-20260512-004 복원 시:
- `practiceAdminService.ts` — `ConversionRule` 인터페이스, `PracticeRules.mysqlConversionRules/oracleConversionRules` 필드, `toggleConversionRule` 제거
- `admin/practice/rules/page.tsx` — `toggling`, `convTab` 상태, `handleToggle()`, 방언 변환 규칙 섹션 전체 제거

---

## HIST-20260512-003

- **날짜**: 2026-05-12
- **수정 범위**: 관리자 프론트엔드 / 연습장 관리
- **수정 개요**: 기록 관리 필터 박스에 DB 종류(dialect) 드롭다운 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/.../admin/practice/history/page.tsx` | 수정 | `dialectFilter` 상태, `handleDialectChange`, DB 종류 `<select>` 추가 |
| `frontend/.../services/practiceAdminService.ts` | 수정 | `HistoryFilters.dialect` 필드 추가 |

### 수정 상세

#### `history/page.tsx`
- 변경 전: 이메일·SQL·결과유형·날짜 4종 필터
- 변경 후: `dialectFilter` 상태 추가, `handleDialectChange`, `hasActiveFilter` 조건 및 `clearFilters`에 dialect 반영; 결과 유형 드롭다운 다음에 "DB 종류 전체 / PostgreSQL / MySQL / Oracle" 드롭다운 삽입

#### `practiceAdminService.ts`
- 변경 전: `HistoryFilters { email, sqlContent, resultType, date }`
- 변경 후: `dialect?` 필드 추가; `getHistory` params에 `dialect` 조건 전달

### 복원 방법

HIST-20260512-003 복원 시:
- `history/page.tsx` — `dialectFilter` 상태·핸들러 제거, DB 종류 `<select>` 블록 제거, `hasActiveFilter`·`clearFilters`에서 dialect 제거
- `practiceAdminService.ts` — `HistoryFilters.dialect` 및 params 전달 코드 제거

---

## HIST-20260512-002

- **날짜**: 2026-05-12
- **수정 범위**: 관리자 프론트엔드 / 연습장 관리
- **수정 개요**: 기록 관리 테이블에 순번(순번 컬럼) 및 DB 종류(dialect badge) 컬럼 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/.../admin/practice/history/page.tsx` | 수정 | 순번 컬럼(페이지 기반 계산), DB 종류 badge 컬럼 추가 |
| `frontend/.../services/practiceAdminService.ts` | 수정 | `PracticeHistoryItem`에 `dialect` 필드 추가 |

### 수정 상세

#### `history/page.tsx`
- 변경 전: 6개 컬럼 (이메일·SQL·결과유형·행수·실행시각)
- 변경 후: 7개 컬럼 — 맨 앞 순번(1-based, 페이지 기반 계산) + DB 종류 badge(PostgreSQL=파랑/MySQL=주황/Oracle=장미) 추가
- `DIALECT_STYLE` 상수맵 추가, `items.map((item, idx) => {...})` 블록 바디로 변경
- 이유: 관리자가 각 기록의 방언 및 순서를 한눈에 파악할 수 있도록

#### `practiceAdminService.ts`
- 변경 전: `PracticeHistoryItem`에 `dialect` 없음
- 변경 후: `dialect: string` 필드 추가

### 복원 방법

HIST-20260512-002 복원 시:
- `history/page.tsx` — `DIALECT_STYLE` 상수 제거, 순번·DB종류 `<th>/<td>` 제거, `colSpan` 5로 복원, `items.map` 화살표 함수 복원
- `practiceAdminService.ts` — `dialect` 필드 제거

---

## HIST-20260512-001

- **날짜**: 2026-05-12
- **수정 범위**: 관리자 프론트엔드 / 연습장 관리
- **수정 개요**: 기록 관리 화면에 SQL 내용·결과 유형·실행 날짜 필터 UI 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/.../admin/practice/history/page.tsx` | 수정 | 4종 필터(이메일·SQL·결과 유형·날짜) UI 추가, 서비스 호출 수정 |
| `frontend/.../services/practiceAdminService.ts` | 수정 | `getHistory()` 시그니처를 `HistoryFilters` 객체로 변경 |

### 수정 상세

#### `history/page.tsx`
- 변경 전: 이메일 검색 입력란 1개
- 변경 후: 이메일 검색 + SQL 내용 검색(debounce 400ms) + 결과 유형 드롭다운(SELECT/INSERT/UPDATE/DELETE/CREATE/DROP/ALTER/ERROR) + 날짜 picker(yyyy-MM-dd) — 모두 필터 박스 안에 배치, 필터 초기화 버튼 제공

#### `practiceAdminService.ts`
- 변경 전: `getHistory(page, size, email?)` 단일 email 파라미터
- 변경 후: `getHistory(page, size, filters?: HistoryFilters)` — `HistoryFilters { email?, sqlContent?, resultType?, date? }` 인터페이스 추가

### 복원 방법

HIST-20260512-001 복원 시:
- `history/page.tsx` — 필터 박스 제거, 이메일 단일 검색 입력 구조로 복원
- `practiceAdminService.ts` — `HistoryFilters` 인터페이스 제거, `email?` 단일 파라미터로 복원

---

## HIST-20260511-009

- **날짜**: 2026-05-11
- **수정 범위**: 관리자 프론트엔드 / 연습장 관리
- **수정 개요**: 연습장 관리 메뉴 및 관리자 페이지 신규 구현 — 규칙 관리, 기록 관리

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | ICON_MAP에 `practice` 추가 + FALLBACK_NAV에 "연습장 관리" 및 하위 2개 항목 추가 |
| `frontend/src/services/practiceAdminService.ts` | 추가 | `getHistory`, `getRules` API 서비스 |
| `frontend/src/app/admin/practice/page.tsx` | 추가 | `/admin/practice` → `/admin/practice/rules` 리다이렉트 |
| `frontend/src/app/admin/practice/rules/page.tsx` | 추가 | 규칙 관리 페이지 (금지 명령·테이블 접두사·오타 패턴 표시) |
| `frontend/src/app/admin/practice/history/page.tsx` | 추가 | 기록 관리 페이지 (실행 이력 테이블, 이메일 필터, 페이지네이션, SQL 상세 펼치기) |

### 수정 상세

#### `AdminLayoutShell.tsx`
- ICON_MAP: `practice` SVG 아이콘 추가 (그리드/표 모양)
- FALLBACK_NAV: id=11 "연습장 관리"(`/admin/practice`) 항목 추가 (displayOrder=11)
  - id=111: "규칙 관리" (`/admin/practice/rules`)
  - id=112: "기록 관리" (`/admin/practice/history`)

#### `practiceAdminService.ts`
- `getHistory(page, size, email?)` — `GET /api/admin/practice/history`
- `getRules()` — `GET /api/admin/practice/rules`

#### `admin/practice/rules/page.tsx`
- 규칙 4개 섹션: 금지 SQL 명령어(빨간 배지), 허용 테이블 접두사, 멀티 스테이트먼트 규칙, 오타 감지 패턴 테이블
- 기본 연습 테이블 4개 안내 블록
- 로딩 시 animate-pulse 스켈레톤

#### `admin/practice/history/page.tsx`
- 실행 결과 유형별 컬러 배지 (SELECT=파랑, INSERT=초록, ERROR=빨강 등)
- 행 클릭 시 전체 SQL·오류 메시지 상세 펼치기 (토글)
- 이메일 검색 디바운스(400ms) 적용
- 페이지네이션 (최대 7개 버튼, 앞/다음)
- `TableSkeleton` 사용

### 복원 방법

HIST-20260511-009 복원 시:
- `frontend/src/app/admin/practice/` 디렉토리 삭제
- `frontend/src/services/practiceAdminService.ts` 삭제
- `AdminLayoutShell.tsx`에서 `practice` ICON_MAP 항목 및 FALLBACK_NAV의 "연습장 관리" 항목(id=11, 111, 112) 제거
