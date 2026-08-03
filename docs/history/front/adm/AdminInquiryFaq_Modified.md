## HIST-20260804-001

- **날짜**: 2026-08-04
- **수정 범위**: 관리자 프론트엔드 / 1:1 문의 관리 — 유형 필터 추가
- **수정 개요**: 대시보드에 "버그 신고 대기" 카드(→ `docs/history/front/adm/Dashboard_Modified.md` HIST-20260804-001)를 추가하면서, 클릭 시 이동할 문의 관리 화면에 유형별 필터가 없어 만들었다. `useSearchParams`로 URL의 `?type=BUG` 쿼리를 읽어 초기 필터값으로 반영하도록 해, 대시보드 카드 클릭 시 자동으로 해당 유형만 필터링된 목록이 뜬다. `useSearchParams` 사용으로 인해 컴포넌트를 `Suspense` 경계로 감싸는 이 프로젝트의 기존 패턴(`user/settings/page.tsx` 등)을 그대로 따랐다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/inquiries/page.tsx` | 수정 | `typeFilter`(InquiryType \| '') state 추가, URL `?type=` 쿼리로 초기값 설정. 검색 조건 영역에 "유형" select 추가(`INQUIRY_TYPE_LABEL` 기반 옵션). `filtered` 로직에 유형 필터 반영. 컴포넌트를 `AdminInquiriesContent`로 분리하고 `Suspense`로 감싼 `AdminInquiriesPage` 기본 export 추가(`useSearchParams` 사용에 따른 필수 패턴) |

### 검증

- `npx tsc --noEmit` 통과.
- 브라우저 확인: `/admin/inquiries?type=BUG` 접속 시 유형 드롭다운이 "버그 신고"로 자동 선택되고 목록도 정확히 필터링됨을 확인.

---

## HIST-20260708-001

- **날짜**: 2026-07-08
- **수정 범위**: 관리자 프론트엔드 / FAQ 관리, 1:1 문의 관리 — 테이블 클리핑 버그 수정
- **수정 개요**: 두 목록 표 모두 `table-fixed` + `useColumnResize` px 고정 `<colgroup>`을 쓰는데, 컬럼 폭 합이 카드 컨테이너 폭을 넘으면 카드 div의 `overflow-hidden` 때문에 가로 스크롤 없이 오른쪽 컬럼(관리 버튼 등)이 잘리는 버그가 있었다(localStorage에 폭이 영속되어 드래그로 넓힌 사용자는 항상 재현). 이전 HIST-20260704-003에서 관리 컬럼 기본폭을 넓혀 완화했으나 사용자가 드래그로 다시 넓히면 재현되는 근본 원인은 남아 있었다. 두 화면 모두 `<table>`만 `overflow-x-auto` div로 감싸 가로 스크롤이 생기도록 수정했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/inquiries/page.tsx` | 수정 | 목록 `<table>`을 `<div className="overflow-x-auto">`로 감쌈 |
| `frontend/src/app/admin/faq/page.tsx` | 수정 | 목록 `<table>`을 `<div className="overflow-x-auto">`로 감쌈 |

### 수정 상세

#### `frontend/src/app/admin/inquiries/page.tsx`
- 변경 전: `<table className="w-full table-fixed text-sm">`가 카드 div(`overflow-hidden`) 바로 아래에 있어 오른쪽 컬럼이 잘림
- 변경 후: `<table>...</table>` 전체를 `<div className="overflow-x-auto">`로 감쌈
- 이유: fixed table layout + 컬럼 리사이즈 영속 폭 + `overflow-hidden` 카드 조합에서 오른쪽 컬럼이 클리핑되는 공통 버그 수정

#### `frontend/src/app/admin/faq/page.tsx`
- 변경 전: `<table className="w-full table-fixed text-sm">`가 카드 div(`overflow-hidden`) 바로 아래에 있어 오른쪽 컬럼이 잘림
- 변경 후: `<table>...</table>` 전체를 `<div className="overflow-x-auto">`로 감쌈
- 이유: 위와 동일(공통 원인)

