## HIST-20260704-007

- **날짜**: 2026-07-04
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: (1) 관리 컬럼(상세/수정/삭제 버튼) 잘림 수정 — 기본폭 160→240px, localStorage 키 `:v2` 갱신. (2) 페이지네이션의 깨진 생략부호(…) 로직을 신규 공통 `Pagination` 컴포넌트로 교체.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/Pagination.tsx` | 추가 | 관리자 목록 표 공용 페이지네이션 컴포넌트 신규 생성 (0-based, 첫/마지막 고정 + 현재 ±2 윈도우 + 생략부호 1개 삽입, 다크모드 대응) |
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | `useColumnResize` storageKey `tpmp:admin-questions:col-widths` → `:v2`, 관리 컬럼 기본폭 160→240; 인라인 `show`/`gap` 페이지네이션 블록(생략부호 미출력 버그)을 `<Pagination page={page} totalPages={totalPages} onChange={setPage} />`로 교체 |
| `CLAUDE.md` | 수정 | Shared Utilities 표에 `Pagination` 행 추가 |

### 수정 상세

#### `frontend/src/app/admin/exams/questions/page.tsx`
- 변경 전: `useColumnResize('tpmp:admin-questions:col-widths', [56, 360, 96, 112, 112, 112, 160])`; 페이지네이션은 `Array.from({length: totalPages}, ...)` 내부에서 `show`/`gap` boolean을 조합해 렌더(gap 조건이 깨져 있어 …가 표시되지 않고 페이지 번호가 붙어보임).
- 변경 후: `useColumnResize('tpmp:admin-questions:col-widths:v2', [56, 360, 96, 112, 112, 112, 240])`; 페이지네이션 블록을 `<div className="px-5 py-4 border-t border-gray-100"><Pagination page={page} totalPages={totalPages} onChange={setPage} /></div>`로 단순화.
- 이유: 관리 컬럼 폭이 상세/수정/삭제 버튼 3개 총폭(~232px)보다 좁아 wrapper(overflow-hidden)에 잘렸고, 페이지네이션 생략부호 로직이 깨져 있어 통일된 공통 컴포넌트로 교체.

### 복원 방법
이 ID(HIST-20260704-007)만으로 복원 시: `useColumnResize` 호출을 `('tpmp:admin-questions:col-widths', [56, 360, 96, 112, 112, 112, 160])`로 되돌리고, Pagination import를 제거한 뒤 페이지네이션 블록을 원래의 `Array.from`+`show`/`gap` 인라인 코드로 복원한다.

## HIST-20260703-006

- **날짜**: 2026-07-03
- **수정 범위**: 관리자 프론트엔드 / 공통 UI — 컬럼 리사이즈 핸들 공통 컴포넌트 추출, 문항관리표 통일
- **수정 개요**: 문항관리 표 6개 th에 인라인으로 반복되던 리사이즈 핸들 span 구조를 `ColResizeHandle` 공통 컴포넌트로 추출. questions/page.tsx를 해당 컴포넌트로 통일(순수 리팩토링). 이후 다른 관리자 표 재사용 전제 작업. CLAUDE.md Shared Utilities 표에 행 추가.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/ColResizeHandle.tsx` | 추가 | 드래그 리사이즈 핸들 컴포넌트 신규 생성 (얇은 선 w-px + 8px 히트영역 w-2 중첩 구조) |
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | ColResizeHandle import 추가; th 내 인라인 핸들 span 6개(index 0~5)를 `<ColResizeHandle onMouseDown={(e) => startResize(N, e)} />`로 교체 |
| `CLAUDE.md` | 수정 | Shared Utilities 표에 ColResizeHandle 행 추가 |

### 수정 상세

#### `frontend/src/components/ui/ColResizeHandle.tsx` (신규)
- 변경 전: 존재하지 않음
- 변경 후: `'use client'` 지시자 포함. Props `{ onMouseDown: (e: React.MouseEvent) => void }`. 바깥 span(`group absolute top-0 -right-1 h-full w-2 cursor-col-resize select-none flex justify-center`) + 안쪽 span(`w-px h-full bg-gray-300 group-hover:bg-indigo-400 transition-colors dark:bg-gray-600 dark:group-hover:bg-indigo-500`) 중첩 구조.
- 이유: 6개 th에 동일 span 6벌이 중복되어 있어 공통 컴포넌트로 추출. 이후 다른 관리자 표에서 재사용 가능.

#### `frontend/src/app/admin/exams/questions/page.tsx`
- 변경 전: 각 th 안에 `<span onMouseDown={(e) => startResize(N, e)} className="group absolute top-0 -right-1 h-full w-2 cursor-col-resize select-none flex justify-center"><span className="w-px h-full ... " /></span>` 6벌 (N=0~5)
- 변경 후: `import { ColResizeHandle } from '@/components/ui/ColResizeHandle';` 추가; 6개 핸들 각각 `<ColResizeHandle onMouseDown={(e) => startResize(N, e)} />`로 교체
- 이유: 순수 리팩토링. 동작·시각 변화 없음.

#### `CLAUDE.md`
- 변경 전: Shared Utilities 표에 ColResizeHandle 없음
- 변경 후: ColResizeHandle 행 추가

### 복원 방법
이 ID(HIST-20260703-006)만으로 복원 시:
- `frontend/src/components/ui/ColResizeHandle.tsx` 파일 삭제
- `frontend/src/app/admin/exams/questions/page.tsx`: `import { ColResizeHandle }` 줄 제거; `<ColResizeHandle onMouseDown={(e) => startResize(N, e)} />` 6개를 아래 span 구조로 원복:
  ```tsx
  <span onMouseDown={(e) => startResize(N, e)} className="group absolute top-0 -right-1 h-full w-2 cursor-col-resize select-none flex justify-center">
    <span className="w-px h-full bg-gray-300 group-hover:bg-indigo-400 transition-colors dark:bg-gray-600 dark:group-hover:bg-indigo-500" />
  </span>
  ```
- `CLAUDE.md`: Shared Utilities 표에서 ColResizeHandle 행 제거

---

## HIST-20260703-005

- **날짜**: 2026-07-03
- **수정 범위**: 관리자 프론트엔드 / 문항 관리 목록 — 리사이즈 핸들 두께 개선 (HIST-20260703-004 후속)
- **수정 개요**: 핸들이 `w-1`(4px) 전체 배경으로 두껍게 보이던 문제 해결. **얇은 선(1px) + 넓은 히트영역(8px)** 중첩 구조로 변경 — 바깥 span(`group -right-1 w-2 flex justify-center`, 8px 투명 히트영역·경계 중앙 정렬)에 안쪽 선 span(`w-px bg-gray-300`, group-hover 시 indigo). 선은 얇게 보이되 드래그는 쉽게.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | 핸들 6개를 단일 span(w-1 전체 배경)에서 중첩 구조(바깥 w-2 히트영역 + 안쪽 w-px 선, group-hover)로 교체 |

### 되돌림 방법

핸들을 단일 span `absolute top-0 right-0 h-full w-1 ... bg-gray-300 hover:bg-indigo-400 ...`(self-closing)으로 원복.

---

## HIST-20260703-004

- **날짜**: 2026-07-03
- **수정 범위**: 관리자 프론트엔드 / 문항 관리 목록 — 리사이즈 핸들 시각성 개선 (HIST-20260703-002 후속)
- **수정 개요**: 컬럼 리사이즈 핸들이 평소 배경 없이 `hover:bg-indigo-300`만 있어 경계가 안 보이던 문제 해결. 핸들 span 6개(인덱스 0~5)에 평소 표시용 `bg-gray-300`(다크 `dark:bg-gray-600`) + hover 강조 `hover:bg-indigo-400`(다크 `dark:hover:bg-indigo-500`) + `transition-colors` 적용.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | 리사이즈 핸들 6개 className에 평소 구분선 색(bg-gray-300/dark:bg-gray-600) + hover 강조(indigo-400/500) + transition-colors 추가 |

### 되돌림 방법

핸들 span className을 `absolute top-0 right-0 h-full w-1 cursor-col-resize select-none hover:bg-indigo-300`으로 원복.

---

## HIST-20260703-003

- **날짜**: 2026-07-03
- **수정 범위**: 관리자 프론트엔드 / 문항 관리 목록 — 리사이즈 UX 완성도 개선 (HIST-20260703-002 후속)
- **수정 개요**: (1) table-fixed 전환 후 컬럼을 좁힐 때 유형·카테고리·등록일·수정일 td 내용이 인접 셀로 시각 넘침 — `overflow-hidden` 추가. (2) 드래그 도중 컴포넌트 언마운트 시 mousemove/mouseup 리스너 잔존 + body 스타일 미복원 문제 — `activeCleanupRef` + 언마운트 `useEffect` cleanup 추가.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | 유형·카테고리 td에 `overflow-hidden` 추가(2개); 등록일·수정일 td에 `overflow-hidden` 추가(2개) |
| `frontend/src/lib/useColumnResize.ts` | 수정 | `activeCleanupRef` useRef 추가; 언마운트 `useEffect` cleanup 추가; `removeListeners` 공통 함수로 리팩토링(정상 mouseup·언마운트 양쪽 재사용) |

### 수정 상세

#### `frontend/src/app/admin/exams/questions/page.tsx`
- **유형 td**: `className="px-4 py-3.5 text-center whitespace-nowrap"` → `"... overflow-hidden"` 추가
- **카테고리 td**: 동일 패턴 적용
- **등록일 td**: `className="px-4 py-3.5 text-gray-400 whitespace-nowrap"` → `"... overflow-hidden"` 추가
- **수정일 td**: 동일 패턴 적용
- 제목/내용 td는 이미 `max-w-0` + inner `truncate` 적용 중 → 변경 없음
- No. td, 관리 td는 내용 특성상 overflow 불필요 → 변경 없음

#### `frontend/src/lib/useColumnResize.ts`
- 변경 전: `onMouseUp` 안에서만 리스너 제거. 드래그 중 언마운트 시 `mousemove`·`mouseup` 리스너 잔존, `document.body.userSelect/cursor` 미복원
- 변경 후:
  - `activeCleanupRef = useRef<(() => void) | null>(null)` 추가
  - `useEffect(() => () => { activeCleanupRef.current?.(); }, [])` 언마운트 cleanup 추가
  - `startResize` 내부: `removeListeners()` 공통 함수(스타일 복원 + 양쪽 리스너 제거 + ref null화)로 추출
  - `onMouseUp`은 `removeListeners()` 호출 후 localStorage 저장만 담당
  - `document.addEventListener` 직후 `activeCleanupRef.current = removeListeners` 등록

### 복원 방법
이 ID(HIST-20260703-003)만으로 복원 시:
- `page.tsx`: 유형·카테고리 td className에서 `overflow-hidden` 제거(2개), 등록일·수정일 td에서 제거(2개)
- `useColumnResize.ts`: `activeCleanupRef` 선언 제거; 언마운트 `useEffect` 제거; `removeListeners` 인라인 제거 후 이전 `onMouseUp` 구조(직접 스타일 복원 + 리스너 제거 + localStorage 저장) 복원

---

## HIST-20260703-002

