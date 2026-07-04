## HIST-20260704-002

- **날짜**: 2026-07-04
- **수정 범위**: 관리자 프론트엔드 / 개념노트 관리
- **수정 개요**: 관리 컬럼(공개전환/삭제 버튼) 잘림 수정 — 기본폭 140→200px, localStorage 키 `:v2` 갱신. 인라인 페이지네이션을 공통 `Pagination` 컴포넌트로 교체.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/concepts/page.tsx` | 수정 | `useColumnResize` storageKey `tpmp:admin-concepts:col-widths` → `:v2`, 관리 컬럼 기본폭 140→200; `이전`/번호/`다음` 인라인 페이지네이션 블록을 `<Pagination page={page} totalPages={totalPages} onChange={setPage} />`로 교체 |

### 수정 상세

#### `frontend/src/app/admin/concepts/page.tsx`
- 변경 전: `useColumnResize('tpmp:admin-concepts:col-widths', [280, 120, 80, 100, 140])`; 페이지네이션은 `이전`/전체 페이지 번호 버튼(윈도잉 없음)/`다음` 인라인 렌더.
- 변경 후: `useColumnResize('tpmp:admin-concepts:col-widths:v2', [280, 120, 80, 100, 200])`; `{!loading && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}`.
- 이유: 관리 컬럼 폭이 "비공개 전환"/"공개 전환" + "삭제" 버튼 총폭보다 좁아 잘렸고, 전체 페이지 번호를 다 그리던 페이지네이션을 윈도잉+생략부호가 있는 공통 컴포넌트로 통일.

### 복원 방법
이 ID(HIST-20260704-002)만으로 복원 시: `useColumnResize` 호출을 `('tpmp:admin-concepts:col-widths', [280, 120, 80, 100, 140])`로 되돌리고, Pagination import를 제거한 뒤 페이지네이션 블록을 `이전`/`Array.from({length: totalPages})`/`다음` 인라인 코드로 복원한다.

## HIST-20260703-001

- **날짜**: 2026-07-03
- **수정 범위**: 관리자 프론트엔드 / 개념노트 관리
- **수정 개요**: 개념노트 목록 표에 컬럼 드래그 리사이즈 적용 (useColumnResize + ColResizeHandle + table-fixed + colgroup)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/concepts/page.tsx` | 수정 | useColumnResize·ColResizeHandle import, 훅 호출, table-fixed, colgroup, th에 relative+핸들, 제목 td overflow-hidden |

### 수정 상세

#### `frontend/src/app/admin/concepts/page.tsx`
- 변경 전: `<table className="w-full text-sm">`, th에 고정폭 없음·핸들 없음, 제목 td `max-w-xs truncate`
- 변경 후:
  - `import { useColumnResize }` / `import { ColResizeHandle }` 추가
  - `const { widths, startResize } = useColumnResize('tpmp:admin-concepts:col-widths', [280, 120, 80, 100, 140]);`
  - `<table className="w-full text-sm table-fixed">`
  - `<colgroup>{widths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>` (thead 바로 위)
  - th 0~3에 `relative` 클래스 + `<ColResizeHandle onMouseDown={(e) => startResize(i, e)} />`, th 4(관리)는 핸들 없음
  - 제목 td: `max-w-xs` → `overflow-hidden`
- 이유: 컬럼 드래그 리사이즈 기능 추가 (localStorage 영속)

### 복원 방법
HIST-20260703-001 복원 시:
- useColumnResize·ColResizeHandle import 2줄 제거
- `useColumnResize(...)` 훅 호출 라인 제거
- `table-fixed` 제거 → `className="w-full text-sm"`
- `<colgroup>` 블록 삭제
- 각 th에서 `relative` 클래스 및 `<ColResizeHandle .../>` 제거
- 제목 td: `overflow-hidden` → `max-w-xs`

---

## HIST-20260612-001

