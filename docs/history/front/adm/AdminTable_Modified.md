## HIST-20260421-032

- **날짜**: 2026-04-21
- **수정 범위**: 관리자 프론트엔드 / 테이블 관리 > DB 조회
- **수정 개요**: 행 추가·수정 시 ①auto_increment 필드 disabled 입력창 표시, ②FK 컬럼 콤보박스 선택으로 변경

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/app/admin/tables/data/page.tsx | 수정 | `getFkRel` 헬퍼 추가, `editableCols` 제거, 추가·수정 폼 auto 컬럼 disabled 표시, FK 컬럼 `<select>` 콤보박스 |

### 수정 상세

#### `src/app/admin/tables/data/page.tsx`
- 변경 전:
  - `editableCols = columns.filter(c => !isAutoColumn(c))` — 자동 컬럼 추가 폼에서 아예 숨김
  - 인라인 수정 시 auto 컬럼은 `renderCellValue`(span)으로 표시 — disabled 시각 없음
  - 추가 폼·인라인 수정 모두 FK 컬럼에 일반 `<input>` 사용
- 변경 후:
  - `editableCols` 변수 제거, `getFkRel(colName)` 헬퍼 추가
  - **추가 폼**: 모든 컬럼 표시 → auto 컬럼은 `disabled` input (placeholder "자동 생성", 회색 배경), FK 컬럼은 `fkLookup` 기반 `<select>`, 나머지는 일반 input
  - **인라인 수정**: auto/PK 컬럼은 `disabled` input (현재값 표시, 회색 배경), FK 컬럼은 `<select>`, 나머지는 일반 input

### 복원 방법

HIST-20260421-032 복원 시:
- `getFkRel` 헬퍼 제거
- `editableCols = columns.filter(c => !isAutoColumn(c))` 라인 복원
- 추가 폼: `columns.map` → `editableCols.map`, auto/FK 분기 제거 → 단일 `<input>`
- 인라인 수정 셀: `isEditing ? (() => {...})()` 분기를 `isEditing && !isPkColumn(col) ? input : renderCellValue` 단순 구조로 복원

---

## HIST-20260420-017

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 프론트엔드 / 테이블 관리 > DB 조회
- **수정 개요**: DB 조회 화면에 '데이터 상세 조회' 토글 버튼 및 컬럼별 클라이언트 사이드 필터 패널 추가 (기존 기능 변경 없음)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/app/admin/tables/data/page.tsx | 수정 | showFilter/filterValues 상태 추가, 필터 패널 UI, filteredRows 연산 |

### 수정 상세

#### `src/app/admin/tables/data/page.tsx`
- 변경 전: 컬럼 필터 기능 없음
- 변경 후:
  - `showFilter` (boolean), `filterValues` (Record<string, string>) 상태 추가
  - `handleSelectTable` 호출 시 `showFilter`·`filterValues` 초기화
  - `filteredRows`: `rows`를 `filterValues` 기준으로 포함 문자열 필터링한 파생 배열
  - 검색·테이블 선택 툴바에 **데이터 상세 조회** 버튼 추가 (토글)
  - 버튼 클릭 시 참조 테이블 카드 위에 컬럼 필터 패널 표시 — 현재 테이블 컬럼 수만큼 input 동적 생성, 컬럼 코멘트 레이블 표시
  - 활성 필터 존재 시 '필터 초기화' 버튼 표시
  - 테이블 본문에서 `rows` 대신 `filteredRows` 렌더링; 필터 미매칭 시 안내 문구 변경

### 복원 방법

HIST-20260420-017 복원 시:
- `showFilter`, `filterValues` 상태 제거
- `handleSelectTable`에서 두 상태 초기화 라인 제거
- `filteredRows` 파생 변수 제거
- '데이터 상세 조회' 버튼 `<>...</>` 래퍼 제거, 기존 단일 버튼 형태로 복원
- 컬럼 필터 패널 JSX 블록 제거
- 테이블 tbody에서 `filteredRows` → `rows`, 빈 데이터 안내 문구 원복

---

## HIST-20260420-016

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 프론트엔드 / 테이블 관리 > DB 조회
- **수정 개요**: DB 조회 화면에 ①테이블·컬럼 코멘트 표시, ②코멘트 검색, ③참조(부모)테이블 정보 카드, ④페이지 크기 선택(10/20/50), ⑤FK 값 레이블 표시 기능 추가; docs/db-guidelines.md에 §9 코멘트 관리 섹션 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/data/tableComments.ts | 추가 | 테이블·컬럼 한국어 설명 및 FK 관계 정의 상수 파일 |
| src/app/admin/tables/data/page.tsx | 수정 | 검색·코멘트·참조테이블 카드·페이지크기·FK 레이블 5가지 기능 추가 |
| docs/db-guidelines.md | 수정 | §9 테이블·컬럼 코멘트 관리 섹션 추가 |