- **날짜**: 2026-07-03
- **수정 범위**: 관리자 프론트엔드 / 문항 관리 목록 — 테이블 컬럼 드래그 리사이즈 + localStorage 영속
- **수정 개요**: 문항관리 목록 표의 컬럼 너비를 th 경계 핸들 드래그로 조절하는 기능 추가. 조절된 너비는 localStorage(`tpmp:admin-questions:col-widths`)에 저장되어 새로고침 후에도 유지. 공통 훅 `useColumnResize`(SSR 안전, 최소 40px 제한, 드래그 중 텍스트 선택 방지) 신설. 라이브러리 없이 순수 React+document 이벤트로 구현.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/useColumnResize.ts` | 추가 | 컬럼 드래그 리사이즈 훅 신규 생성. storageKey·defaultWidths 수신 → widths 배열 + startResize 핸들러 반환 |
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | useColumnResize import·훅 호출 추가; table에 `table-fixed`; `<colgroup>` 삽입; 7개 th에서 고정폭 클래스 제거 + `relative` 추가 + 핸들 `<span>` 삽입(마지막 컬럼 제외); 등록일·수정일 정렬 버튼에 `pr-2` 추가(핸들 겹침 방지) |
| `CLAUDE.md` | 수정 | Shared Utilities 표에 `useColumnResize` 행 추가 |

### 수정 상세

#### `frontend/src/lib/useColumnResize.ts` (신규)
- 변경 전: 존재하지 않음
- 변경 후: `useColumnResize(storageKey, defaultWidths)` 훅. 초기화 시 localStorage[storageKey] 파싱(길이 불일치·파싱 실패 시 defaultWidths 폴백). `startResize(index, e)`: mousedown에서 startX·startWidth 캡처 → mousemove로 delta 계산해 widths[index] 갱신(최소 40px) → mouseup에서 리스너 제거 + localStorage 저장 + cursor/userSelect 복원. `widthsRef`(useEffect 동기화)로 mouseup 시점 최신값 확보. `typeof window` 체크로 SSR 안전.
- 이유: 여러 관리자 테이블에서 재사용 가능하도록 공통 훅으로 추출.

#### `frontend/src/app/admin/exams/questions/page.tsx`
- **import 추가**: `import { useColumnResize } from '@/lib/useColumnResize';`
- **훅 호출 추가** (페이지네이션 상태 선언 직후):
  - 변경 전: 없음
  - 변경 후: `const { widths, startResize } = useColumnResize('tpmp:admin-questions:col-widths', [56, 360, 96, 112, 112, 112, 160]);`
- **table 클래스**:
  - 변경 전: `className="w-full text-sm"`
  - 변경 후: `className="w-full text-sm table-fixed"`
- **colgroup 삽입** (thead 바로 위):
  - 변경 전: 없음
  - 변경 후: `<colgroup>{widths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>`
- **th No.**: `w-12` 제거, `relative` 추가, 핸들 `<span>` 추가 (index 0)
- **th 문항제목/내용**: `relative` 추가, 핸들 `<span>` 추가 (index 1)
- **th 유형**: `w-24` 제거, `relative` 추가, 핸들 `<span>` 추가 (index 2)
- **th 카테고리**: `w-28` 제거, `relative` 추가, 핸들 `<span>` 추가 (index 3)
- **th 등록일**: `w-28` 제거, `relative` 추가, 정렬 버튼에 `pr-2` 추가, 핸들 `<span>` 추가 (index 4)
- **th 수정일**: `w-28` 제거, `relative` 추가, 정렬 버튼에 `pr-2` 추가, 핸들 `<span>` 추가 (index 5)
- **th 관리**: `w-40` 제거, `relative` 추가 (마지막 컬럼이므로 핸들 없음)
- 핸들 스타일: `absolute top-0 right-0 h-full w-1 cursor-col-resize select-none hover:bg-indigo-300`

#### `CLAUDE.md`
- Shared Utilities 표에 `useColumnResize(storageKey, defaultWidths)` 행 추가 (`src/lib/useColumnResize.ts`)

### 복원 방법
이 ID(HIST-20260703-002)만으로 복원 시:
- `frontend/src/lib/useColumnResize.ts` 파일 삭제
- `frontend/src/app/admin/exams/questions/page.tsx`:
  - `import { useColumnResize }` 줄 제거
  - `const { widths, startResize } = useColumnResize(...)` 훅 호출 블록(주석 포함 3줄) 제거
  - `<table className="w-full text-sm table-fixed">` → `<table className="w-full text-sm">`
  - `<colgroup>...</colgroup>` 블록 제거
  - 각 `<th>` 복원: `relative` 제거, 원래 고정폭 클래스 복원(`w-12`/`w-24`/`w-28`/`w-28`/`w-28`/`w-40`), 핸들 `<span>` 제거, 등록일·수정일 버튼 `pr-2` 제거
- `CLAUDE.md`: Shared Utilities 표에서 `useColumnResize` 행 제거

---

## HIST-20260703-001

- **날짜**: 2026-07-03
- **수정 범위**: 관리자 프론트엔드 / 문항 관리 목록 — 검색 시험연도·회차 input→select 콤보박스
- **수정 개요**: 문항관리 검색 패널의 시험연도·회차 조건을 `<input type="number">`에서 `allQuestions` 데이터 기반 `<select>` 콤보박스로 교체. yearOptions(내림차순)/roundOptions(오름차순) useMemo 추가. TypeScript strict `filter((v): v is number => v != null)` 적용.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | yearOptions·roundOptions useMemo 추가; 시험연도 input(w-24)→select(w-28); 회차 input→select; onKeyDown Enter 제거 |

### 수정 상세

#### `frontend/src/app/admin/exams/questions/page.tsx`

**[1] yearOptions useMemo 추가 (categoryOptions 블록 직후)**
- 변경 전: 없음
- 변경 후: `allQuestions.map(q => q.examYear).filter((v): v is number => v != null)` → Set 중복제거 → 내림차순 정렬

**[2] roundOptions useMemo 추가**
- 변경 전: 없음
- 변경 후: `allQuestions.map(q => q.examRound).filter((v): v is number => v != null)` → Set 중복제거 → 오름차순 정렬

**[3] 시험연도 입력 교체**
- 변경 전: `<div className="w-24">` + `<input type="number" placeholder="예: 2024" onKeyDown Enter→handleSearch />`
- 변경 후: `<div className="w-28">` + `<select>전체 + yearOptions.map(y => {y}년)</select>`

**[4] 회차 입력 교체**
- 변경 전: `<div className="w-24">` + `<input type="number" placeholder="예: 1" onKeyDown Enter→handleSearch />`
- 변경 후: `<div className="w-24">` + `<select>전체 + roundOptions.map(r => 제{r}회)</select>`

### 복원 방법
이 ID(HIST-20260703-001)만으로 복원 시:
- `yearOptions`·`roundOptions` useMemo 2개 제거
- 시험연도: `<div className="w-28">` → `<div className="w-24">`, select → `<input type="number" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="예: 2024" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" />`
- 회차: select → `<input type="number" value={roundFilter} onChange={(e) => setRoundFilter(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="예: 1" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" />`

---

## HIST-20260702-001

- **날짜**: 2026-07-02
- **수정 범위**: 관리자 프론트엔드 / AI 문항 분석 패널 — keyword_tag 전역 태그 사전 완전 제거, AI 문제 생성 태그 직접입력화
- **수정 개요**: QuestionAnalysisPanel의 "태그 저장" 버튼·handleSaveTags 제거. TagMultiSelect를 keywordTagService 드롭다운 검색에서 자유 텍스트 직접입력(Enter/추가 버튼)으로 전환. keywordTagService.ts 파일 삭제. "AI 문제 생성" 안내 문구 변경.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/QuestionAnalysisPanel.tsx` | 수정 | keywordTagService import 제거, useRef 제거, TagMultiSelect 드롭다운→직접입력, saving/tagSaved 상태 제거, handleSaveTags 제거, 태그저장 버튼 블록 제거, pr-24 제거, 안내 문구·placeholder 변경, 알림 문구 "선택"→"입력" |
| `frontend/src/services/keywordTagService.ts` | 삭제 | KeywordTag 타입, saveBulk/search API 서비스 |

### 수정 상세

#### `QuestionAnalysisPanel.tsx`

**[1] import 변경**
- 변경 전: `import { useState, useEffect, useRef } from 'react';` + `import { keywordTagService, type KeywordTag } from '@/services/keywordTagService';`
- 변경 후: `import { useState, useEffect } from 'react';` (keywordTagService·useRef 제거)

**[2] TagMultiSelect 컴포넌트 전면 교체**
- 변경 전: `q`(검색어) state, `options: KeywordTag[]` state, `open`(드롭다운) state, `wrapRef` useRef; keywordTagService.search debounce 200ms useEffect; 외부 클릭 mousedown useEffect; 드롭다운 목록(useCount 표시 포함)
- 변경 후: `inputVal` state 하나만; Enter 키/추가 버튼으로 onToggle 호출 후 입력창 비움; 중복·빈 값 방지; 선택 칩 표시(×제거)는 유지; API 호출 없음

**[3] 상태 제거**
- `saving: boolean`, `tagSaved: boolean` 제거
- `useEffect(() => { setTagSaved(false); }, [result])` 제거

**[4] handleSaveTags 함수 제거**
- 변경 전: keywordTagService.saveBulk 호출 후 tagSaved=true 세팅
- 변경 후: 함수 없음

**[5] 키워드 추출 패널에서 "태그 저장" 버튼 블록 제거**
- 변경 전: `<div className="relative ...">` + `{result && (<button ... 태그저장>)}` absolute 우상단 버튼 + 별도 flow 컨텐츠 div
- 변경 후: `relative` class 제거, absolute 버튼 블록 삭제, flow 컨텐츠 div 단순화

**[6] 결과 영역 pr-24 제거**
- 변경 전: `<div className={result ? 'space-y-3 pr-24' : 'space-y-3'}>`
- 변경 후: `<div className="space-y-3">`

**[7] AI 문제 생성 패널 안내 문구 변경**
- 변경 전: `"저장된 태그를 선택하여 새로운 문제를 생성합니다."`
- 변경 후: `"키워드·도메인을 입력하여 새로운 문제를 생성합니다."`

**[8] placeholder 변경**
- 키워드: `"키워드 검색 또는 선택..."` → `"키워드 입력 후 Enter..."`
- 도메인: `"도메인 검색 또는 선택..."` → `"도메인 입력 후 Enter..."`

**[9] AlertModal 문구 변경**
- `handleGenerateFromTags`: `"키워드 또는 도메인을 하나 이상 선택하세요."` → `"키워드 또는 도메인을 하나 이상 입력하세요."`

#### `keywordTagService.ts` (삭제)
- 변경 전: `KeywordTag` 인터페이스(id·name·type·useCount), `saveBulk(keywords, domains)` POST, `search(type, q?)` GET
- 변경 후: 파일 없음

#### grep 참조 확인 결과
- 프론트엔드 전체에서 keywordTagService 참조: QuestionAnalysisPanel.tsx 및 keywordTagService.ts 2곳뿐 → 안전 삭제 확인

### 복원 방법
이 ID(HIST-20260702-001)만으로 복원 시:
- `keywordTagService.ts` 재생성 (원본: `saveBulk` POST `/admin/keyword-tags/bulk`, `search` GET `/admin/keyword-tags`)
- `QuestionAnalysisPanel.tsx`에서: import에 `useRef` 및 `keywordTagService/KeywordTag` 재추가; TagMultiSelect를 드롭다운 검색 방식으로 복원(q/options/open/wrapRef state, keywordTagService.search debounce useEffect, 외부클릭 useEffect); saving/tagSaved 상태 재추가; useEffect([result]) 재추가; handleSaveTags 함수 재추가; 키워드추출 패널에 태그저장 버튼 블록 및 relative/absolute 구조 복원; pr-24 복원; 안내문구·placeholder·AlertModal 문구 이전 값으로 복원

---

## HIST-20260701-005

- **날짜**: 2026-07-01
- **수정 범위**: 관리자 프론트엔드 / 문항 AI 분석 결과 영속화 — 분석 즉시저장(PATCH), 수정화면 복원, 신규등록 submit 시 저장, 재분석 덮어쓰기
- **수정 개요**: AI 분석 결과(keywords·domains·difficulty·summary)를 수정 화면에서 즉시 PATCH 저장하고, 재진입 시 initialResult로 복원. 신규 등록(new)은 submit payload에 포함. 재분석 시 덮어쓰기 보장.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/questionAnalysisService.ts` | 수정 | saveAnalysis(id, data) PATCH 메서드 추가 |
| `frontend/src/services/examService.ts` | 수정 | adminCreateQuestionsBulk·adminUpdateQuestion 타입에 aiKeywords/aiDomains/aiDifficulty/aiSummary optional 추가 |
| `frontend/src/types/index.ts` | 수정 | QuestionSummary에 aiKeywords?/aiDomains?/aiDifficulty?/aiSummary? 4필드 추가 |
| `frontend/src/components/ui/QuestionAnalysisPanel.tsx` | 수정 | Props에 initialResult?/onAnalyzed? 추가; result 초기값=initialResult; useEffect([initialResult]) 동기화; handleAnalyze 성공·MOCK 폴백 모두 onAnalyzed 호출 |
| `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx` | 수정 | FormState에 aiAnalysis 추가; 문항 로드 시 aiAnalysis 복원; handleAnalyzed 콜백(state갱신+silent PATCH); QuestionAnalysisPanel 두 위치에 initialResult/onAnalyzed 전달; handleSubmit payload에 ai 4필드 추가 |
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | QuestionDraft에 aiAnalysis 추가; emptyDraft에 null; parseTextToQuestions·simulateFileParse 생성 draft에 aiAnalysis:null; ManualQuestionCard Props에 onAnalyzed 추가; QuestionAnalysisPanel 두 위치에 initialResult/onAnalyzed 전달; updateManualQuestion 타입 QuestionAnalysis 포함; 호출측 onAnalyzed 전달; handleSubmit payload에 ai 4필드 추가 |

### 수정 상세

#### `questionAnalysisService.ts`
- 변경 전: analyze, regenerate 2개 메서드
- 변경 후: saveAnalysis(id, data) PATCH `/admin/questions/${id}/analysis` 추가

#### `examService.ts`
- 변경 전: adminCreateQuestionsBulk·adminUpdateQuestion 타입에 ai 필드 없음
- 변경 후: aiKeywords?·aiDomains?·aiDifficulty?·aiSummary? optional 추가

#### `types/index.ts`
- 변경 전: QuestionSummary에 ai 필드 없음
- 변경 후: aiKeywords?/aiDomains?/aiDifficulty?/aiSummary? 4필드 추가

#### `QuestionAnalysisPanel.tsx`
- 변경 전: Props에 initialResult/onAnalyzed 없음; result 초기값 null; handleAnalyze에 onAnalyzed 없음
- 변경 후: initialResult?/onAnalyzed? Props 추가; result 초기값=initialResult??null; useEffect(() => setResult(initialResult??null), [initialResult]) 복원 훅; handleAnalyze 정상/MOCK 폴백 양쪽 onAnalyzed?.(result) 호출

#### `edit/page.tsx`
- 변경 전: FormState에 aiAnalysis 없음; 문항 로드 시 ai 필드 무시; QuestionAnalysisPanel에 initialResult/onAnalyzed 없음; submit payload에 ai 필드 없음
- 변경 후: FormState.aiAnalysis: QuestionAnalysis|null 추가; 로드 시 q.aiKeywords&&q.aiDomains 있으면 {keywords,domains,difficulty,summary}로 세팅; handleAnalyzed = update('aiAnalysis',result)+saveAnalysis(id,result).catch(()=>{}); 패널 두 곳에 initialResult/onAnalyzed 전달; submit에 aiKeywords/aiDomains/aiDifficulty/aiSummary 추가

#### `new/page.tsx`
- 변경 전: QuestionDraft에 aiAnalysis 없음; ManualQuestionCard onAnalyzed 없음; submit에 ai 없음
- 변경 후: QuestionDraft.aiAnalysis 추가; emptyDraft/parseTextToQuestions/simulateFileParse aiAnalysis:null; ManualQuestionCard Props onAnalyzed:(result:QuestionAnalysis)=>void 추가; 패널 두 곳에 initialResult/onAnalyzed 전달; 호출측 onAnalyzed={(result)=>updateManualQuestion(q.localId,'aiAnalysis',result)}; submit payload에 ai 4필드 추가(ImportedDraft는 null→undefined)

### 복원 방법
이 ID(HIST-20260701-005)만으로 복원 시:
- `questionAnalysisService.ts`: saveAnalysis 메서드 제거
- `examService.ts`: adminCreateQuestionsBulk·adminUpdateQuestion에서 ai 4필드 제거
- `types/index.ts`: QuestionSummary에서 ai 4필드 제거
- `QuestionAnalysisPanel.tsx`: Props에서 initialResult/onAnalyzed 제거; result 초기값 null; useEffect([initialResult]) 제거; handleAnalyze에서 onAnalyzed 호출 제거
- `edit/page.tsx`: FormState.aiAnalysis 제거; 로드 시 ai 복원 제거; handleAnalyzed 제거; 패널 Props initialResult/onAnalyzed 제거; submit payload ai 4필드 제거
- `new/page.tsx`: QuestionDraft.aiAnalysis 제거; ManualQuestionCard onAnalyzed 제거; 드래프트 생성 시 aiAnalysis:null 제거; 패널 Props initialResult/onAnalyzed 제거; 호출측 onAnalyzed 제거; submit payload ai 필드 제거

---

## HIST-20260701-004

- **날짜**: 2026-07-01
- **수정 범위**: 관리자 프론트엔드 / 문항 등록·수정·분석 패널 — CODE 재구성 code+answer 확장, onApply 콜백 재설계, RegenResult 겹침 수정
- **수정 개요**: QuestionAnalysisPanel의 onApplyContent 단일 콜백을 onApply({content, code?, answer?}) 페이로드 콜백으로 재설계. CODE 재구성 시 설명·코드·정답 항목별 비교 UI 추가. RegenResult 비교 칼럼 겹침 버그(h-full 레이아웃 충돌) 수정.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/questionAnalysisService.ts` | 수정 | RegenerateRequest에 questionType?, originalCode?, language? 추가; QuestionRegenerate에 code?, answer? 추가 |
| `frontend/src/components/ui/QuestionAnalysisPanel.tsx` | 수정 | Props: onApplyContent→onApply({content,code?,answer?}), questionType 추가; 상태: regenerated 타입 string→QuestionRegenerate; 핸들러: questionType/originalCode/language 요청 포함, 응답 객체 저장; MOCK: CODE 유형 시 code/answer 포함; RegenResult 컴포넌트 전면 재작업 |
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | 비-CODE 패널: onApplyContent→onApply=(p)=>onChange(content); CODE 패널: onApply=(p)=>{onChange content+code+answer}, questionType 전달 |
| `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx` | 수정 | 동일 패턴, update 함수 사용 |
| `CLAUDE.md` | 수정 | Shared Utilities 표 QuestionAnalysisPanel 시그니처 갱신 |

### 수정 상세

#### `questionAnalysisService.ts`
- 변경 전: `RegenerateRequest`에 4필드, `QuestionRegenerate`에 content 단일 필드
- 변경 후: `RegenerateRequest`에 questionType?·originalCode?·language? 추가; `QuestionRegenerate`에 code?·answer? 추가

#### `QuestionAnalysisPanel.tsx`
- Props:
  - 변경 전: `onApplyContent?: (html: string) => void`
  - 변경 후: `onApply?: (payload: { content: string; code?: string; answer?: string }) => void`, `questionType?: string` 추가
- 상태: `regenerated: string | null` → `QuestionRegenerate | null`
- handleRegenerate/handleGenerateFromTags: questionType, originalCode(=code prop), language 요청에 포함; 응답 data 객체 전체 저장; MOCK 폴백 isCode 분기
- RegenResult 컴포넌트:
  - 변경 전: `{content, original?, onClose, onApply?}` Props, 단순 텍스트 비교, 버튼이 비교 영역 안에 존재, h-full로 칼럼 겹침
  - 변경 후: `{regen, original?, originalCode?, language?, isCode, onClose, onApply?}` Props, CODE: 설명·코드(CodeBlock)·정답 항목별 좌우 비교, 비-CODE: 기존 텍스트 비교, 버튼은 border-t pt-2 mt-2 독립 배치, h-full→flex-1, items-stretch→items-start로 겹침 해소
- MOCK_REGENERATED 상수 삭제 → MOCK_REGEN_CODE(코드 전용)로 대체

#### `new/page.tsx` / `edit/page.tsx`
- 변경 전: `onApplyContent={(html) => onChange/update('content', html)}`
- 변경 후:
  - 비-CODE 위치: `onApply={(p) => onChange/update('content', p.content)}`, `questionType={draft/form.questionType}` 추가
  - CODE 위치: `onApply={(p) => { onChange/update('content',...); if(p.code!==undefined)...; if(p.answer!==undefined)...; }}`

### 복원 방법
이 ID(HIST-20260701-004)만으로 복원 시:
- `questionAnalysisService.ts`: RegenerateRequest 4필드 복원, QuestionRegenerate content 단일 필드 복원
- `QuestionAnalysisPanel.tsx`: Props onApplyContent 복원, regenerated 타입 string 복원, RegenResult 이전 구조 복원, MOCK_REGENERATED 복원
- `new/page.tsx`, `edit/page.tsx`: `onApply`→`onApplyContent`, questionType prop 제거, CODE 위치 content 단일 onChange/update로 복원

---
## HIST-20260701-003

- **날짜**: 2026-07-01
- **수정 범위**: 관리자 프론트엔드 / AI 문항 분석 패널 — 재구성 전제조건 미충족 시 AlertModal 안내
- **수정 개요**: "재구성 시작" 클릭 시 키워드 추출(분석)을 아직 안 했으면 조용히 return하던 동작을 AlertModal 팝업으로 명확히 안내하도록 변경. "AI 문제 생성"도 방어적 AlertModal 안내 추가. 범용 알림 모달 컴포넌트(AlertModal) 신규 생성.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/AlertModal.tsx` | 추가 | 범용 알림 팝업 컴포넌트 (open·message·title·confirmLabel·onClose Props, ESC·오버레이 클릭 닫힘, amber 아이콘, 다크모드 대응) |
| `frontend/src/components/ui/QuestionAnalysisPanel.tsx` | 수정 | `alertMsg` 상태 추가; `handleRegenerate`에서 `!result` 시 AlertModal 표시; `handleGenerateFromTags`에서 태그 0개 시 AlertModal 표시; AlertModal 렌더 추가 |
| `CLAUDE.md` | 수정 | Shared Utilities 표에 AlertModal 행 추가 |

### 수정 상세

#### `frontend/src/components/ui/AlertModal.tsx` (신규)
- 변경 전: 존재하지 않음
- 변경 후: Props `{ open, message, title='알림', confirmLabel='확인', onClose }` 수신. `open=false` 시 null 반환. 오버레이(`fixed inset-0 z-[9999] bg-black/50`) + 카드(`rounded-xl shadow-2xl`) 구조. amber 정보 아이콘. ESC 키 닫힘(`useEffect` keydown). 오버레이 클릭 닫힘. PermissionDeniedModal과 동일 톤·스타일.
- 이유: 프로젝트에 범용 알림 모달이 없어 신규 생성.

#### `frontend/src/components/ui/QuestionAnalysisPanel.tsx`
- 변경 전: `handleRegenerate` — `if (!result || regenerating) return;` (조용한 return)
- 변경 후: `if (regenerating) return;` → `if (!result) { setAlertMsg('먼저 \'분석 시작\'...'); return; }` 로 분리
- 변경 전: `handleGenerateFromTags` — `if ((selKeywords.length === 0 && selDomains.length === 0) || regenerating) return;` (조용한 return)
- 변경 후: `if (regenerating) return;` → `if (selKeywords.length === 0 && selDomains.length === 0) { setAlertMsg('키워드 또는 도메인을 하나 이상 선택하세요.'); return; }` 로 분리
- 이유: 전제조건 미충족 시 아무 피드백이 없어 사용자가 버튼 고장으로 오인할 수 있음.

### 복원 방법
이 ID(HIST-20260701-003)만으로 복원 시:
- `AlertModal.tsx` 삭제
- `QuestionAnalysisPanel.tsx`: `import { AlertModal }` 제거, `alertMsg` 상태 제거, `handleRegenerate`를 `if (!result || regenerating) return;`으로 복원, `handleGenerateFromTags`를 `if ((selKeywords.length === 0 && selDomains.length === 0) || regenerating) return;`으로 복원, `<AlertModal .../>` 렌더 제거
- `CLAUDE.md`: Shared Utilities 표에서 AlertModal 행 제거

---

## HIST-20260701-002

- **날짜**: 2026-07-01
- **수정 범위**: 관리자 프론트엔드 / AI 문항 분석 — 재구성 결과 비교 UI
- **수정 개요**: "문제 재구성"·"AI 문제 생성" 결과가 새 문항만 보여주고 "이 문제로 교체" 시 기존 문항을 즉시 덮어써 비교 불가하던 것을, 적용 전 **기존 문항 vs 재구성 문항 좌우 2열 비교**(모바일 세로 스택) UI로 개선. 관리자가 교체 전 확인 가능.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/QuestionAnalysisPanel.tsx` | 수정 | `RegenResult`에 `original?` prop 추가, `hasOriginal`이면 `grid grid-cols-1 md:grid-cols-2`로 기존(muted)·재구성(indigo 강조) 좌우 비교 렌더. 없으면 기존 단일 박스 폴백. 사용처 2곳(재구성·AI 생성 패널)에 `original={content}` 전달. |

### 되돌림 방법

`RegenResult`를 단일 content 박스로 되돌리고 `original` prop·비교 grid 제거, 사용처의 `original={content}` 제거.

---

## HIST-20260701-001

- **날짜**: 2026-07-01
- **수정 범위**: 관리자 프론트엔드 / AI 문항 분석 — CODE 코드 포함 분석
- **수정 개요**: CODE 문항에서 QuestionAnalysisPanel이 코드(code)·언어(language)도 분석 API에 전달하도록 확장. 코드가 핵심인 프로그래밍 문항의 키워드/도메인 추출 정확도 향상.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/questionAnalysisService.ts` | 수정 | `analyze(content, code?, language?)`로 인자 확장 → 요청 body에 code/language 포함 |
| `frontend/src/components/ui/QuestionAnalysisPanel.tsx` | 수정 | Props에 `code?`, `language?` 추가, analyze 호출에 전달 |
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | CODE 패널에 `code={draft.code} language={draft.language}` 전달 |
| `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx` | 수정 | CODE 패널에 `code={form.code} language={form.language}` 전달 |

### 되돌림 방법

`analyze`를 단일 인자로 복원, Panel Props에서 code/language 제거, 등록·수정 화면 패널의 code/language 전달 제거. (백엔드 변경은 back/adm HIST-20260701-001 참조)

---

## HIST-20260630-001

- **날짜**: 2026-06-30
- **수정 범위**: 관리자 프론트엔드 / 문항 등록·수정 화면
- **수정 개요**: CODE 유형 선택 시 QuestionAnalysisPanel을 코드 섹션(언어·코드·정답) 아래로 이동; 비-CODE 유형은 기존과 동일하게 문항 내용 바로 밑 위치 유지

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | 문항 내용 div 내 QuestionAnalysisPanel을 `{!isCode && (...)}` 조건부 렌더로 감쌈; CODE 섹션 `{isCode && (...)}` 블록 직후에 `{isCode && (<QuestionAnalysisPanel .../>)}` 추가 |
| `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx` | 수정 | 동일 패턴 적용 (변수: form.content, update 함수) |

### 수정 상세

#### `frontend/src/app/admin/exams/questions/new/page.tsx` (`ManualQuestionCard` 내부)

- 변경 전:
  ```tsx
  <RichTextEditor ... />
  <QuestionAnalysisPanel content={draft.content} onApplyContent={(html) => onChange('content', html)} />
  </div>  {/* content div 닫힘 */}

  {isCode && (
    <div className="space-y-3"> {/* 언어·코드·정답 */} </div>
  )}
  ```
- 변경 후:
  ```tsx
  <RichTextEditor ... />
  {!isCode && (
    <QuestionAnalysisPanel content={draft.content} onApplyContent={(html) => onChange('content', html)} />
  )}
  </div>  {/* content div 닫힘 */}

  {isCode && (
    <div className="space-y-3"> {/* 언어·코드·정답 */} </div>
  )}

  {isCode && (
    <QuestionAnalysisPanel content={draft.content} onApplyContent={(html) => onChange('content', html)} />
  )}
  ```
- 이유: CODE 유형일 때 분석 패널이 코드 입력 영역 위에 위치해 UX 흐름이 어색함. 코드 섹션을 먼저 보고 분석하는 자연스러운 순서로 개선.

#### `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx`

- 변경 전/후: new/page.tsx와 동일 패턴. 변수만 `form.content`, `update('content', html)` 사용.
- 이유: 동일.

### 복원 방법
이 ID(HIST-20260630-001)만으로 복원 시:
- 두 파일 모두 `{!isCode && (<QuestionAnalysisPanel ... />)}` 조건을 제거하고 `<QuestionAnalysisPanel ... />`을 무조건 렌더로 복원 (content div 내부).
- CODE 섹션 직후 `{isCode && (<QuestionAnalysisPanel ... />)}` 블록 제거.

---

## HIST-20260626-002

- **날짜**: 2026-06-26
- **수정 범위**: 관리자 프론트엔드 / 공용 UI (문항 상세 팝업)
- **수정 개요**: 공용 컴포넌트 `QuestionDetailModal`의 헤더 배지 행에 카테고리 배지 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/QuestionDetailModal.tsx` | 수정 | `QuestionDetailItem` 인터페이스에 `categoryId?`·`categoryName?` 추가; 헤더 배지 행에 categoryName 조건부 렌더 |

### 수정 상세

#### `frontend/src/components/ui/QuestionDetailModal.tsx`

- **인터페이스 변경**
  - 변경 전: `QuestionDetailItem`에 `examRound?: number` 이후 content 필드
  - 변경 후: `examRound?: number` 다음에 `categoryId?: number`, `categoryName?: string` 두 필드 추가 (optional — 기존 사용처 깨지지 않음)

- **헤더 배지 행 변경**
  - 변경 전: questionType 배지 → (examYear/examRound) 배지 순서
  - 변경 후: questionType 배지 → **categoryName 배지(있을 때만)** → (examYear/examRound) 배지 순서
  - 스타일: `px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600`
  - 조건: `{question.categoryName && ( ... )}` — categoryName이 없으면 아무것도 렌더하지 않음

- **이유**: 문항 상세 팝업에서 해당 문항의 카테고리(문제 유형)를 시각적으로 확인하기 위함. 문항관리 목록 카테고리 배지와 동일한 톤(`bg-gray-100 text-gray-600`) 사용.

- **공용 컴포넌트 파급 범위**: 이 컴포넌트는 문항관리, 시험지 관리 상세, 사용자 북마크 등 여러 화면에서 공유됨. `categoryName`을 `QuestionDetailItem`에 담아 넘기는 사용처에서는 자동으로 배지가 표시됨. 넘기지 않는 기존 사용처는 배지가 렌더되지 않아 동작에 영향 없음.

### 복원 방법
이 ID(HIST-20260626-002)만으로 복원 시:
- `QuestionDetailItem`에서 `categoryId?: number`, `categoryName?: string` 두 필드 제거
- 헤더 배지 행에서 `{question.categoryName && ( <span ...>{question.categoryName}</span> )}` 블록 제거

---

## HIST-20260626-001

- **날짜**: 2026-06-26
- **수정 범위**: 관리자 프론트엔드 / 문항 관리 목록
- **수정 개요**: 문항 목록 테이블에 '카테고리' 컬럼 추가, 검색 패널에 카테고리 조회 조건 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | 카테고리 상태 쌍 추가, categoryOptions useMemo 산출, 필터 조건 추가, 검색 UI 카테고리 select 삽입, 테이블 헤더·행 카테고리 셀 추가, TableSkeleton cols 6→7 |

### 수정 상세

#### `frontend/src/app/admin/exams/questions/page.tsx`

- **상태 추가**
  - 변경 전: `categoryFilter`/`appliedCategoryFilter` 없음
  - 변경 후: `categoryFilter` + `appliedCategoryFilter` (string, 기본값 `''`) 쌍 추가

- **categoryOptions useMemo (신규)**
  - 변경 전: 없음
  - 변경 후: `allQuestions`에서 `categoryName`이 있는 항목만 중복 제거 후 알파벳 정렬 → `<select>` 옵션으로 사용

- **filtered useMemo 필터 조건 추가**
  - 변경 전: 카테고리 조건 없음
  - 변경 후: `appliedCategoryFilter === ''` → 미적용 / `'__UNCATEGORIZED__'` → `!q.categoryName` 문항만 / 그 외 → `q.categoryName === appliedCategoryFilter`; 의존성 배열에 `appliedCategoryFilter` 추가

- **검색 패널 UI**
  - 변경 전: 유형 select → 시험연도 → 회차 순서
  - 변경 후: 유형 select → **카테고리 select (전체/미분류/카테고리명 목록)** → 시험연도 → 회차
  - `handleSearch`, 초기화 조건/리셋에 `categoryFilter`/`appliedCategoryFilter` 포함

- **테이블 헤더**
  - 변경 전: No. / 문항 제목·내용 / 유형 / 등록일 / 수정일 / 관리 (6열)
  - 변경 후: No. / 문항 제목·내용 / 유형 / **카테고리** / 등록일 / 수정일 / 관리 (7열)

- **테이블 행 셀 추가**
  - 변경 전: 유형 배지 셀 다음 바로 등록일 셀
  - 변경 후: 유형 배지 셀 → **카테고리 셀** (값 있으면 `bg-gray-100 text-gray-600` 뱃지, 없으면 `—` 회색) → 등록일 셀

- **TableSkeleton**
  - 변경 전: `cols={6}`
  - 변경 후: `cols={7}`

- **이유**: 카테고리별 문항 분류 현황 파악 및 필터링 지원 — 기존 `QuestionSummary.categoryName` 필드와 백엔드 응답을 활용하여 BE 변경 없이 FE만으로 구현

### 복원 방법
이 ID(HIST-20260626-001)만으로 복원 시 위 "수정 상세"의 변경 전 내용을 적용한다.
- 상태: `categoryFilter`/`appliedCategoryFilter` 제거
- `categoryOptions` useMemo 제거
- `filtered` useMemo에서 카테고리 조건 블록 제거, 의존성 배열에서 `appliedCategoryFilter` 제거
- 검색 패널 카테고리 `<div>` 블록 제거
- `handleSearch`/초기화 버튼 조건·리셋에서 category 항목 제거
- 테이블 헤더 `<th>카테고리</th>` 제거
- 테이블 행 카테고리 `<td>` 블록 제거
- `TableSkeleton cols={7}` → `cols={6}`

---

## HIST-20260625-005

- **날짜**: 2026-06-25
- **수정 범위**: 관리자 프론트엔드 / 문항 관리 목록
- **수정 개요**: 문항 목록 검색 패널에 시험연도·회차 클라이언트 사이드 필터 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | 시험연도·회차 입력 상태 추가, 검색 UI에 두 입력칸 삽입, handleSearch·초기화·useMemo 필터·의존성 배열 확장 |

### 수정 상세

#### `frontend/src/app/admin/exams/questions/page.tsx`

- **상태 추가**
  - 변경 전: `keyword/typeFilter/dateFrom/dateTo` + `appliedKeyword/appliedTypeFilter/appliedDateFrom/appliedDateTo` 4쌍
  - 변경 후: `yearFilter/roundFilter` + `appliedYearFilter/appliedRoundFilter` 2쌍 추가 (string 타입, 빈 문자열이면 조건 미적용)

- **검색 UI (`<div className="flex flex-wrap items-end gap-3">` 내부)**
  - 변경 전: 문항내용 → 유형 → 등록일(시작) → 등록일(종료) → 검색 버튼
  - 변경 후: 문항내용 → 유형 → **시험연도(w-24) → 회차(w-24)** → 등록일(시작) → 등록일(종료) → 검색 버튼
  - 라벨/인풋 스타일은 기존 필드와 동일 (`block text-xs font-medium text-gray-500 mb-1` 라벨, `px-3 py-2 rounded-lg border ...` 인풋)
  - `type="number"`, placeholder로 사용 예시 표시, Enter 키로 검색 가능

- **`handleSearch`**
  - 변경 전: keyword/typeFilter/dateFrom/dateTo만 applied 상태로 복사
  - 변경 후: yearFilter/roundFilter → appliedYearFilter/appliedRoundFilter 복사 추가

- **초기화 버튼 표시 조건**
  - 변경 전: `keyword || typeFilter || dateFrom || dateTo || appliedKeyword || ...` 8개 조건
  - 변경 후: yearFilter/roundFilter/appliedYearFilter/appliedRoundFilter 4개 조건 추가

- **초기화 버튼 onClick**
  - 변경 전: 4개 입력·4개 applied 상태 초기화
  - 변경 후: yearFilter/roundFilter/appliedYearFilter/appliedRoundFilter 초기화 추가

- **`filtered` useMemo 필터 조건**
  - 변경 전: kw·typeFilter·날짜 범위만 적용
  - 변경 후: `appliedYearFilter !== ''`이면 `q.examYear !== Number(appliedYearFilter)`인 항목 제외; `appliedRoundFilter !== ''`이면 `q.examRound !== Number(appliedRoundFilter)`인 항목 제외. null/undefined인 문항은 조건이 걸리면 자연히 제외(정확 매칭).
  - 의존성 배열에 `appliedYearFilter, appliedRoundFilter` 추가

- **이유**: AI 커스텀 문항과 시험 기출 문항이 혼재하는 상황에서 특정 연도·회차의 기출 문항만 빠르게 조회하는 UX 필요. 백엔드 변경 없이 기존 500건 클라이언트 로드 패턴 위에서 동작.

### 복원 방법
이 ID(HIST-20260625-005)만으로 복원 시:
- `yearFilter/roundFilter/appliedYearFilter/appliedRoundFilter` 상태 4개 제거
- 검색 UI에서 시험연도·회차 `<div>` 2개 제거
- `handleSearch`에서 두 applied 복사 라인 제거
- 초기화 버튼 조건·onClick에서 4개 항목 제거
- `filtered` useMemo의 yearFilter/roundFilter 필터 2줄 제거 및 의존성 배열에서 제거

---

## HIST-20260625-004

- **날짜**: 2026-06-25
- **수정 범위**: 관리자 프론트엔드 / 문항 관리 목록
- **수정 개요**: HIST-20260625-003 갭 수정 — 제목 없는 문항(title null)에도 'AI 커스텀' 배지가 표시되도록 셀 구조 재배치. 배지/서브텍스트 줄을 title 분기 밖으로 공통화.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | td 내부 구조 재배치: title 유무 분기를 텍스트 행 단독으로 좁히고, 연/회차·AI커스텀 배지 줄을 title 분기 밖 공통 위치로 이동 |

### 수정 상세

#### `frontend/src/app/admin/exams/questions/page.tsx` (문항 테이블 td 셀)

- 변경 전 구조 (HIST-20260625-003 적용 후):
  ```tsx
  <td ...>
    {q.title ? (
      <div>
        <p className="truncate font-medium">{q.title}</p>
        {/* 배지/서브텍스트가 title 분기 안에만 존재 */}
        {(q.examYear != null || q.examRound != null) ? ( ... ) : ( 'AI 커스텀' 배지 )}
      </div>
    ) : (
      <p className="truncate text-gray-500">{stripHtml(q.content)}</p>
      {/* title 없으면 배지 없음 — 갭 */}
    )}
  </td>
  ```

- 변경 후 구조:
  ```tsx
  <td ...>
    <div>
      {/* 텍스트 행: title 있으면 제목, 없으면 content */}
      {q.title ? (
        <p className="truncate font-medium">{q.title}</p>
      ) : (
        <p className="truncate text-gray-500">{stripHtml(q.content)}</p>
      )}
      {/* 배지 행: title 유무와 독립적으로 항상 렌더 */}
      {(q.examYear != null || q.examRound != null) ? (
        <p className="text-xs text-slate-400 mt-0.5">...</p>
      ) : (
        <span className="... bg-amber-50 text-amber-600 ...">AI 커스텀</span>
      )}
    </div>
  </td>
  ```

- 이유: HIST-20260625-003에서 배지를 `q.title` true 분기 안에만 넣어, AI 커스텀 문항 중 제목이 없는 경우(오히려 흔한 케이스)에는 배지가 표시되지 않는 갭이 있었음. 텍스트 행과 배지 행을 분리하여 각각 독립적으로 렌더링하도록 구조 변경.

### 복원 방법
이 ID(HIST-20260625-004)만으로 복원 시: HIST-20260625-003의 "변경 후" 코드(배지가 title 분기 안에 있는 구조)를 `questions/page.tsx` 해당 위치에 적용한다.

---

## HIST-20260625-003

- **날짜**: 2026-06-25
- **수정 범위**: 관리자 프론트엔드 / 문항 관리 목록
- **수정 개요**: 문항 목록에서 examYear·examRound 둘 다 null인 문항에 'AI 커스텀' amber 배지 표시 (방식 A 휴리스틱)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | 제목 아래 연/회차 서브텍스트를 `if/else` 분기로 확장 — 연/회차 중 하나라도 있으면 기존 slate 텍스트, 둘 다 null이면 amber pill 배지 |

### 수정 상세

#### `frontend/src/app/admin/exams/questions/page.tsx` (L311-317 영역)
- 변경 전:
  ```tsx
  {(q.examYear || q.examRound) && (
    <p className="text-xs text-slate-400 mt-0.5">
      {q.examYear ? `${q.examYear}년` : ''}
      {q.examYear && q.examRound ? ' ' : ''}
      {q.examRound ? `제${q.examRound}회` : ''}
    </p>
  )}
  ```
- 변경 후:
  ```tsx
  {(q.examYear != null || q.examRound != null) ? (
    <p className="text-xs text-slate-400 mt-0.5">
      {q.examYear != null ? `${q.examYear}년` : ''}
      {q.examYear != null && q.examRound != null ? ' ' : ''}
      {q.examRound != null ? `제${q.examRound}회` : ''}
    </p>
  ) : (
    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
      AI 커스텀
    </span>
  )}
  ```
- 이유: AI 생성·커스텀 문항은 시험 연도/회차가 없으므로 기존 빈 상태에서 배지로 시각 구분. `|| falsy` 체크에서 `!= null` 명시 체크로 변경하여 `examYear = 0` 같은 엣지 케이스도 안전하게 처리.
- 다크모드: 이 화면 기존 배지(TYPE_COLOR)가 다크모드 변형을 사용하지 않으므로 amber 배지도 동일 패턴으로 라이트 전용 적용.

### 복원 방법
이 ID(HIST-20260625-003)만으로 복원 시: 위 "변경 전" 코드를 `questions/page.tsx` 해당 위치에 적용한다.

---

## HIST-20260625-002

- **날짜**: 2026-06-25
- **수정 범위**: 관리자 프론트엔드 / 시험지 문항 관리
- **수정 개요**: 시험지 생성·편집 화면에서 categoryId 누락 수정 — papers/new·papers/[id]/edit 두 화면의 문항 payload에 `categoryId` 추가 (HIST-20260625-001 자기진단 오류 정정)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/papers/new/page.tsx` | 수정 | `adminCreateExamWithQuestions` 문항 매핑에 `categoryId: q.categoryId ?? null` 추가 |
| `frontend/src/app/admin/exams/papers/[id]/edit/page.tsx` | 수정 | `adminAddQuestionsBulk` 문항 매핑에 `categoryId: q.categoryId ?? null` 추가 |

### 수정 상세

#### `papers/new/page.tsx`
- 변경 전: `selected.map((q) => ({ content, questionType, options, answer, explanation, code, language }))` — categoryId 누락.
- 변경 후: 동일 map에 `categoryId: q.categoryId ?? null` 추가. `allQuestions`는 `QuestionSummary[]`이고 `QuestionSummary.categoryId?`가 이미 존재하므로 타입 안전.
- 이유: categoryId가 없으면 BE QuestionRequest.categoryId=null → Question.category=null → ExamHistoryDetail.categoryName=null → 집계 쿼리 IS NOT NULL 조건으로 약점 차트 영구 공백.

#### `papers/[id]/edit/page.tsx`
- 변경 전: `toAdd.map((q) => ({ content, questionType, options, answer, explanation, code, language }))` — categoryId 누락.
- 변경 후: 동일 map에 `categoryId: q.categoryId ?? null` 추가.
- 이유: new/page.tsx와 동일.

### HIST-20260625-001 자기진단 정정
HIST-20260625-001의 "기존 new/page.tsx·edit/page.tsx가 QuestionSummary 타입으로 categoryId를 처리하고 있어 추가 FE 변경 불필요" 진단이 잘못되었다. 그 두 경로는 `admin/exams/questions/new`·`[id]/edit`(문제은행)이고, 실제 시험지 문항 진입점인 `admin/exams/papers/new`·`[id]/edit`는 categoryId를 payload에 포함하지 않고 있었다. 이번 HIST-20260625-002에서 해당 누락을 수정 완료.

### 복원 방법
이 ID(HIST-20260625-002)만으로 복원 시:
- `papers/new/page.tsx`: selected.map의 `categoryId: q.categoryId ?? null` 줄 제거
- `papers/[id]/edit/page.tsx`: toAdd.map의 `categoryId: q.categoryId ?? null` 줄 제거

---

## HIST-20260625-001

- **날짜**: 2026-06-25
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: frontend/src/types/index.ts의 ExamQuestion 인터페이스에 categoryId·categoryName 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | ExamQuestion 인터페이스에 `categoryId?: number`, `categoryName?: string` 추가 |

### 수정 상세

#### `types/index.ts`
- 변경 전: ExamQuestion에 id·seq·content·questionType·options·answer·explanation·code·language 9필드.
- 변경 후: `categoryId?: number`, `categoryName?: string` 2필드 추가. 백엔드 QuestionDetailResponse의 신규 필드와 타입 일치.
- 이유: 시험지 문항 편집 화면에서 categoryId·categoryName을 폼에 미리 채우기 위함.
- 자기진단 오류: "papers/new·papers/[id]/edit에서 추가 FE 변경 불필요"는 잘못된 진단이었음. → HIST-20260625-002에서 수정 완료.

### 복원 방법
이 ID(HIST-20260625-001)만으로 복원 시: ExamQuestion 인터페이스에서 categoryId·categoryName 필드 제거.

---

## HIST-20260528-007

- **날짜**: 2026-05-28
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 문항 등록·수정 화면에 AI 키워드 추출 버튼 및 결과 패널 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/questionAnalysisService.ts` | 추가 | AI 분석 API 서비스 (QuestionAnalysis 타입 포함) |
| `frontend/src/components/ui/QuestionAnalysisPanel.tsx` | 추가 | "키워드 추출" 버튼 + 결과 패널 공통 컴포넌트 |
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | ManualQuestionCard 내 에디터 하단에 QuestionAnalysisPanel 추가 |
| `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx` | 수정 | 에디터 하단에 QuestionAnalysisPanel 추가 |
| `CLAUDE.md` / `AGENTS.md` | 수정 | Shared Utilities 표에 QuestionAnalysisPanel 추가 |

### 수정 상세

#### `QuestionAnalysisPanel.tsx`
- 버튼: 문항 내용 10자 이상일 때 활성화, 분석 중 스피너 표시
- 결과 패널: 핵심 키워드(violet 태그) / 도메인(indigo 태그) / 난이도(색상 뱃지) / 요약 텍스트
- 에러 처리: API 키 미설정 또는 분석 실패 시 오류 메시지 표시
- 상태: 컴포넌트 로컬 상태 (`analyzing`, `result`, `error`) — 부모 상태 영향 없음

### 복원 방법

`QuestionAnalysisPanel` import 제거 및 컴포넌트 태그 제거, `questionAnalysisService.ts` 및 `QuestionAnalysisPanel.tsx` 삭제.

---

## HIST-20260505-014

- **날짜**: 2026-05-05
- **수정 범위**: 관리자 프론트엔드 / 공통 유틸 (문항 목록 미리보기)
- **수정 개요**: `stripHtml` — HTML 엔티티(`&nbsp;` 등)가 목록에 그대로 노출되던 문제 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/html.ts` | 수정 | 태그 제거 후 HTML 엔티티 디코딩 로직 추가 |

### 수정 상세

#### `src/lib/html.ts`
- 변경 전: `html.replace(/<[^>]+>/g, '').trim()` — 태그만 제거, 엔티티 미처리
- 변경 후: 태그 제거 → `&nbsp;` 등 엔티티 치환(`HTML_ENTITIES` 맵) → 연속 공백 정규화
- 이유: react-quill 에디터가 공백을 `&nbsp;`로 인코딩하여 저장하는데, 목록 미리보기에서 `stripHtml`을 거쳐도 엔티티가 남아 화면에 `&nbsp;` 문자열이 그대로 노출되던 사이드 이펙트

### 복원 방법

HIST-20260505-014 복원 시: `html.ts`에서 `HTML_ENTITIES` 상수와 엔티티 치환/공백 정규화 체인을 제거하고 `return html.replace(/<[^>]+>/g, '').trim();` 단일 줄로 복원.

---

## HIST-20260505-013

- **날짜**: 2026-05-05
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 문항 제목 필드 아래 자동완성 제안 표시 — 시험 연도 / 회차 / 시험 유형 / 문항 유형 값을 조합한 예시 제목과 "자동완성" 버튼 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | `ManualQuestionCard`에 `titleSuggestion` 계산 로직 + 제안 UI 추가 |
| `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx` | 수정 | `titleSuggestion` 계산 로직 + 제안 UI 추가 |

### 수정 상세

#### 제안 문자열 생성 규칙
- 시험 연도 있으면 `{년도}년`, 없으면 생략
- 시험 회차 있으면 `제{회차}회`, 없으면 생략
- 시험 유형 선택 시 슬레이브 name 추가
- 문항 유형 선택 시 슬레이브 name 추가
- 비어 있는 항목은 제외하고 ` / `로 결합

예시:
- 연도·회차·유형 모두: `2024년 / 제1회 / SQLD / SQL`
- 연도 없음: `제1회 / SQLD / SQL`
- 회차 없음: `2024년 / SQLD / SQL`
- 유형만 선택: `SQLD / SQL`

#### UI
- 변경 전: 제목 input만 존재, 정적 placeholder
- 변경 후: input 아래에 `예: {제안}` 회색 텍스트 + "자동완성" 버튼 표시 (제안이 비어 있으면 미표시)
- "자동완성" 클릭 시 title 필드에 제안 문자열 설정 — 이후 사용자가 직접 수정 가능

#### `new/page.tsx` (`ManualQuestionCard` 내부)
```tsx
const examTypeName    = examTypeSlaves.find((s) => s.id === draft.examTypeId)?.name ?? '';
const categoryName    = questionTypeSlaves.find((s) => s.id === draft.categoryId)?.name ?? '';
const titleSuggestion = [
  draft.examYear  ? `${draft.examYear}년`    : '',
  draft.examRound ? `제${draft.examRound}회` : '',
  examTypeName, categoryName,
].filter(Boolean).join(' / ');
```

#### `[id]/edit/page.tsx`
```tsx
const editExamTypeName = examTypeSlaves.find((s) => s.id === form.examTypeId)?.name ?? '';
const editCategoryName = questionTypeSlaves.find((s) => s.id === form.categoryId)?.name ?? '';
const titleSuggestion  = [
  form.examYear  ? `${form.examYear}년`    : '',
  form.examRound ? `제${form.examRound}회` : '',
  editExamTypeName, editCategoryName,
].filter(Boolean).join(' / ');
```

### 복원 방법

HIST-20260505-013 복원 시:
- `new/page.tsx` `ManualQuestionCard`: `examTypeName`, `categoryName`, `titleSuggestion` 변수 제거; 제안 UI div 제거
- `[id]/edit/page.tsx`: 동일하게 변수 3개와 제안 UI div 제거

---

## HIST-20260505-010

- **날짜**: 2026-05-05
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 도메인 마스터 조회를 이름(`m.name`) 기반에서 코드(`m.code`) 기반으로 변경 — 마스터명이 바뀌어도 도메인 슬레이브를 안정적으로 참조

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | `examTypeSlaves`·`questionTypeSlaves`·`examYearSlaves`·`examRoundSlaves` 조회를 `m.code`로 변경 |
| `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx` | 수정 | 동일 4개 슬레이브 조회를 `m.code`로 변경 |

### 수정 상세

#### `questions/new/page.tsx` 및 `questions/[id]/edit/page.tsx`

- 변경 전:
  ```ts
  const examTypeSlaves     = domains.find((m) => m.name === '시험 유형')?.slaves ?? [];
  const questionTypeSlaves = domains.find((m) => m.name === '문제 유형')?.slaves ?? [];
  const examYearSlaves     = domains.find((m) => m.name === '시험 연도')?.slaves ?? [];
  const examRoundSlaves    = domains.find((m) => m.name === '시험 회차')?.slaves ?? [];
  ```
- 변경 후:
  ```ts
  const examTypeSlaves     = domains.find((m) => m.code === 'EXAM_TYPE')?.slaves ?? [];
  const questionTypeSlaves = domains.find((m) => m.code === 'QUESTION_TYPE')?.slaves ?? [];
  const examYearSlaves     = domains.find((m) => m.code === 'EXAM_YEAR')?.slaves ?? [];
  const examRoundSlaves    = domains.find((m) => m.code === 'EXAM_ROUND')?.slaves ?? [];
  ```
- 이유: 마스터 이름은 관리자가 변경 가능하므로 이름 기반 조회는 취약. 코드(`DomainMaster.code`)는 시스템이 부여하는 불변 식별자이므로 안정적.

### 복원 방법

HIST-20260505-010 복원 시:
- `questions/new/page.tsx`, `questions/[id]/edit/page.tsx` 각 슬레이브 조회를 `m.name === '...'` 형태로 되돌림

---

## HIST-20260505-006

- **날짜**: 2026-05-05
- **수정 범위**: 관리자 프론트엔드 / 문항 관리 · 공통 UI
- **수정 개요**: 시험 연도/회차 hardcoded number input → 도메인 슬레이브 기반 콤보박스; RichTextEditor 하단 우측 드래그 리사이즈 핸들 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/RichTextEditor.tsx` | 수정 | 드래그 리사이즈 핸들 추가 (마우스·터치 지원), `currentMinH` state로 높이 관리 |
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | `examYearSlaves`·`examRoundSlaves` 도메인 추출; `ManualQuestionCard`에 전달; number input → select |
| `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx` | 수정 | 동일 슬레이브 추출; number input → select |

### 수정 상세

#### `RichTextEditor.tsx`
- 변경 전: `minHeight` prop 고정, 리사이즈 불가
- 변경 후: `currentMinH` state(초깃값=minHeight); 하단 우측 핸들 `onMouseDown`/`onTouchStart` 드래그로 높이 조절; 최소 minHeight 아래로 축소 불가

#### 시험 연도/회차 (questions/new, questions/[id]/edit)
- 변경 전: `type="number"` input (하드코딩된 min/max)
- 변경 후: `DomainSlave` 기반 `<select>` — 도메인 마스터명 `"시험 연도"` · `"시험 회차"` 슬레이브를 옵션으로 표시
- 표시 형식: `{s.name}년` / `제{s.name}회` (예: "2024년", "제1회")
- 저장값: `Number(s.name)` → `examYear`/`examRound` Integer 컬럼 (기존 DB 스키마 유지)
- 도메인 마스터(`시험 연도`, `시험 회차`)는 관리자 도메인 관리 페이지에서 추가

### 복원 방법

이 ID(HIST-20260505-006)만으로 복원 시:
- `RichTextEditor.tsx`: `currentMinH` state/핸들/이벤트 제거, `style={{ minHeight }}` 원복
- questions/new, questions/[id]/edit: `examYearSlaves`·`examRoundSlaves` 제거, select → number input 원복

---

## HIST-20260505-005

- **날짜**: 2026-05-05
- **수정 범위**: 관리자 프론트엔드 / 문항 관리, 시험 관리
- **수정 개요**: 문항 제목·시험 유형·문항 유형 필수값 처리; 등록/수정 폼 max-w를 max-w-3xl로 확대; 시험 등록/수정 max-w-lg → max-w-2xl 수정; 시험 수정 로딩 텍스트 → 스켈레톤

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | 제목·시험유형·문항유형 라벨 `*` 추가; handleSubmit 필수 검증; 가져오기 탭 유형 선택 필수; 컨테이너 max-w-3xl |
| `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx` | 수정 | 동일 필드 `*` 추가; handleSubmit 필수 검증 추가; 컨테이너 max-w-3xl |
| `frontend/src/app/admin/exams/new/page.tsx` | 수정 | max-w-lg → max-w-2xl |
| `frontend/src/app/admin/exams/[id]/edit/page.tsx` | 수정 | max-w-lg → max-w-2xl; 로딩 텍스트 → TableSkeleton |

### 수정 상세

#### 필수값 처리 (questions/new, questions/[id]/edit)
- 변경 전: 문항 제목·시험 유형·문항 유형 `(선택)` 표시, 제출 시 검증 없음
- 변경 후: 세 필드 모두 `*` 표시; 제출 시 미입력 시 에러 메시지 표시
- 직접입력 탭: 카드별로 순서대로 검증 (예: "문항 2: 시험 유형은 필수입니다.")
- 가져오기 탭: 전체 적용 시험 유형·문항 유형 미선택 시 에러

#### max-w 수정
- 변경 전: questions/new, questions/[id]/edit → max-w-2xl; exams/new, exams/[id]/edit → max-w-lg
- 변경 후: questions/* → max-w-3xl; exams/* → max-w-2xl

### 복원 방법

이 ID(HIST-20260505-005)만으로 복원 시:
- questions/new, questions/[id]/edit: 라벨 `*` → `(선택)`, handleSubmit 필수 검증 제거
- 각 컨테이너 max-w 이전 값으로 복원
- exams/[id]/edit: TableSkeleton → 텍스트 div 복원

---

## HIST-20260505-004

- **날짜**: 2026-05-05
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 문항 등록·수정 화면에 [문항 제목], [시험 연도/회차] 필드 추가; 문항 목록에서 제목으로 표시 + 제목/내용 통합 검색; 상세 모달에 제목·연도/회차 표시

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `QuestionSummary`에 `title?`, `examYear?`, `examRound?` 추가 |
| `frontend/src/components/ui/QuestionDetailModal.tsx` | 수정 | `QuestionDetailItem`에 새 필드 추가; 헤더에 제목·연도/회차 배지 표시 |
| `frontend/src/services/examService.ts` | 수정 | `adminCreateQuestionsBulk`, `adminUpdateQuestion` 타입에 새 필드 추가 |
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | 목록 컬럼 title 우선 표시, 검색 시 title+content 통합 |
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | `QuestionDraft`·`emptyDraft`에 새 필드; 카드 상단에 제목·연도/회차 입력 UI; API 전송 포함 |
| `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx` | 수정 | `FormState`·`defaultForm`에 새 필드; 로드 시 매핑; 폼 상단에 입력 UI; 저장 시 포함 |

### 수정 상세

#### 문항 목록 (`questions/page.tsx`)
- 변경 전: 항상 `stripHtml(q.content)` 표시
- 변경 후: `q.title`이 있으면 제목(+연도/회차 서브텍스트), 없으면 `stripHtml(q.content)` 폴백
- 검색 필터: 기존 content만 검색 → title과 content 모두 검색

#### 상세 모달 (`QuestionDetailModal.tsx`)
- 헤더: 제목 있으면 상단에 bold 표시, 연도+회차 있으면 `2024년 제1회` 형태 배지 표시

#### 등록·수정 폼
- 폼 최상단에 [문항 제목](text, max 200), [시험 연도](number), [시험 회차](number) 입력 필드 추가
- 모두 선택 항목 — 미입력 시 undefined로 전송

### 복원 방법

이 ID(HIST-20260505-004)만으로 복원 시:
- `types/index.ts`: `QuestionSummary`에서 title/examYear/examRound 제거
- `QuestionDetailModal.tsx`: QuestionDetailItem에서 새 필드 제거, 헤더를 이전 형태로 복원
- `examService.ts`: 두 메서드 타입에서 새 필드 제거
- `questions/page.tsx`: 컬럼 로직·검색 필터를 content 단독으로 복원
- `questions/new/page.tsx`: QuestionDraft·emptyDraft에서 새 필드 제거, 카드 UI 제거, API 전송에서 제거
- `questions/[id]/edit/page.tsx`: FormState·defaultForm에서 새 필드 제거, 로드·저장·UI 복원

---

## HIST-20260505-003

- **날짜**: 2026-05-05
- **수정 범위**: 관리자 프론트엔드 / 공통 UI
- **수정 개요**: `QuestionDetailModal` 푸터에 '수정' 버튼 추가 — 클릭 시 `/admin/exams/questions/{id}/edit` 이동 + 모달 닫기

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/QuestionDetailModal.tsx` | 수정 | 푸터에 '수정' Link 버튼 추가, `next/link` import 추가 |

### 수정 상세

#### `src/components/ui/QuestionDetailModal.tsx`
- 변경 전: 푸터에 '닫기' 버튼 하나만 존재 (full-width)
- 변경 후: '닫기' + '수정' 버튼 나란히 배치; '수정' 클릭 시 `/admin/exams/questions/${question.id}/edit`로 이동 및 `onClose` 호출
- 이유: 상세 확인 후 즉시 수정 화면으로 이동하는 UX 추가

### 복원 방법

이 ID(HIST-20260505-003)만으로 복원 시 `Link` import 제거, 푸터를 '닫기' 단독 full-width 버튼으로 되돌린다.

---

## HIST-20260505-002

- **날짜**: 2026-05-05
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 문항 관리 테이블에 '상세' 버튼 추가 — 클릭 시 `QuestionDetailModal`로 전체 내용 확인 가능

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | 문항 테이블 관리 컬럼에 '상세' 버튼 추가 (수정·삭제 버튼 좌측) |

### 수정 상세

#### `admin/exams/questions/page.tsx`
- 변경 전: 관리 컬럼 = [수정, 삭제]
- 변경 후: 관리 컬럼 = [상세, 수정, 삭제]
- 이유: 문항 내용이 에디터 HTML이라 테이블 셀에서 전체 확인 불가 → 모달로 상세 보기 제공

### 복원 방법

이 ID(HIST-20260505-002)만으로 복원 시 `questions/page.tsx`에서 '상세' 버튼과 `detailQ` 관련 코드를 제거한다.

---

## HIST-20260504-008

- **날짜**: 2026-05-04
- **수정 범위**: 관리자 프론트엔드 / 문제 관리
- **수정 개요**: 문제 등록 화면의 문제 목록 미리보기에서 HTML 태그 노출 수정 → `.replace(/<[^>]+>/g, '')` 적용

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | 가져온 문제 목록 미리보기 `q.content` HTML 태그 제거 |

### 수정 상세

#### `frontend/src/app/admin/exams/questions/new/page.tsx` (line 705)
- 변경 전: `{q.content}`
- 변경 후: `{q.content.replace(/<[^>]+>/g, '')}`
- 이유: 가져온 문제 목록 미리보기에 HTML 태그가 노출됨

### 복원 방법

이 ID(HIST-20260504-008)만으로 복원 시 위 "변경 전" 내용을 각 파일에 적용한다.

---

## HIST-20260504-005

- **날짜**: 2026-05-04
- **수정 범위**: INFRA / Next.js 설정 분리
- **수정 개요**: `next.config.js`를 공통·개발·프로덕션 3블록으로 분리

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/next.config.js` | 수정 | `sharedConfig` / `devConfig` / `prodConfig` 분리, `NODE_ENV`로 병합 |

### 수정 상세

#### `next.config.js` 구조 변경

| 블록 | 내용 |
|------|------|
| `sharedConfig` | `reactStrictMode`, `transpilePackages`, `webpack` — 환경 무관 공통 |
| `devConfig` | `rewrites()` — `/api/`, `/uploads/` → 백엔드 직접 프록시 (Nginx 없는 개발 환경) |
| `prodConfig` | 현재 비어 있음 — 향후 프로덕션 전용 설정 추가 지점 |

`module.exports = { ...sharedConfig, ...(isDev ? devConfig : prodConfig) }`

### 복원 방법

HIST-20260504-005 복원 시:
- 단일 `nextConfig` 객체로 병합, `module.exports = nextConfig`로 복원

---

## HIST-20260504-004

- **날짜**: 2026-05-04
- **수정 범위**: INFRA / Next.js 개발 프록시 — 업로드 이미지 404 수정 (로컬 개발 환경)
- **수정 개요**: `next.config.js` rewrites에 `/uploads/` 프록시 추가 — 개발 서버에서 이미지 404 해결

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/next.config.js` | 수정 | `rewrites()`에 `/uploads/:path*` → 백엔드 origin 프록시 항목 추가 |

### 수정 상세

#### 근본 원인

로컬 개발 환경에서 Nginx 없이 Next.js dev server가 직접 실행된다. `next.config.js`의 `rewrites`가 `/api/:path*`만 백엔드(`http://localhost:8080`)로 프록시하고, `/uploads/:path*`는 설정이 없었다. 백엔드가 반환한 `/uploads/images/...` URL을 브라우저가 요청하면 Next.js dev server로 가고 404가 발생했다.

#### `next.config.js`

- 변경 전: `/api/:path*` 프록시 1개
- 변경 후: `apiBase`에서 `backendOrigin`(`http://localhost:8080`)을 파싱해 `/uploads/:path*` 프록시 추가

```js
const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const backendOrigin = apiBase.replace(/\/api\/?$/, '');
// /uploads/:path* → http://localhost:8080/uploads/:path*
```

### 복원 방법

HIST-20260504-004 복원 시:
- `next.config.js` `rewrites()`에서 `backendOrigin` 변수 선언과 `/uploads/:path*` 항목 제거, `apiBase` 변수를 인라인으로 복원

---

## HIST-20260504-003

- **날짜**: 2026-05-04
- **수정 범위**: INFRA / Nginx — 업로드 이미지 404 수정
- **수정 개요**: Nginx에 `/uploads/` 경로 프록시 블록 추가 — 에디터 이미지 삽입 후 broken image 현상 해결

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `nginx/nginx.conf` | 수정 | `location /uploads/` 블록 추가 — 백엔드 정적 파일 서빙으로 프록시 |

### 수정 상세

#### 근본 원인

백엔드 `AttachmentService`는 이미지를 저장한 뒤 `/uploads/images/{uuid}.{ext}` 형태의 **상대 경로**를 반환한다.
Quill 에디터는 이 URL을 `<img src="/uploads/images/...">` 로 삽입한다.
브라우저가 해당 경로를 요청하면 Nginx가 처리하는데, 기존 nginx.conf에는 `/uploads/` 라우팅이 없었으므로 `location /` → Next.js(프론트엔드)로 전달되어 404가 발생했다.

백엔드 `WebMvcConfig`는 이미 `/uploads/**`를 파일 시스템으로 서빙하도록 설정되어 있으므로, Nginx에 라우팅만 추가하면 된다.

#### `nginx/nginx.conf`

- 변경 전: `/api/` → 백엔드, `/` → 프론트엔드 2개 블록만 존재
- 변경 후: `/uploads/` → 백엔드 프록시 블록 추가

```nginx
# 추가된 블록
location /uploads/ {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 복원 방법

HIST-20260504-003 복원 시:
- `nginx/nginx.conf`에서 `location /uploads/ { ... }` 블록 제거

---

## HIST-20260504-002

- **날짜**: 2026-05-04
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: RichTextEditor — `dynamic()` 래퍼로 인한 React ref 경고 및 Quill 인스턴스 미확보 문제 근본 해결

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/RichTextEditor.tsx` | 수정 | `dynamic()` 제거 → `useState` + `useEffect`로 클라이언트에서 react-quill 클래스 직접 로드; 폴링 의존성을 `RQ` 상태로 변경; 로딩 중 스켈레톤 플레이스홀더 추가 |

### 수정 상세

#### 근본 원인

`dynamic()`은 내부적으로 **함수 컴포넌트 래퍼**를 반환한다. 함수 컴포넌트에 `ref`를 전달하려면 `React.forwardRef`가 필요한데, `dynamic()` 래퍼 자체는 이를 적용하지 않는다. 팩토리 안에서 `React.forwardRef`로 감싸도 `dynamic()` 바깥 래퍼가 함수 컴포넌트이기 때문에 경고가 사라지지 않고, 결과적으로 `quillRef.current`가 항상 `null`이 된다. `quillRef.current`가 `null`이면 폴링이 Quill 인스턴스를 찾지 못해 이미지 삽입 자체가 동작하지 않는다.

#### `RichTextEditor.tsx`

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 로드 방식 | `dynamic()` + 팩토리 내 `React.forwardRef` 래퍼 | `useState<any>(null)` + `useEffect(() => import('react-quill'))` |
| ref 수신자 | `dynamic()` 함수 컴포넌트 래퍼 (→ 항상 null) | react-quill 클래스 컴포넌트 직접 (→ 정상 동작) |
| 폴링 트리거 | 마운트 1회 (`[]`) | `RQ` 상태 변경 시 (`[RQ]`) — 모듈 로드 전 폴링 시작 방지 |
| 로딩 UI | 없음 (빈 공간) | `animate-pulse` 스켈레톤 플레이스홀더 |

- 변경 이유: `dynamic()` 래퍼를 거치지 않고 클래스를 직접 렌더하면 React가 ref를 클래스 인스턴스에 정상 전달하므로 경고도 없고 `quillRef.current.getEditor()` 호출도 성공한다.

### 복원 방법

HIST-20260504-002 복원 시:
- `RQ` state 제거, `useState` import 제거
- `dynamic` import 추가, 팩토리 + `React.forwardRef` 래퍼 패턴 복원
- 폴링 `useEffect` 의존성을 `[]`로 복원
- 로딩 스켈레톤 div 제거, `<ReactQuill ref={quillRef} ... />` 무조건 렌더로 복원

---

## HIST-20260504-001

- **날짜**: 2026-05-04
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: RichTextEditor — 이미지 등록 시 에디터 미준비 알림 시점 개선 + 하이퍼링크 팝업 좌측 정렬 고정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/RichTextEditor.tsx` | 수정 | 이미지 핸들러(툴바)에 에디터 준비 여부 사전 검사 추가, `handleImageChange` 내 중복 alert 제거 |
| `frontend/src/app/globals.css` | 수정 | `.ql-tooltip`에 `left: 0 !important` 추가 — 링크 팝업 좌측 정렬 고정 |

### 수정 상세

#### `RichTextEditor.tsx` — 이미지 핸들러
- 변경 전: 툴바 이미지 버튼 클릭 시 에디터 준비 여부를 확인하지 않고 파일 다이얼로그를 바로 열었다. 사용자가 파일을 선택한 뒤 `handleImageChange`에서 `editorRef.current`가 null이면 "에디터가 아직 준비되지 않았습니다." alert가 표시됐다.
- 변경 후: 툴바 핸들러에서 `editorRef.current`를 먼저 확인하고, null이면 alert를 즉시 표시하고 파일 다이얼로그를 열지 않는다. `handleImageChange` 내의 중복 alert는 `return`만 남긴다.
- 이유: 파일을 선택한 후 알림이 뜨면 사용자가 업로드가 됐는지 안 됐는지 혼동한다. 파일 선택 전에 알리는 것이 자연스러운 UX다.

#### `globals.css` — `.ql-tooltip`
- 변경 전: Quill이 JS로 계산한 `left` 값을 그대로 사용 → 선택 영역 위치에 따라 팝업이 이동
- 변경 후: `left: 0 !important` 추가 → 링크 팝업이 항상 에디터 컨테이너 좌측에 고정
- 이유: 선택 위치에 따라 팝업이 좌우로 이동하면 가독성이 떨어지고 화면 밖으로 잘릴 수 있다. 좌측 고정으로 일관된 위치 보장.

### 복원 방법

HIST-20260504-001 복원 시:
- `RichTextEditor.tsx` 이미지 핸들러: `if (!quill) { alert(...); return; }` 라인 제거, `handleImageChange` 안의 `if (!quill) return;`을 `if (!quill) { alert('에디터가 아직 준비되지 않았습니다.'); return; }`로 되돌림
- `globals.css` `.ql-tooltip`: `left: 0 !important;` 라인 제거

---

## HIST-20260503-011

- **날짜**: 2026-05-03
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: RichTextEditor 이미지 삽입 불가("에디터가 아직 준비되지 않았습니다") 수정 + 하이퍼링크 툴팁 잘림 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/RichTextEditor.tsx` | 수정 | `useEffect`(매 렌더) → 폴링 방식(마운트 1회, 150ms 간격)으로 editorRef 초기화 방식 변경 |
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | ManualQuestionCard 래퍼 div에서 `overflow-hidden` 제거 |
| `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx` | 수정 | 폼 카드 래퍼 div에서 `overflow-hidden` 제거 |

### 수정 상세

#### `RichTextEditor.tsx`
- 변경 전: 매 렌더마다 실행되는 `useEffect`에서 `quillRef.current?.getEditor?.()`로 editorRef 설정 시도
- 변경 후: 마운트 시 1회만 등록되는 `useEffect` 내부에서 150ms 간격 폴링으로 Quill 인스턴스가 준비될 때까지 재시도; 언마운트 시 `cancelled = true` + `editorRef.current = null`로 정리
- 이유: `dynamic()` 비동기 로드 완료 시점이 마운트보다 늦을 수 있어, 매 렌더 방식으로도 타이밍을 맞추지 못하는 경우 발생

#### `new/page.tsx` (ManualQuestionCard)
- 변경 전: `<div className="... overflow-hidden">`
- 변경 후: `<div className="... ">`(overflow-hidden 제거)
- 이유: `overflow-hidden`이 Quill `.ql-tooltip`(절대위치 팝업)을 카드 경계에서 잘라냄

#### `[id]/edit/page.tsx` (폼 카드)
- 변경 전: `<div className="... overflow-hidden">`
- 변경 후: `<div className="... ">`(overflow-hidden 제거)
- 이유: 동일 — 하이퍼링크/색상 팝업이 카드 밖으로 나오지 못해 잘림

### 복원 방법

이 ID(HIST-20260503-011)만으로 복원 시:
- `RichTextEditor.tsx`: 폴링 `useEffect`를 매 렌더 실행 `useEffect`(의존 배열 없음, `if (editorRef.current) return;` 가드)로 교체
- `new/page.tsx` ManualQuestionCard 래퍼: `overflow-hidden` 다시 추가
- `[id]/edit/page.tsx` 폼 카드: `overflow-hidden` 다시 추가

---

## HIST-20260503-010

- **날짜**: 2026-05-03
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: RichTextEditor — `dynamic()` 래퍼로 인한 "Function components cannot be given refs" 스크립트 오류 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/RichTextEditor.tsx` | 수정 | `dynamic()` 반환 컴포넌트를 `React.forwardRef`로 감싸 ref 전달 경로 확보 |

### 수정 상세

#### `RichTextEditor.tsx`
- **오류 원인**: `dynamic(() => import('react-quill'), { ssr: false })`는 내부적으로 함수 컴포넌트 래퍼를 생성하는데, 함수 컴포넌트는 `React.forwardRef` 없이 `ref`를 받을 수 없음 → `<ReactQuill ref={quillRef} />`에서 런타임 경고·ref null 발생
- **변경 전**: `const ReactQuill = dynamic(() => import('react-quill'), { ssr: false }) as any`
- **변경 후**:
  ```tsx
  const ReactQuill = dynamic<any>(
    async () => {
      const { default: RQ } = await import('react-quill');
      const Fwd = React.forwardRef<any, any>((props, ref) => <RQ {...props} ref={ref} />);
      Fwd.displayName = 'ReactQuill';
      return Fwd;
    },
    { ssr: false },
  );
  ```
  - async 팩토리 함수 내에서 `React.forwardRef`로 ReactQuill을 감싼 뒤 반환
  - `ref`가 dynamic 래퍼 → forwardRef 래퍼 → ReactQuill 클래스 인스턴스까지 정확히 전달됨
  - `quillRef.current.getEditor()` 호출 가능 → `editorRef.current`에 원시 Quill 인스턴스 저장 성공

### 복원 방법

HIST-20260503-010 복원 시:
- `dynamic` 호출을 단순 `dynamic(() => import('react-quill'), { ssr: false }) as any` 형태로 되돌림
- `React` import에서 default export 제거 (`import { useRef, useMemo, useEffect } from 'react'`)

---

## HIST-20260503-009

- **날짜**: 2026-05-03
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: RichTextEditor 이미지 삽입 완전 수정 + 링크 팝업 잘림 수정 + 글자 크기·색상 기능 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/RichTextEditor.tsx` | 수정 | editorRef 분리(useEffect 마운트 후 저장), JSX 파일인풋 도입, 이미지 핸들러 안정화, 글자 크기·색상·배경색 툴바 추가 |
| `frontend/src/app/globals.css` | 수정 | overflow-hidden 제거→ql-container overflow:visible, 링크 tooltip z-index·border-radius 추가, 사이즈 피커 한국어 레이블, 다크모드 tooltip·picker 스타일 보완 |

### 수정 상세

#### `RichTextEditor.tsx`
- **이미지 미삽입 근본 원인**: `dynamic()` 래퍼를 통한 ref에서 `getEditor()`의 반환 타이밍이 불확실 → `useMemo` 핸들러 내에서 호출 시 null 가능성
- **수정 방법**:
  - `editorRef` 별도 추가 — `useEffect`(매 렌더 후 실행, 이미 설정 시 즉시 반환)로 `quillRef.current?.getEditor?.()`를 호출해 원시 Quill 인스턴스 저장
  - `fileRef` (JSX `<input type="file">`) 추가 — `createElement` 방식 제거, React 이벤트 시스템 내에서 파일 선택·업로드 처리
  - 이미지 핸들러: `editorRef.current` 사용, 커서 위치를 `savedIdx.current`에 저장 후 `fileRef.current?.click()`
  - `handleImageChange`: 파일 선택 → 업로드 → `quill.insertEmbed(idx, 'image', url)` → `setSelection(idx+1)`
- **기능 추가**: 툴바에 `size`(small/보통/large/huge), `color`, `background` 피커 추가; formats에 `'size', 'color', 'background'` 추가

#### `globals.css`
- **링크 팝업 잘림 수정**: 래퍼 div의 `overflow-hidden`(Tailwind 클래스) 제거, `.ql-container.ql-snow`에 `overflow: visible` 적용, `.ql-editor`에 `overflow-y: auto` 유지
- `.ql-toolbar`: `border-radius: 0.5rem 0.5rem 0 0` (상단 모서리)
- `.ql-container`: `border-radius: 0 0 0.5rem 0.5rem` (하단 모서리)
- `.ql-tooltip`: `z-index: 50`, `border-radius`, `box-shadow` 추가
- `.ql-picker-options`: `z-index: 50`, `border-radius`, `box-shadow` 추가
- 사이즈 피커 한국어 레이블: 작게/보통/크게/매우 크게
- 다크모드: tooltip 배경·테두리·텍스트·input 스타일, picker-item hover 추가

### 복원 방법

HIST-20260503-009 복원 시:
- `RichTextEditor.tsx`: `editorRef`/`fileRef`/`savedIdx` 제거, `useEffect` 제거, `modules`를 이전 핸들러(createElement 방식)로 복원, 툴바에서 size/color/background 제거, `handleImageChange` 제거
- `globals.css`: HIST-20260503-007 시점의 Quill 스타일 블록으로 복원

---

## HIST-20260503-008

- **날짜**: 2026-05-03
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 리치텍스트 에디터(react-quill) 이미지 삽입 버그 수정 — 파일 다이얼로그 오픈 시 포커스 소실로 selection null 반환하여 삽입이 무시되던 문제

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/RichTextEditor.tsx` | 수정 | 이미지 핸들러: 다이얼로그 열기 전 selection index 저장, 파일 선택 후 저장된 index에 insertEmbed |

### 수정 상세

#### `components/ui/RichTextEditor.tsx` — image handler
- **변경 전**: `input.click()` 후 `onchange`에서 `quill.getSelection(true)` 호출 → 파일 다이얼로그로 포커스 이동으로 selection이 null → `if (quill && range)` 조건 실패 → 이미지 삽입 무시
- **변경 후**:
  1. `input.click()` 호출 **전**에 `quill.getSelection()?.index` 저장 (`savedIndex`)
  2. `input.onchange` → `input.addEventListener('change', ...)` 변경
  3. 파일 선택 후 `savedIndex`로 `quill.insertEmbed(savedIndex, 'image', url)` 호출
  4. `getEditor` 존재 여부 방어적 처리: `rq?.getEditor ? rq.getEditor() : null`
  5. `url` 빈 문자열 guard 추가 (`if (!url) return`)

### 복원 방법

HIST-20260503-008 복원 시:
- `imageHandler`를 변경 전 방식(savedIndex 없이 onchange 안에서 getSelection)으로 되돌림

---

## HIST-20260503-007

- **날짜**: 2026-05-03
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 문항 내용 입력 필드를 textarea+ImageUploadButton에서 react-quill 기반 리치텍스트 에디터(`RichTextEditor`)로 교체 — 이미지 업로드 인라인 미리보기, 서식(굵게·기울임·목록 등) 지원

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/RichTextEditor.tsx` | 수정 | Tiptap 의존 제거 → react-quill 기반으로 전면 재작성, 이미지 업로드 핸들러 내장 |
| `frontend/src/app/globals.css` | 수정 | Quill `.rte-quill-wrapper` 스타일 통합 (테두리·다크모드·이미지 미리보기 등) |
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | `ImageUploadButton` import 제거 → `RichTextEditor` import; ManualQuestionCard의 content 필드 textarea→RichTextEditor 교체; `stripHtml` 헬퍼 추가로 유효성 검사 개선 |
| `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx` | 수정 | `ImageUploadButton` import 제거 → `RichTextEditor` import; 문항 내용 textarea→RichTextEditor 교체; `stripHtml` 유효성 검사 적용 |
| `frontend/package.json` | 수정 | `react-quill` 패키지 설치 (`npm install react-quill`) |

### 수정 상세

#### `components/ui/RichTextEditor.tsx`
- **변경 전**: Tiptap(`@tiptap/react`, `@tiptap/starter-kit` 등) 의존 — package.json에 없어 빌드 불가
- **변경 후**: `react-quill` 동적 import (`ssr: false`), `quill.snow.css` import
  - 툴바: 제목(H1~H3), 굵게·기울임·밑줄·취소선, 순서 있는/없는 목록, 링크, 이미지, 서식 초기화
  - 이미지 핸들러: 파일 선택 → `examService.adminUploadQuestionImage()` → Quill에 `insertEmbed`로 삽입, 업로드 즉시 인라인 미리보기
  - `modules` `useMemo` 안정화로 Quill 툴바 재설치 방지
  - Props: `value`, `onChange(html)`, `placeholder`, `minHeight`

#### `globals.css`
- `.rte-quill-wrapper` 래퍼 클래스 스타일 추가
  - `.ql-toolbar`, `.ql-container` 기본 border 제거 (부모 div border·ring으로 통합)
  - 툴바 배경: `#f9fafb`, 하단 구분선 유지
  - 에디터 폰트: Noto Sans KR 상속, `0.875rem`
  - 이미지: `max-width: 100%`, `border-radius: 6px`, 블록 표시로 미리보기 형태
  - 다크모드: `.dark .rte-quill-wrapper` 배경·아이콘·텍스트 색상 오버라이드

#### `new/page.tsx`
- **변경 전**: `ImageUploadButton` 버튼 + `<textarea>` (마크다운 텍스트 삽입 방식)
- **변경 후**: `<RichTextEditor value onChange placeholder minHeight />` (WYSIWYG 방식)
- `stripHtml` 헬퍼 함수 추가 — `manualFilledCount`, `handleSubmit` 양쪽에서 HTML 태그 제거 후 비어있는지 검사

#### `[id]/edit/page.tsx`
- **변경 전**: `ImageUploadButton` 버튼 + `<textarea>`
- **변경 후**: `<RichTextEditor value onChange placeholder minHeight />`
- `handleSubmit` 유효성 검사: `form.content.trim()` → `stripHtml(form.content)`

### 복원 방법

HIST-20260503-007 복원 시:
- `RichTextEditor.tsx`: Tiptap 기반 구현으로 복원 (HIST-20260420-005 이전 미존재, Tiptap 패키지 재설치 필요)
- `globals.css`: `.rte-quill-wrapper` 이하 Quill 스타일 블록 제거
- `new/page.tsx`: `RichTextEditor` → `ImageUploadButton` import 교체; `stripHtml` 제거; ManualQuestionCard content 필드를 textarea+ImageUploadButton으로 복원
- `[id]/edit/page.tsx`: 동일하게 textarea+ImageUploadButton 복원, `stripHtml` 제거
- `react-quill` 언인스톨: `npm uninstall react-quill`

---

## HIST-20260501-002

- **날짜**: 2026-05-01
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 문항 목록 테이블에 "수정일" 컬럼 추가, 등록일·수정일 기준 클릭 정렬 지원 (기본: 최근 수정일 내림차순)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `QuestionSummary`에 `updatedAt?: string` 옵셔널 필드 추가 |
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | `SortField` 타입·`SortIcon` 컴포넌트 추가, `sortField`/`sortDir` 상태, `handleSort()`, filtered useMemo에 정렬 로직 추가, "수정일" 컬럼 추가, 테이블 스켈레톤 cols 5→6 |

### 수정 상세

#### `types/index.ts`
- 변경 전: `QuestionSummary.createdAt: string` 이후 필드 없음
- 변경 후: `updatedAt?: string` 추가 (옵셔널 — 이전 API 응답과 하위 호환 유지)
- 이유: 백엔드가 반환하는 `updatedAt`(modifiedDt)을 타입으로 수용

#### `admin/exams/questions/page.tsx`
- 변경 전: 정렬 기능 없음, "등록일" 컬럼만 존재
- 변경 후:
  - `SortField = 'createdAt' | 'updatedAt'` 타입 정의
  - `SortIcon` 컴포넌트: 활성 여부·방향에 따라 인디고/회색 화살표 SVG
  - `sortField` 상태(기본 `'updatedAt'`), `sortDir` 상태(기본 `'desc'`)
  - `handleSort(field)`: 같은 필드 클릭 시 방향 토글, 다른 필드 클릭 시 해당 필드로 전환 + 내림차순 초기화
  - `filtered` useMemo: 필터 후 `[...base].sort(...)` 로 정렬 (updatedAt은 없을 때 createdAt으로 fallback)
  - 테이블 헤더: "등록일" / "수정일" 버튼화, `SortIcon` 포함
  - 테이블 행: `updatedAt` 있으면 한국 날짜 포맷, 없으면 `-`
  - `TableSkeleton cols={5}` → `cols={6}` (컬럼 수 증가)
- 이유: 최근 수정된 문항을 우선 확인할 수 있도록 기본 정렬 제공

### 복원 방법

이 ID(HIST-20260501-002)만으로 복원 시:
- `types/index.ts`: `updatedAt?: string` 제거
- `page.tsx`: `SortField` 타입, `SortIcon` 컴포넌트, `sortField`/`sortDir` 상태, `handleSort` 제거; "수정일" `<th>`/`<td>` 제거; `filtered` useMemo에서 sort 로직 제거; `TableSkeleton cols={6}` → `cols={5}` 복원

---

## HIST-20260430-015

- **날짜**: 2026-04-30
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 문항 등록/수정 화면에 시험 유형 + 문항 유형 드롭다운 추가, 카테고리 필수 해제, 편집 화면 로딩 스켈레톤 적용

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `QuestionSummary`에 `examTypeId`, `examTypeName` 옵셔널 필드 추가 |
| `frontend/src/services/examService.ts` | 수정 | `adminCreateQuestionsBulk` categoryId 선택 필드로 변경, examTypeId 추가; `adminUpdateQuestion` categoryId/examTypeId 추가 |
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | `QuestionDraft`에 `examTypeId` 추가, `ManualQuestionCard` props를 `examTypeSlaves`/`questionTypeSlaves`로 분리, 가져오기 탭에 시험 유형 셀렉터 추가, 필수 categoryId 체크 제거 |
| `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx` | 수정 | `FormState`에 `categoryId`/`examTypeId` 추가, 도메인 로드 useEffect 추가, 시험 유형/문항 유형 드롭다운 추가, 로딩 스켈레톤으로 교체 |

### 수정 상세

#### `types/index.ts`
- 변경 전: `QuestionSummary`에 `categoryName?: string` 이후 `createdAt`
- 변경 후: `examTypeId?: number`, `examTypeName?: string` 두 필드 추가
- 이유: 백엔드 응답의 examTypeId/examTypeName을 타입으로 수용

#### `services/examService.ts`
- 변경 전: `adminCreateQuestionsBulk`의 `categoryId: number` (필수), `adminUpdateQuestion` categoryId 없음
- 변경 후: `categoryId?: number`, `examTypeId?: number` 선택 필드로 변경
- 이유: 두 드롭다운 모두 선택 사항이므로 타입을 옵셔널로 완화

#### `questions/new/page.tsx`
- 변경 전: `QuestionDraft`에 `categoryId`만, `ManualQuestionCard`의 `allSlaves` 단일 prop, 카테고리 필수 체크 존재
- 변경 후: `examTypeId: number | null` 추가, `examTypeSlaves`/`questionTypeSlaves` 두 prop으로 분리, 가져오기 탭에 시험 유형/문항 유형 셀렉터 2개, `categoryId !== null` 필수 체크 제거
- 이유: 시험 유형과 문항 유형을 별도 드롭다운으로 선택하도록 UX 개선

#### `questions/[id]/edit/page.tsx`
- 변경 전: `FormState`에 categoryId/examTypeId 없음, 로딩 시 스피너
- 변경 후: `categoryId: number | null`, `examTypeId: number | null` 추가, 도메인 useEffect로 슬레이브 목록 로드, 시험 유형/문항 유형 드롭다운 추가, `TableSkeleton rows={5} cols={2}` 로딩 스켈레톤 적용
- 이유: 수정 화면에서도 시험/문항 유형 편집 지원 및 스켈레톤 UI 컨벤션 준수

### 복원 방법

이 ID(HIST-20260430-015)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.

---

## HIST-20260430-001

- **날짜**: 2026-04-30
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 검색 조건(유형, 등록일)이 변경 즉시 반영되던 것을 검색 버튼 클릭 시에만 적용되도록 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | 입력 상태와 적용 상태 분리, 검색 버튼 클릭 시 일괄 반영 |

### 수정 상세

#### `admin/exams/questions/page.tsx`
- **변경 전**: `typeFilter`, `dateFrom`, `dateTo` onChange 시 `setPage(0)` 호출 → 즉시 필터링 반영. `useMemo`가 입력 상태 직접 구독
- **변경 후**: `appliedKeyword`, `appliedTypeFilter`, `appliedDateFrom`, `appliedDateTo` 별도 상태 추가. `useMemo`는 applied 상태만 구독. `handleSearch()`에서 모든 applied 상태 일괄 갱신. 초기화 버튼도 applied 상태 함께 리셋
- **이유**: 검색 버튼을 누를 때까지 조건이 반영되지 않아야 한다는 UX 요구 사항

### 복원 방법

이 ID(HIST-20260430-001)로 복원 시:
- `appliedKeyword/appliedTypeFilter/appliedDateFrom/appliedDateTo` 상태 4개 제거
- `useMemo` deps를 `[allQuestions, keyword, typeFilter, dateFrom, dateTo]`로 복원
- `typeFilter` onChange에 `setPage(0)` 추가, `dateFrom`/`dateTo` onChange에 `setPage(0)` 추가
- `handleSearch = () => setPage(0)`으로 복원
- 초기화 버튼 조건 및 onClick에서 applied 상태 제거

---

## HIST-20260422-002

- **날짜**: 2026-04-22
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 문항 목록 내용 미리보기에서 HTML 태그가 그대로 표시되던 현상 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | 목록 테이블 content 셀의 `{q.content}` → `{q.content.replace(/<[^>]+>/g, '')}` |

### 수정 상세

#### `frontend/src/app/admin/exams/questions/page.tsx`
- 변경 전: `<p className="truncate">{q.content}</p>` — `<img>` 등 태그 문자 그대로 표시
- 변경 후: `<p className="truncate">{q.content.replace(/<[^>]+>/g, '')}</p>` — HTML 태그 제거 후 순수 텍스트 표시
- 이유: 이미지 업로드 버튼으로 삽입된 `<img>` 태그가 미리보기 셀에 원문으로 노출되던 버그 수정

### 복원 방법

HIST-20260422-002 복원 시:
- `{q.content.replace(/<[^>]+>/g, '')}` → `{q.content}` 으로 되돌림

---

## HIST-20260420-005

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 문항 등록/수정 화면에 이미지 업로드 버튼 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `src/components/ui/ImageUploadButton.tsx` | 추가 | 이미지 업로드 버튼 컴포넌트 — 업로드 후 `![이미지](url)` 마크다운 삽입 |
| `src/services/examService.ts` | 수정 | `adminUploadQuestionImage()` 추가 |
| `src/app/admin/exams/questions/[id]/edit/page.tsx` | 수정 | 문항 내용 라벨 옆에 ImageUploadButton 추가 |
| `src/app/admin/exams/questions/new/page.tsx` | 수정 | ManualQuestionCard 문항 내용 필드에 ImageUploadButton 추가 |

### 수정 상세

#### `ImageUploadButton.tsx`
- 변경 전: 없음
- 변경 후: 파일 선택 → `POST /api/admin/questions/images` → 반환 URL로 `![이미지](url)` 생성 → `onInsert` 콜백 호출
- 이유: 문항 내용에 이미지를 마크다운 참조 형태로 삽입하기 위한 재사용 컴포넌트

### 복원 방법

HIST-20260420-005 복원 시:
- `ImageUploadButton.tsx` 삭제
- `examService.ts`에서 `adminUploadQuestionImage` 제거
- 각 페이지에서 ImageUploadButton import 및 사용 코드 제거

---

## HIST-20260419-019

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 프론트엔드 / 문항 등록
- **수정 개요**: 문항 등록 화면에 카테고리(문제 유형) 필수 선택 콤보박스 추가, 입력 필드 maxLength 제한 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/app/admin/exams/questions/new/page.tsx | 수정 | 카테고리 select 추가, domainService 로드, importCategory 상태, maxLength 속성 추가 |
| src/app/admin/exams/papers/new/page.tsx | 수정 | title input에 maxLength={200} 추가 |
| src/services/examService.ts | 수정 | adminCreateQuestionsBulk 파라미터에 categoryId: number 추가 |
| src/types/index.ts | 수정 | QuestionSummary에 categoryId?, categoryName? 추가 |

### 수정 상세

#### `src/app/admin/exams/questions/new/page.tsx`
- 변경 전: QuestionDraft에 categoryId 없음, 카테고리 선택 UI 없음
- 변경 후: `categoryId: number | null` 필드 추가, ManualQuestionCard에 allSlaves prop 전달하여 카테고리 select 렌더링, Import 탭에 importCategory amber 선택기 추가, handleSubmit에서 미선택 시 오류 표시
- 이유: 문항의 문제 유형 분류를 필수값으로 지정

### 복원 방법

이 ID(HIST-20260419-019)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.

---

## HIST-20260419-010

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 순번 컬럼 1줄 고정, 검색 조건(내용·유형·등록일), 페이지 크기 콤보박스(10·20·50), 페이지네이션 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | 검색 조건 영역, 페이지 크기 선택, 클라이언트 사이드 필터·페이지네이션 전면 개편 |

### 수정 상세

#### `app/admin/exams/questions/page.tsx`
- 변경 전: 고정 50건 표시, 검색·필터 없음, 순번 컬럼 줄바꿈 가능
- 변경 후:
  - `allQuestions` 최대 500건 1회 로딩 후 클라이언트 필터링
  - 검색 조건: 문항 내용 키워드(Enter 지원), 유형 select, 등록일 from/to date picker
  - 조건 초기화 버튼 (조건 있을 때만 표시)
  - 페이지 크기 콤보박스: 10 / 20 / 50개
  - 페이지네이션: 이전/다음 + 번호 버튼 (현재 ±2, 양 끝, … 생략)
  - 순번: `whitespace-nowrap` + `w-12` + `No.` 헤더로 1줄 고정
  - 순번 값: 전체 기준 연속 번호 (`page * pageSize + idx + 1`)

### 복원 방법

이 ID(HIST-20260419-010)만으로 복원 시:
- `page.tsx`를 HIST-20260419-009 이전 상태(단순 목록)로 되돌림

---

## HIST-20260419-009

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 프론트엔드 / 문항 관리
- **수정 개요**: 문항 목록에 수정 버튼 추가, 문항 수정 페이지(`[id]/edit`) 신규 구현

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `QuestionSummary`에 `explanation?: string` 필드 추가 |
| `frontend/src/services/examService.ts` | 수정 | `adminGetQuestion(id)`, `adminUpdateQuestion(id, data)` 메서드 추가 |
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | 테이블에 "관리" 컬럼 추가, 행마다 "수정" 버튼 → `/admin/exams/questions/{id}/edit` 이동 |
| `frontend/src/app/admin/exams/questions/[id]/edit/page.tsx` | 추가 | 문항 수정 페이지 — 기존 데이터 로드 후 수정 폼, PUT 저장 |

### 수정 상세

#### `types/index.ts`
- 변경 전: `QuestionSummary`에 `explanation` 없음
- 변경 후: `explanation?: string` 추가 (백엔드 `QuestionBankResponse`와 일치)

#### `services/examService.ts`
- 변경 전: 단건 조회·수정 메서드 없음
- 변경 후:
  - `adminGetQuestion(id)` → `GET /admin/questions/{id}`
  - `adminUpdateQuestion(id, data)` → `PUT /admin/questions/{id}`

#### `app/admin/exams/questions/page.tsx`
- 변경 전: 문항 행 클릭/수정 기능 없음
- 변경 후: 테이블 우측 "관리" 컬럼에 "수정" 버튼 추가, 클릭 시 수정 페이지로 이동

#### `app/admin/exams/questions/[id]/edit/page.tsx`
- 변경 전: 파일 없음
- 변경 후: 문항 수정 페이지
  - 마운트 시 `adminGetQuestion(id)`로 기존 데이터 로드
  - 유형(MULTIPLE_CHOICE/SHORT_ANSWER/OX/CODE) 전환 가능
  - CODE 유형: 언어 선택 + CodeEditor + 정답/예상출력
  - MULTIPLE_CHOICE: 보기 편집 + 정답 번호 선택
  - OX/SHORT_ANSWER: 각 유형에 맞는 정답 입력
  - 해설 필드 공통 제공
  - 저장 시 `adminUpdateQuestion` 호출 → 목록 페이지로 이동

### 복원 방법

이 ID(HIST-20260419-009)만으로 복원 시:
- `types/index.ts`: `explanation` 필드 제거
- `examService.ts`: `adminGetQuestion`, `adminUpdateQuestion` 제거
- `page.tsx`: "관리" 컬럼 및 수정 버튼 제거, `useRouter` import 제거
- `[id]/edit/page.tsx`: 파일 삭제
