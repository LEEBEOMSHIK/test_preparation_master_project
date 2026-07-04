## HIST-20260704-002

- **날짜**: 2026-07-04
- **수정 범위**: 관리자 프론트엔드 / 시험 관리
- **수정 개요**: 관리 컬럼(수정/삭제 아이콘 버튼) 잘림 수정 — 기본폭 140→200px, localStorage 키 `:v2` 갱신. (이 표는 클라이언트 슬라이싱 페이지네이션이 없어 Pagination 컴포넌트 교체 대상 아님)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/page.tsx` | 수정 | `useColumnResize` storageKey `tpmp:admin-exams:col-widths` → `:v2`, 관리 컬럼 기본폭 140→200 |

### 수정 상세

#### `frontend/src/app/admin/exams/page.tsx`
- 변경 전: `useColumnResize('tpmp:admin-exams:col-widths', [48, 240, 140, 200, 88, 100, 140])`
- 변경 후: `useColumnResize('tpmp:admin-exams:col-widths:v2', [48, 240, 140, 200, 88, 100, 200])`
- 이유: 아이콘+텍스트로 구성된 "수정"/"삭제" 버튼 2개(각 ~70px) + 여백을 140px 컬럼이 담지 못해 잘렸다.

### 복원 방법
이 ID(HIST-20260704-002)만으로 복원 시: `useColumnResize` 호출을 `('tpmp:admin-exams:col-widths', [48, 240, 140, 200, 88, 100, 140])`로 되돌린다.

## HIST-20260703-001

- **날짜**: 2026-07-03
- **수정 범위**: 관리자 프론트엔드 / 시험 관리 — 목록 표 컬럼 리사이즈
- **수정 개요**: 시험 목록 표(exams/page.tsx)에 컬럼 드래그 리사이즈 적용. `useColumnResize`('tpmp:admin-exams:col-widths', [48,240,140,200,88,100,140]) + `table-fixed` + `<colgroup>` + 각 th(관리 제외 0~5)에 `<ColResizeHandle />`. 기존 인라인 w-* 삭제, 시험제목·사용시험지 td overflow-hidden.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/page.tsx` | 수정 | 컬럼 리사이즈(useColumnResize+ColResizeHandle+table-fixed+colgroup) 적용, 7컬럼 |

### 되돌림 방법

useColumnResize/ColResizeHandle import·호출 제거, table-fixed·colgroup·핸들 제거, 기존 th 고정폭 w-* 복원.

---

## HIST-20260430-003

- **날짜**: 2026-04-30
- **수정 범위**: 관리자 프론트엔드 / 시험 관리, 시험지 관리
- **수정 개요**: 시험 목록·시험지 목록에 검색 조건 패널 추가 (버튼 클릭 시 적용)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/page.tsx` | 수정 | 시험 제목·유형 검색 조건 추가, 전체 로드 후 클라이언트 필터링 |
| `frontend/src/app/admin/exams/papers/page.tsx` | 수정 | 시험지 제목·출제방식 검색 조건 추가, 클라이언트 필터링 |

### 수정 상세

#### `admin/exams/page.tsx`
- **변경 전**: 검색 없이 전체 목록 표시 (`exams` 상태)
- **변경 후**: `allExams` + `keyword`/`categoryFilter` 입력 상태, `appliedKeyword`/`appliedCategoryFilter` 적용 상태, `useMemo` 필터링, 검색 UI 패널 추가

#### `admin/exams/papers/page.tsx`
- **변경 전**: 검색 없이 전체 목록 표시 (`papers` 상태)
- **변경 후**: `allPapers` + 동일한 입력/적용 상태 패턴, 검색 UI 패널 추가

### 복원 방법

이 ID(HIST-20260430-003)로 복원 시: 검색 상태 변수 제거, `useMemo` 제거, `exams`/`papers` 상태명 복원, 검색 UI 패널 `<div>` 제거

---

## HIST-20260419-017

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 프론트엔드 / 시험 관리
- **수정 개요**: 시험 관리 화면을 Examination 기반으로 전면 재작성 — 시험지 선택 콤보, 시험 유형·시간 필드, 수정 페이지 신규 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/services/examinationService.ts | 추가 | Examination CRUD API 클라이언트 |
| src/services/domainService.ts | 추가 | getDomains() — GET /admin/domains |
| src/types/index.ts | 수정 | DomainSlave, DomainMaster, Examination 인터페이스 추가; QuestionSummary에 categoryId/categoryName 추가 |
| src/app/admin/exams/page.tsx | 수정 | examinationService 기반 목록 테이블 재작성 (시험 유형 배지, 사용 시험지, 제한 시간 컬럼) |
| src/app/admin/exams/new/page.tsx | 수정 | 시험 등록 폼 재작성 — 시험지 선택 콤보, 시험 유형 콤보(도메인), 시험 시간 콤보, questionMode 필드 제거 |
| src/app/admin/exams/[id]/edit/page.tsx | 추가 | 시험 수정 페이지 — 기존 데이터 프리필, 동일 폼 구조 |

### 수정 상세

#### `src/app/admin/exams/page.tsx`
- 변경 전: 시험지(Exam) 목록 표시, 문항 수/출제 방식 컬럼
- 변경 후: 시험(Examination) 목록 표시 — 시험 유형(indigo 배지), 사용 시험지 제목, 제한 시간(분), 등록일
- 이유: 시험지와 시험을 분리하여 시험 관리 화면이 시험 이벤트를 관리하도록 변경

#### `src/app/admin/exams/new/page.tsx`
- 변경 전: 없음 (기존 내용은 시험지 등록 화면이었음)
- 변경 후: title input + 시험 유형 select(도메인 슬레이브) + 사용 시험지 select(ExamSummary) + 시험 시간 select(30~180분) → examinationService.adminCreateExamination 호출
- 이유: 시험 등록 시 카테고리와 제한시간을 필수값으로 지정

#### `src/app/admin/exams/[id]/edit/page.tsx` (신규)
- 변경 전: 없음
- 변경 후: useParams로 id 추출, Promise.all로 시험지 목록+도메인+기존 시험 데이터 병렬 로드, 프리필 후 adminUpdateExamination 호출
- 이유: 시험 수정 기능 제공

### 복원 방법

이 ID(HIST-20260419-017)만으로 복원 시:
- services/examinationService.ts, services/domainService.ts 삭제
- types/index.ts에서 DomainSlave, DomainMaster, Examination 인터페이스 제거; QuestionSummary에서 categoryId/categoryName 제거
- app/admin/exams/page.tsx를 이전 시험지 목록 버전으로 복원
- app/admin/exams/new/page.tsx를 이전 버전으로 복원
- app/admin/exams/[id]/edit/page.tsx 삭제