- **날짜**: 2026-06-12
- **수정 범위**: 관리자 프론트엔드 / 개념노트 관리
- **수정 개요**: 인라인 `dangerouslySetInnerHTML` 직접 사용을 공통 `<RichContent>` 컴포넌트로 교체 (CLAUDE.md 컨벤션 위반 수정)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/concepts/page.tsx` | 수정 | `dangerouslySetInnerHTML` 제거 → `<RichContent>` import 및 교체 |

### 수정 상세

#### `frontend/src/app/admin/concepts/page.tsx`
- 변경 전:
  ```tsx
  <div
    className="text-sm text-gray-700 leading-relaxed max-h-60 overflow-y-auto prose prose-sm max-w-none"
    dangerouslySetInnerHTML={{ __html: note.content }}
  />
  ```
- 변경 후:
  ```tsx
  import { RichContent } from '@/components/ui/RichContent';
  // ...
  <RichContent
    html={note.content}
    className="text-sm text-gray-700 max-h-60 overflow-y-auto prose prose-sm max-w-none"
  />
  ```
- 이유: CLAUDE.md 규칙 — "dangerouslySetInnerHTML 직접 사용 금지, RichContent 사용". `leading-relaxed`는 RichContent 내부에서 이미 적용되므로 className에서 제거해 중복 방지.

### 복원 방법

HIST-20260612-001 복원 시:
- `import { RichContent }` 라인 제거
- 본문 펼침 영역을 `<div className="text-sm text-gray-700 leading-relaxed max-h-60 overflow-y-auto prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: note.content }} />`로 되돌림

---

## HIST-20260430-009

- **날짜**: 2026-04-30
- **수정 범위**: 관리자 프론트엔드 / 개념노트 관리
- **수정 개요**: 전체 데이터 일괄 로드 전환 + 제목/작성자 키워드 검색 추가 + 로딩 텍스트를 TableSkeleton으로 교체

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/concepts/page.tsx` | 수정 | 서버 페이지네이션 → 전체 로드, `TableSkeleton` import 추가, 키워드 검색 추가 |

### 수정 상세

- **변경 전**: `useEffect([page, pageSize])` 패턴 서버 페이지네이션, 로딩 시 "로딩 중..." 텍스트
- **변경 후**: 마운트 시 `size=10000` 전체 로드, 클라이언트 페이지네이션, `TableSkeleton rows={5} cols={5}` 사용
- **이유**: 검색 기능 전체 데이터 기반 동작; CLAUDE.md skeleton 컨벤션 준수

### 복원 방법

이 ID(HIST-20260430-009)로 복원 시: `useEffect([page, pageSize])` 기반 load 복원, "로딩 중..." 텍스트 복원, 검색 상태/UI 제거

---

## HIST-20260422-001

- **날짜**: 2026-04-22
- **수정 범위**: 관리자 프론트엔드 / 개념노트 관리
- **수정 개요**: 노트 내용 펼치기 시 HTML 태그가 그대로 표시되던 현상 수정 — `dangerouslySetInnerHTML`로 렌더링

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/concepts/page.tsx` | 수정 | 행 펼침 영역의 `{note.content}` 텍스트 렌더링 → `dangerouslySetInnerHTML` HTML 렌더링으로 변경 |

### 수정 상세

#### `frontend/src/app/admin/concepts/page.tsx`
- 변경 전: `<div className="...whitespace-pre-wrap...">{note.content}</div>` — HTML 태그 원문 표시
- 변경 후: `<div className="...prose prose-sm..." dangerouslySetInnerHTML={{ __html: note.content }} />` — HTML 렌더링
- 이유: 사용자가 입력한 HTML 서식(이미지, 볼드 등)이 태그 문자 그대로 노출되는 버그 수정

### 복원 방법

HIST-20260422-001 복원 시:
- `dangerouslySetInnerHTML` 속성 제거, `{note.content}` 텍스트 렌더링으로 되돌림

---

## HIST-20260421-026

- **날짜**: 2026-04-21
- **수정 범위**: 관리자 프론트엔드 / 개념노트 관리
- **수정 개요**: 관리자 개념노트 목록 페이지 구현 — 전체 조회, 공개 전환, 삭제, 행 클릭 내용 펼치기

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/app/admin/concepts/page.tsx | 수정 | 플레이스홀더 → 전체 목록 테이블 (공개전환, 삭제, 페이징) |

### 수정 상세

#### `frontend/src/app/admin/concepts/page.tsx`
- 변경 전: "준비 중입니다." 플레이스홀더
- 변경 후:
  - 테이블: 제목, 작성자, 공개 뱃지, 수정일, 관리(공개전환/삭제)
  - 행 클릭 시 노트 내용 인라인 펼치기(토글)
  - 페이지 크기 선택(10/20/50) + 하단 페이지네이션
  - 공개 전환 시 즉시 뱃지 업데이트

### 복원 방법

HIST-20260421-026 복원 시:
- `admin/concepts/page.tsx`를 플레이스홀더 내용으로 복원