### 수정 상세

#### `src/data/tableComments.ts` (신규)
- 변경 전: 파일 없음
- 변경 후: `TableComment` / `FkRelation` 인터페이스 + `TABLE_COMMENTS` 배열 (users, exams, questions, question_bank, domain_master, domain_slave, examinations, quotes, concept_notes, inquiries), `getTableMeta()` / `getColumnComment()` 헬퍼

#### `src/app/admin/tables/data/page.tsx`
- 변경 전: 테이블명만 드롭다운, 고정 pageSize=20, 컬럼 헤더에 타입만 표시, FK 값 숫자만 표시
- 변경 후:
  - 검색 input → `filteredTables` (테이블명 + 코멘트 대소문자 무관 필터)
  - 드롭다운 옵션에 `테이블명 (한국어설명)` 표시
  - 테이블 선택 시 `fkRelations` 로드 → 참조 테이블 카드 UI + 클릭 시 해당 테이블로 이동
  - `fkLookup` 비동기 로드: FK 컬럼별로 참조테이블 rows(최대 500) 로드 후 id→displayName 맵 구성
  - 컬럼 헤더에 `tableComments.ts` 코멘트를 10px 인디고 텍스트로 표시
  - 추가 폼 레이블에도 컬럼 코멘트 표시
  - 총 건수 표시 + 행 표시 버튼(10/20/50) → `handlePageSizeChange`
  - FK 셀 렌더링: `1 (label)` 형태로 indigo-100 뱃지로 표시
  - `loadTable(tableName, page, size)` 시그니처로 모든 페이지 변경 함수 통일

#### `docs/db-guidelines.md`
- 변경 전: §8 이후 내용 없음
- 변경 후: §9 테이블·컬럼 코멘트 관리 섹션 추가 (테이블 목록, FK 컬럼 설명, 추가 방법 안내)

### 복원 방법

HIST-20260420-016 복원 시:
- `src/data/tableComments.ts` 삭제
- `src/app/admin/tables/data/page.tsx`를 HIST-20260420-013 상태(search/comments/fkRelations/pageSize 없음)로 되돌림
- `docs/db-guidelines.md`에서 §9 섹션 제거

---

## HIST-20260420-013

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 프론트엔드 / 테이블 관리 > DB 조회
- **수정 개요**: DB 테이블 선택 후 행 조회·추가·수정·삭제 가능한 DB 조회 페이지 추가, 사이드바에 'DB 조회' 서브메뉴 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/services/dbTableService.ts | 추가 | 테이블 목록·컬럼·행 CRUD API 서비스 |
| src/app/admin/tables/data/page.tsx | 추가 | DB 테이블 조회·추가·수정·삭제 페이지 |
| src/components/layout/AdminLayoutShell.tsx | 수정 | 테이블 관리 서브메뉴에 'DB 조회' 항목 추가 |

### 수정 상세

#### `src/services/dbTableService.ts` (신규)
- 변경 전: 파일 없음
- 변경 후: listTables, getColumns, getRows, insertRow, updateRow, deleteRow API 메서드

#### `src/app/admin/tables/data/page.tsx` (신규)
- 변경 전: 파일 없음
- 변경 후: 테이블 선택 드롭다운 → 컬럼·행 조회 → 인라인 수정 → 행 추가 폼 → 삭제 확인

#### `src/components/layout/AdminLayoutShell.tsx`
- 변경 전: 테이블 관리 children: [도메인 관리]
- 변경 후: 테이블 관리 children: [도메인 관리, DB 조회]

### 복원 방법

HIST-20260420-013 복원 시:
- src/services/dbTableService.ts 삭제
- src/app/admin/tables/data/ 디렉토리 삭제
- AdminLayoutShell.tsx의 테이블 관리 children에서 'DB 조회' 항목 제거

---

## HIST-20260420-012

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 프론트엔드 / 테이블 관리
- **수정 개요**: `/admin/tables` 접근 시 404 오류 발생 → 도메인 관리 페이지로 자동 리다이렉트

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/app/admin/tables/page.tsx | 추가 | `/admin/tables/domains`으로 즉시 redirect |

### 수정 상세

#### `src/app/admin/tables/page.tsx`
- 변경 전: 파일 없음 → 404 오류
- 변경 후: useRouter().replace('/admin/tables/domains') 호출로 도메인 관리 페이지로 이동

### 복원 방법

HIST-20260420-012 복원 시:
- src/app/admin/tables/page.tsx 삭제
