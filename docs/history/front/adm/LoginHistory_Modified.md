## HIST-20260708-001

- **날짜**: 2026-07-08
- **수정 범위**: 관리자 프론트엔드 / 로그인 이력 — 테이블 클리핑 버그 수정
- **수정 개요**: 목록 표가 `table-fixed` + `useColumnResize` px 고정 `<colgroup>`을 쓰는데, 컬럼 폭 합이 카드 컨테이너 폭을 넘으면 카드 div의 `overflow-hidden` 때문에 가로 스크롤 없이 오른쪽 컬럼이 잘리는 버그가 있었다(localStorage에 폭이 영속되어 드래그로 넓힌 사용자는 항상 재현). `<table>`만 `overflow-x-auto` div로 감싸 가로 스크롤이 생기도록 수정했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/login-history/page.tsx` | 수정 | 목록 `<table>`을 `<div className="overflow-x-auto">`로 감쌈 |

### 수정 상세

#### `frontend/src/app/admin/login-history/page.tsx`
- 변경 전: `<table className="w-full text-sm table-fixed">`가 카드 div(`overflow-hidden`) 바로 아래에 있어 오른쪽 컬럼이 잘림
- 변경 후: `<table>...</table>` 전체를 `<div className="overflow-x-auto">`로 감쌈
- 이유: fixed table layout + 컬럼 리사이즈 영속 폭 + `overflow-hidden` 카드 조합에서 오른쪽 컬럼이 클리핑되는 공통 버그 수정

### 복원 방법
이 ID(HIST-20260708-001)만으로 복원 시 `<table>` 앞뒤에 추가한 `<div className="overflow-x-auto">`/`</div>` 래퍼를 제거한다.

## HIST-20260704-002

- **날짜**: 2026-07-04
- **수정 범위**: 관리자 프론트엔드 / 로그인 이력
- **수정 개요**: localStorage 키 `:v2` 갱신(마지막 컬럼은 읽기전용이라 폭은 유지). 서버 페이징(`fetchData`) 기반 인라인 페이지네이션을 공통 `Pagination` 컴포넌트로 교체.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/login-history/page.tsx` | 수정 | `useColumnResize` storageKey `tpmp:admin-login-history:col-widths` → `:v2`(폭 배열 변경 없음); `«`/`‹`/번호/`›`/`»` 인라인 페이지네이션 및 `pageNumbers` 계산 로직 제거 후 `<Pagination page={currentPage} totalPages={totalPages} onChange={handlePage} />`로 교체 |

### 수정 상세

#### `frontend/src/app/admin/login-history/page.tsx`
- 변경 전: `useColumnResize('tpmp:admin-login-history:col-widths', [56, 120, 180, 140, 160, 240])`; `pageNumbers` 배열(슬라이딩 윈도우 10개)을 계산해 `«`/`‹`/번호들/`›`/`»` 버튼으로 렌더.
- 변경 후: `useColumnResize('tpmp:admin-login-history:col-widths:v2', [56, 120, 180, 140, 160, 240])`; `pageNumbers` 변수 제거, `<Pagination page={currentPage} totalPages={totalPages} onChange={handlePage} />` (서버 페이징이므로 onChange가 `handlePage`를 직접 호출해 재조회).
- 이유: 마지막 컬럼("환경 UA")은 읽기전용 텍스트만 표시해 클리핑 대상이 아니므로 폭은 유지하고, 표 간 페이지네이션 UI/로직 통일을 위해 storageKey만 `:v2`로 갱신.

### 복원 방법
이 ID(HIST-20260704-002)만으로 복원 시: `useColumnResize` storageKey를 `tpmp:admin-login-history:col-widths`로 되돌리고, Pagination import를 제거한 뒤 `pageNumbers` 계산과 `«`/`‹`/번호/`›`/`»` 인라인 페이지네이션 블록을 복원한다.

## HIST-20260703-001

- **날짜**: 2026-07-03
- **수정 범위**: 관리자 프론트엔드 / 로그인 이력
- **수정 개요**: 로그인 이력 목록 표에 컬럼 드래그 리사이즈 적용 (useColumnResize + ColResizeHandle + table-fixed + colgroup)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/login-history/page.tsx` | 수정 | useColumnResize·ColResizeHandle import, 훅 호출, table-fixed, colgroup, th 인라인 w-16 제거+relative+핸들, UA td overflow-hidden |

### 수정 상세

#### `frontend/src/app/admin/login-history/page.tsx`
- 변경 전: `<table className="w-full text-sm">`, No th에 `w-16` 인라인 고정폭, UA td `max-w-xs truncate text-xs`
- 변경 후:
  - `import { useColumnResize }` / `import { ColResizeHandle }` 추가
  - `const { widths, startResize } = useColumnResize('tpmp:admin-login-history:col-widths', [56, 120, 180, 140, 160, 240]);`
  - `<table className="w-full text-sm table-fixed">`
  - `<colgroup>{widths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>`
  - No th에서 `w-16` 삭제, th 0~4에 `relative` + `<ColResizeHandle onMouseDown={(e) => startResize(i, e)} />`, th 5(환경 UA)는 핸들 없음
  - UA td: `max-w-xs` → `overflow-hidden`
- 이유: 컬럼 드래그 리사이즈 기능 추가 (6컬럼, localStorage 영속)

### 복원 방법
HIST-20260703-001 복원 시:
- useColumnResize·ColResizeHandle import 2줄 제거, 훅 호출 라인 제거
- `table-fixed` 제거, `<colgroup>` 블록 삭제
- No th에 `w-16` 복원, 각 th에서 `relative` + `<ColResizeHandle .../>` 제거
- UA td: `overflow-hidden` → `max-w-xs`