### 복원 방법
이 ID(HIST-20260708-001)만으로 복원 시 두 파일 각각의 `<table>` 앞뒤에 추가한 `<div className="overflow-x-auto">`/`</div>` 래퍼를 제거한다.

## HIST-20260704-003

- **날짜**: 2026-07-04
- **수정 범위**: 관리자 프론트엔드 / FAQ 관리, 1:1 문의 관리
- **수정 개요**: 두 표 모두 관리 컬럼 버튼 잘림 수정(FAQ 160→210px, 문의 120→160px) + localStorage 키 `:v2` 갱신. 두 표 모두 이미 filter→reduce 방식의 생략부호 페이지네이션을 쓰고 있었으나, 공통 `Pagination` 컴포넌트로 통일 교체.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/faq/page.tsx` | 수정 | `useColumnResize` storageKey `tpmp:admin-faq:col-widths` → `:v2`, 관리 컬럼 기본폭 160→210; `filter→reduce` 인라인 페이지네이션을 `<Pagination page={page} totalPages={totalPages} onChange={setPage} />`로 교체 |
| `frontend/src/app/admin/inquiries/page.tsx` | 수정 | `useColumnResize` storageKey `tpmp:admin-inquiries:col-widths` → `:v2`, 관리 컬럼 기본폭 120→160; `filter→reduce` 인라인 페이지네이션을 `<Pagination page={page} totalPages={totalPages} onChange={setPage} />`로 교체 |

### 수정 상세

#### `frontend/src/app/admin/faq/page.tsx`
- 변경 전: `useColumnResize('tpmp:admin-faq:col-widths', [48, 300, 64, 64, 100, 160])`; 페이지네이션은 `filter→reduce`로 직접 구현.
- 변경 후: `useColumnResize('tpmp:admin-faq:col-widths:v2', [48, 300, 64, 64, 100, 210])`; `<Pagination page={page} totalPages={totalPages} onChange={setPage} />`.
- 이유: 관리 컬럼 폭이 "수정"(링크)+"공개/비공개"+"삭제" 3개 요소 총폭보다 좁아 잘림.

#### `frontend/src/app/admin/inquiries/page.tsx`
- 변경 전: `useColumnResize('tpmp:admin-inquiries:col-widths', [48, 280, 96, 100, 96, 100, 120])`; 페이지네이션은 `filter→reduce`로 직접 구현.
- 변경 후: `useColumnResize('tpmp:admin-inquiries:col-widths:v2', [48, 280, 96, 100, 96, 100, 160])`; `<Pagination page={page} totalPages={totalPages} onChange={setPage} />`.
- 이유: 상태가 `PENDING`/`ON_HOLD`일 때 "보류/대기로"+"삭제" 버튼 2개가 함께 표시되어 폭 부족으로 잘림.

### 복원 방법
이 ID(HIST-20260704-003)만으로 복원 시: 두 파일의 `useColumnResize` 호출을 `:v2` 이전 storageKey·기본폭으로 되돌리고, Pagination import를 제거한 뒤 각 파일의 페이지네이션 블록을 원래의 `filter→reduce` 인라인 코드로 복원한다.

## HIST-20260703-002

- **날짜**: 2026-07-03
- **수정 범위**: 관리자 프론트엔드 / FAQ 관리
- **수정 개요**: 테이블 컬럼 드래그 리사이즈 적용 (배치2) — 6컬럼 table-fixed 전환

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/faq/page.tsx` | 수정 | useColumnResize/ColResizeHandle import 추가, 훅 호출, table-fixed, colgroup, th에 relative+핸들(0~4), w-12/w-16/w-28/w-36 삭제, 질문 td overflow-hidden |

### 수정 상세

