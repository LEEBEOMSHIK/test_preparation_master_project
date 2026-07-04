## HIST-20260704-002

- **날짜**: 2026-07-04
- **수정 범위**: 관리자 프론트엔드 / 명언 관리
- **수정 개요**: 관리 컬럼(수정/삭제 버튼) 잘림 수정 — 기본폭 100→160px, localStorage 키 `:v2` 갱신. 인라인 페이지네이션을 공통 `Pagination` 컴포넌트로 교체.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/quotes/page.tsx` | 수정 | `useColumnResize` storageKey `tpmp:admin-quotes:col-widths` → `:v2`, 관리 컬럼 기본폭 100→160; `이전`/번호/`다음` 인라인 페이지네이션 블록을 `<Pagination page={page} totalPages={totalPages} onChange={setPage} />`로 교체 |

### 수정 상세

#### `frontend/src/app/admin/quotes/page.tsx`
- 변경 전: `useColumnResize('tpmp:admin-quotes:col-widths', [48, 320, 140, 80, 100])`; 페이지네이션은 `이전`/전체 페이지 번호(윈도잉 없음)/`다음` 인라인 렌더.
- 변경 후: `useColumnResize('tpmp:admin-quotes:col-widths:v2', [48, 320, 140, 80, 160])`; `<Pagination page={page} totalPages={totalPages} onChange={setPage} />`.
- 이유: 관리 컬럼 폭이 "수정"+"삭제" 버튼 총폭보다 좁아 잘렸고, 페이지네이션을 공통 컴포넌트로 통일.

### 복원 방법
이 ID(HIST-20260704-002)만으로 복원 시: `useColumnResize` 호출을 `('tpmp:admin-quotes:col-widths', [48, 320, 140, 80, 100])`로 되돌리고, Pagination import를 제거한 뒤 페이지네이션 블록을 `이전`/`Array.from({length: totalPages})`/`다음` 인라인 코드로 복원한다.

## HIST-20260703-001

- **날짜**: 2026-07-03
- **수정 범위**: 관리자 프론트엔드 / 명언 관리
- **수정 개요**: 테이블 컬럼 드래그 리사이즈 적용 (배치2) — 5컬럼 table-fixed 전환

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/quotes/page.tsx` | 수정 | useColumnResize/ColResizeHandle import 추가, 훅 호출, table-fixed, colgroup, th에 relative+핸들(0~3), w-8/w-36/w-24/w-32 삭제, 내용 td overflow-hidden |

### 수정 상세

#### `frontend/src/app/admin/quotes/page.tsx`
- 변경 전: `<table className="w-full text-sm">`, th에 `w-8`, `w-36`, `w-24`, `w-32` 인라인 너비, 리사이즈 기능 없음, 내용 td `max-w-md`
- 변경 후: `<table className="w-full table-fixed text-sm">`, `<colgroup>` 5컬럼 너비 `[48,320,140,80,100]`, th 0~3에 `relative`+ColResizeHandle, 마지막 '관리' th 핸들 제외, 내용 td `overflow-hidden`(`line-clamp-2` 유지)
- 이유: 배치2 컬럼 드래그 리사이즈 적용 — storageKey `tpmp:admin-quotes:col-widths`

### 복원 방법
이 ID(HIST-20260703-001)만으로 복원 시 import 2줄 제거, 훅 제거, `table-fixed` 제거, colgroup 제거, th에서 relative+핸들 제거 후 원래 w-* 클래스 복원, 내용 td `overflow-hidden`→`max-w-md`.

---

## HIST-20260430-010

- **날짜**: 2026-04-30
- **수정 범위**: 관리자 프론트엔드 / 명언 관리
- **수정 개요**: 전체 데이터 일괄 로드 전환 + 명언 내용/출처 키워드 검색 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/quotes/page.tsx` | 수정 | `allQuotes` 전체 로드, `useMemo` 클라이언트 필터, 검색 UI 패널 추가 |

### 수정 상세

- **변경 전**: `page` 상태 기반 서버 페이지네이션, 키워드 검색 없음
- **변경 후**: 마운트 시 `size=10000` 전체 로드, `filteredQuotes` useMemo, 검색 버튼 클릭 시 `appliedKeyword` 반영

### 복원 방법

이 ID(HIST-20260430-010)로 복원 시: 서버 페이지네이션 `load(page)` 복원, 검색 상태/UI 제거, `paged` → `quotes` 복원

---

## HIST-20260420-014

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 프론트엔드 / 명언 관리
- **수정 개요**: 명언 목록의 사용여부·관리 컬럼 내용이 두 줄로 표시되는 문제 수정 → 한 줄 표시

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/app/admin/quotes/page.tsx | 수정 | 사용여부·관리 th/td에 whitespace-nowrap 추가, 컬럼 폭 조정 |

### 수정 상세

#### `src/app/admin/quotes/page.tsx`
- 변경 전: 사용여부 w-20, 관리 w-28, nowrap 없음 → 텍스트/버튼 줄바꿈 발생
- 변경 후: 사용여부 w-24 + whitespace-nowrap, 관리 w-32 + whitespace-nowrap + flex-nowrap

### 복원 방법

HIST-20260420-014 복원 시:
- th의 클래스를 `w-20`, `w-28`으로 되돌리고 whitespace-nowrap 제거
- td의 whitespace-nowrap 제거, flex-nowrap 제거

---

## HIST-20260420-010

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 프론트엔드 / 명언 관리
- **수정 개요**: 명언 목록·등록·수정·삭제·사용여부 토글 화면 추가, 관리자 사이드바에 메뉴 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/types/index.ts | 수정 | Quote 인터페이스 추가 |
| src/services/quoteService.ts | 추가 | admin CRUD + user getRandom API 메서드 |
| src/app/admin/quotes/page.tsx | 추가 | 명언 관리 페이지 (목록·인라인 폼·사용여부 토글·삭제) |
| src/components/layout/AdminLayoutShell.tsx | 수정 | 명언 관리 nav 항목 추가 (테이블 관리 위) |

### 복원 방법

HIST-20260420-010 복원 시:
- types/index.ts에서 Quote 인터페이스 제거
- quoteService.ts 삭제
- src/app/admin/quotes/ 디렉토리 삭제
- AdminLayoutShell.tsx에서 명언 관리 항목 제거