#### `frontend/src/app/admin/faq/page.tsx`
- 변경 전: `<table className="w-full text-sm">`, th에 `w-12`, `w-16`(×2), `w-28`, `w-36` 인라인 너비, 리사이즈 기능 없음, 질문 td `max-w-xs`
- 변경 후: `<table className="w-full table-fixed text-sm">`, `<colgroup>` 6컬럼 너비 `[48,300,64,64,100,160]`, th 0~4에 `relative`+ColResizeHandle, 마지막 '관리' th 핸들 제외, 질문 td `overflow-hidden`
- 이유: 배치2 컬럼 드래그 리사이즈 적용 — storageKey `tpmp:admin-faq:col-widths`

### 복원 방법
이 ID(HIST-20260703-002)만으로 복원 시 import 2줄 제거, 훅 제거, `table-fixed` 제거, colgroup 제거, th에서 relative+핸들 제거 후 원래 w-* 클래스 복원, 질문 td `overflow-hidden`→`max-w-xs`.

---

## HIST-20260703-001

- **날짜**: 2026-07-03
- **수정 범위**: 관리자 프론트엔드 / 1:1 문의 관리
- **수정 개요**: 테이블 컬럼 드래그 리사이즈 적용 (배치2) — 7컬럼 table-fixed 전환

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/inquiries/page.tsx` | 수정 | useColumnResize/ColResizeHandle import 추가, 훅 호출, table-fixed, colgroup, th에 relative+핸들(0~5), w-12/w-24/w-28 삭제, 제목 td overflow-hidden |

### 수정 상세

#### `frontend/src/app/admin/inquiries/page.tsx`
- 변경 전: `<table className="w-full text-sm">`, th에 `w-12`, `w-24`(×3), `w-28` 인라인 너비, 리사이즈 기능 없음, 제목 td `max-w-xs`
- 변경 후: `<table className="w-full table-fixed text-sm">`, `<colgroup>` 7컬럼 너비 `[48,280,96,100,96,100,120]`, th 0~5에 `relative`+ColResizeHandle, 마지막 '관리' th 핸들 제외, 제목 td `overflow-hidden`
- 이유: 배치2 컬럼 드래그 리사이즈 적용 — storageKey `tpmp:admin-inquiries:col-widths`

### 복원 방법
이 ID(HIST-20260703-001)만으로 복원 시 import 2줄 제거, 훅 제거, `table-fixed` 제거, colgroup 제거, th에서 relative+핸들 제거 후 원래 w-* 클래스 복원, 제목 td `overflow-hidden`→`max-w-xs`.

---

## HIST-20260430-005

- **날짜**: 2026-04-30
- **수정 범위**: 관리자 프론트엔드 / FAQ 관리, 1:1 문의 관리
- **수정 개요**: 전체 데이터 일괄 로드로 전환 + 키워드 검색 조건 추가 (버튼 클릭 시 적용)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/faq/page.tsx` | 수정 | 서버 페이지네이션 → 전체 로드(`size=10000`) + 클라이언트 필터/페이지. 키워드 검색 추가 |
| `frontend/src/app/admin/inquiries/page.tsx` | 수정 | 전체 로드 + 상태 탭 클라이언트 필터 + 키워드 검색 추가 |

### 수정 상세

- **변경 전**: `useCallback(load, [page, pageSize, ...])` 패턴으로 서버 페이지네이션
- **변경 후**: 마운트 시 `size=10000`으로 전체 데이터 1회 로드 → `allFaqs`/`allInquiries` 저장 → `useMemo`로 클라이언트 필터 → 클라이언트 페이지네이션
- **이유**: 키워드 검색이 현재 페이지 내에서만 동작하는 한계 해소; 삭제/토글 시 로컬 상태 업데이트로 불필요한 서버 재요청 제거

### 복원 방법

이 ID(HIST-20260430-005)로 복원 시: `useCallback` 기반 load 함수 복원, 서버 페이지네이션 복원, 검색 상태/UI 제거

---

## HIST-20260422-008

- **날짜**: 2026-04-22
- **수정 범위**: 관리자 프론트엔드 / 1:1 문의 관리
- **수정 개요**: 문의 상세 페이지 신규 추가, 목록에서 인라인 확장 제거, 답변 등록·수정·삭제 기능 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/.../admin/inquiries/page.tsx` | 수정 | 인라인 확장 제거, 행 클릭 → 상세 링크로 변경, 상세 버튼 추가 |
| `frontend/.../admin/inquiries/[id]/page.tsx` | 추가 | 문의 상세·답변 등록/수정·보류 토글·삭제 기능 포함 |
| `frontend/.../services/inquiryService.ts` | 수정 | `adminDelete(id)` 메서드 추가 |

### 수정 상세

#### `admin/inquiries/page.tsx`
- 변경 전: 행 클릭 시 인라인 확장(답변 폼 포함)
- 변경 후: 제목 클릭 또는 [상세] 버튼 → `/admin/inquiries/{id}` 이동, 인라인 확장 제거

#### `admin/inquiries/[id]/page.tsx` (신규)
- 문의 내용 + 첨부 이미지 표시
- 보류 토글 버튼 (ANSWERED 아닐 때만)
- 답변 textarea: ANSWERED 포함 항상 노출(수정 가능), 기존 답변 pre-fill
- 문의 삭제 버튼 (confirm 후 삭제 → 목록으로 이동)

### 복원 방법

`admin/inquiries/[id]/page.tsx` 삭제, `admin/inquiries/page.tsx`를 HIST-20260422-006 버전으로 되돌린다.

---

## HIST-20260422-006

- **날짜**: 2026-04-22
- **수정 범위**: 관리자 프론트엔드 / 1:1 문의 관리 + FAQ 관리
- **수정 개요**: 관리자 문의 관리 페이지 전면 구현, FAQ 관리(목록·등록·수정) 신규 추가, 사이드바에 FAQ 관리 메뉴 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/inquiries/page.tsx` | 수정 | 플레이스홀더 → 전체 목록 테이블 (상태 탭, 행 클릭 인라인 상세, 답변·보류 관리) |
| `frontend/src/app/admin/faq/page.tsx` | 추가 | FAQ 목록 (공개전환, 수정, 삭제, 페이징) |
| `frontend/src/app/admin/faq/new/page.tsx` | 추가 | FAQ 등록 폼 |
| `frontend/src/app/admin/faq/[id]/edit/page.tsx` | 추가 | FAQ 수정 폼 |
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | 사이드바에 `FAQ 관리` 메뉴 (`/admin/faq`) 추가 |

### 수정 상세

#### `admin/inquiries/page.tsx`
- 변경 전: "준비 중입니다." 플레이스홀더
- 변경 후:
  - 상태 탭 필터 (전체/답변 대기/답변 보류/답변 완료)
  - 테이블: 번호, 제목, 유형, 작성자, 상태, 등록일, 관리
  - 행 클릭 시 인라인 확장 — 문의 내용·이미지 표시, 답변 작성 폼
  - 관리 컬럼: "보류" 버튼(PENDING↔ON_HOLD 토글), "대기로" 버튼(ON_HOLD→PENDING)
  - 답변 등록 시 상태 즉시 ANSWERED로 갱신, 행 상태 배지 업데이트

#### `admin/faq/page.tsx` (신규)
- 테이블: 번호, 질문(+답변 미리보기), 순서, 공개 여부, 등록일, 관리
- 수정(→ edit 페이지), 공개전환(즉시 배지 업데이트), 삭제

#### `admin/faq/new/page.tsx` (신규)
- 질문·답변 입력, 표시 순서, 공개 여부 토글 스위치

#### `admin/faq/[id]/edit/page.tsx` (신규)
- 기존 데이터 로드 후 수정 폼 (new 페이지와 동일 구조)

### 복원 방법

HIST-20260422-006 복원 시:
- `admin/inquiries/page.tsx`를 플레이스홀더로 복원
- `admin/faq/page.tsx`, `admin/faq/new/page.tsx`, `admin/faq/[id]/edit/page.tsx` 삭제
- `AdminLayoutShell.tsx`에서 FAQ 관리 NAV_ITEM 제거
