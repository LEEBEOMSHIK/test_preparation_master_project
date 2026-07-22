## HIST-20260722-002

- **날짜**: 2026-07-22
- **수정 범위**: 관리자 프론트엔드 / 시험 수정·시험지 수정 화면 — 사용여부 토글 컨트롤 누락 보완
- **수정 개요**: 목록 화면(`/admin/exams`, `/admin/exams/papers`) 배지로만 가능했던 사용여부 토글을 각 수정(edit) 화면에도 추가했다. 두 화면 모두 목록 배지와 동일한 초록/회색 pill 버튼으로 즉시 반영(별도 저장 버튼 불필요) 방식을 사용해 UX를 통일했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/app/admin/exams/[id]/edit/page.tsx | 수정 | "AI 커스텀 문항 시험" 체크박스 아래에 "사용 여부" 토글 배지 추가, 로드시 `exam.useYn` 반영 |
| frontend/src/app/admin/exams/papers/[id]/edit/page.tsx | 수정 | "기본 정보" 섹션의 문항 출제 방식 아래에 "사용 여부" 토글 배지 추가, 로드시 `exam.useYn` 반영 |

### 수정 상세

#### `frontend/src/app/admin/exams/[id]/edit/page.tsx`
- 변경 전: `useYn` state 없음, 폼에 사용여부 컨트롤 없음. 필드: 제목/유형/시험지/시간/연도/회차/AI커스텀만 존재
- 변경 후: `useYn`(초기값 `exam.useYn ?? 'Y'`)·`togglingUseYn` state 추가. "AI 커스텀 문항 시험" 체크박스 다음에 "사용 여부" 라벨 + pill 버튼("사용 중"/"미사용") 추가. 클릭 시 `handleToggleUseYn`이 `examinationService.adminToggleExamination(id)`를 즉시 호출해 반영(폼의 "수정 완료" 버튼이 호출하는 `adminUpdateExamination`은 `useYn` 필드를 받지 않으므로 별도 즉시반영 방식 채택 — 목록 화면 배지와 동일한 UX)
- 이유: 목록 화면 배지로만 토글 가능하고 수정 화면에서는 상태를 볼 수도 바꿀 수도 없어 혼란을 유발하던 버그 수정

#### `frontend/src/app/admin/exams/papers/[id]/edit/page.tsx`
- 변경 전: `useYn` state 없음, "기본 정보" 섹션에 시험지 제목·문항 출제 방식·저장 버튼만 존재
- 변경 후: `useYn`(초기값 `exam.useYn ?? 'Y'`)·`togglingUseYn` state 추가. 문항 출제 방식 블록과 "기본 정보 저장" 버튼 사이에 "사용 여부" pill 버튼 추가. 클릭 시 `handleToggleUseYn`이 `examService.adminToggleExam(id)`를 즉시 호출(기존 "기본 정보 저장"이 호출하는 `adminUpdateExam`은 `title`/`questionMode`만 받으므로 위 파일과 동일 기준으로 즉시반영 방식 채택). 하단 "현재 문항" 목록의 문항별 사용여부 배지는 변경하지 않음
- 이유: 시험지 자체의 사용여부를 수정 화면에서도 확인·변경할 수 있도록 보완

### 복원 방법
이 ID(HIST-20260722-002)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다(즉, 두 파일에서 `useYn`/`togglingUseYn` state와 "사용 여부" UI 블록, `handleToggleUseYn` 함수를 제거).

---

## HIST-20260722-001

- **날짜**: 2026-07-22
- **수정 범위**: 관리자 프론트엔드 / 시험지·시험 관리 — 사용여부 토글 UI 추가
- **수정 개요**: 시험지 관리 목록, 응시 시험 관리 목록, 시험지 수정 화면의 "현재 문항" 목록에 `Quote` 관리 화면과 동일한 초록/회색 pill 토글 배지를 추가했다. 컬럼이 1개씩 늘어난 두 목록 화면은 `useColumnResize` localStorage 키를 v2→v3로 올렸다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/types/index.ts | 수정 | ExamSummary/Examination/ExamQuestion에 `useYn: 'Y' \| 'N'` 필드 추가 |
| frontend/src/services/examService.ts | 수정 | adminToggleExam(id)/adminToggleQuestion(examId, questionId) 추가 |
| frontend/src/services/examinationService.ts | 수정 | adminToggleExamination(id) 추가 |
| frontend/src/app/admin/exams/papers/page.tsx | 수정 | 사용여부 토글 컬럼 추가, col-widths 키 v2→v3, TableSkeleton cols 6→7 |
| frontend/src/app/admin/exams/page.tsx | 수정 | 사용여부 토글 컬럼 추가, col-widths 키 v2→v3, TableSkeleton cols 7→8 |
| frontend/src/app/admin/exams/papers/[id]/edit/page.tsx | 수정 | "현재 문항" 목록 각 행에 사용여부 토글 배지 추가(상세·제거 버튼 사이) |
| frontend/src/data/tableComments.ts | 수정 | exams/questions/examinations 컬럼 코멘트에 del_yn/use_yn 설명 추가 |

### 수정 상세

#### `frontend/src/app/admin/exams/papers/page.tsx`
- 변경 전: `useColumnResize('tpmp:admin-exam-papers:col-widths:v2', [48, 280, 96, 72, 100, 200])`, 컬럼 6개(No/제목/방식/문항수/등록일/관리)
- 변경 후: 키 `v3`, 폭 `[48, 280, 96, 72, 90, 100, 200]`, "사용여부" 컬럼을 문항 수와 등록일 사이에 추가. `handleToggle(id)`가 `examService.adminToggleExam(id)` 호출 후 로컬 state를 갱신
- 이유: 시험지 비활성화 토글 UI 제공. 컬럼 추가로 기존 저장된 폭 배열과 개수가 안 맞아 버전 키를 올림(파일 내 기존 v1→v2 관례 확인 후 동일 패턴 적용)

#### `frontend/src/app/admin/exams/page.tsx`
- 변경 전: `useColumnResize('tpmp:admin-exams:col-widths:v2', [48, 240, 140, 200, 88, 100, 200])`, 컬럼 7개
- 변경 후: 키 `v3`, 폭 `[48, 240, 140, 200, 88, 90, 100, 200]`, "사용여부" 컬럼을 제한 시간과 등록일 사이에 추가. `handleToggle(id)`가 `examinationService.adminToggleExamination(id)` 호출
- 이유: 시험(Examination) 비활성화 토글 UI 제공

#### `frontend/src/app/admin/exams/papers/[id]/edit/page.tsx`
- 변경 전: "현재 문항" 각 행에 상세·제거 버튼만 존재
- 변경 후: 상세 버튼과 제거 버튼 사이에 사용여부 pill 버튼 추가, `handleToggleQuestion(questionId)`가 `examService.adminToggleQuestion(id, questionId)` 호출 후 로컬 state 갱신
- 이유: 문항 개별 비활성화 토글 UI 제공

### 복원 방법
이 ID(HIST-20260722-001)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.

---

## HIST-20260721-001

- **날짜**: 2026-07-21
- **수정 범위**: 관리자 프론트엔드 / 시험 관리 (시험 등록·수정) — 연도·회차·AI 커스텀 입력 필드 추가
- **수정 개요**: 시험 등록(`new`)·수정(`edit`) 화면에 연도(숫자 input)·회차(1~4회 select)·"AI 커스텀 문항 시험" 체크박스를 추가하고, 제출 payload에 3필드를 포함시켰다. 수정 화면은 기존 값(백필된 값 포함)을 프리필한다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/app/admin/exams/new/page.tsx | 수정 | examYear/examRound/isAiCustom state·폼 필드·제출 payload 추가 |
| frontend/src/app/admin/exams/[id]/edit/page.tsx | 수정 | 동일 3필드 state·폼 필드·제출 payload 추가 + 기존 값 프리필 |
| frontend/src/services/examinationService.ts | 수정 | adminCreateExamination/adminUpdateExamination payload 타입에 examYear/examRound/isAiCustom 추가 |
| frontend/src/types/index.ts | 수정 | Examination 인터페이스에 examYear?/examRound?/isAiCustom 추가 |
| frontend/src/data/tableComments.ts | 수정 | examinations 테이블 코멘트에 3개 컬럼 설명 추가 |

### 수정 상세

#### `frontend/src/app/admin/exams/new/page.tsx`
- 변경 전: title/examPaperId/categoryId/timeLimit만 입력받아 제출
- 변경 후: examYear(number|null, 숫자 input)/examRound(number|null, 1~4 select)/isAiCustom(boolean, 체크박스) state 추가, 시험 시간 select 아래에 연도·회차·AI 커스텀 폼 필드 추가, handleSubmit의 adminCreateExamination 호출에 3필드 포함
- 이유: 신규 시험 등록 시 구조화된 년도·회차·AI 커스텀 값 입력

#### `frontend/src/app/admin/exams/[id]/edit/page.tsx`
- 변경 전: 동일하게 4필드만 처리, 프리필도 4필드만
- 변경 후: 동일 3개 state·폼 필드 추가, useEffect에서 `exam.examYear ?? null`/`exam.examRound ?? null`/`exam.isAiCustom ?? false`로 프리필, handleSubmit의 adminUpdateExamination 호출에 3필드 포함
- 이유: 기존(백필된) 값을 수정 화면에서 확인·변경 가능하도록

#### `frontend/src/services/examinationService.ts`
- 변경 전: adminCreateExamination/adminUpdateExamination data 타입이 title/examPaperId/categoryId/timeLimit만 포함
- 변경 후: examYear?: number | null, examRound?: number | null, isAiCustom?: boolean 3개 옵셔널 필드 추가
- 이유: 백엔드 ExaminationCreateRequest 확장에 맞춰 프론트 요청 타입 동기화

### 복원 방법
이 ID(HIST-20260721-001)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.

## HIST-20260708-001

- **날짜**: 2026-07-08
- **수정 범위**: 관리자 프론트엔드 / 시험 관리 (시험 목록) — 테이블 클리핑 버그 수정
- **수정 개요**: 목록 표가 `table-fixed` + `useColumnResize` px 고정 `<colgroup>`을 쓰는데, 컬럼 폭 합이 카드 컨테이너 폭을 넘으면 카드 div의 `overflow-hidden` 때문에 가로 스크롤 없이 오른쪽 컬럼(관리 버튼 등)이 잘리는 버그가 있었다(localStorage에 폭이 영속되어 드래그로 넓힌 사용자는 항상 재현). `<table>`만 `overflow-x-auto` div로 감싸 가로 스크롤이 생기도록 수정했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/page.tsx` | 수정 | 목록 `<table>`을 `<div className="overflow-x-auto">`로 감쌈 |

### 수정 상세

#### `frontend/src/app/admin/exams/page.tsx`
- 변경 전: `<table className="w-full table-fixed text-sm">`가 카드 div(`overflow-hidden`) 바로 아래에 있어 오른쪽 컬럼이 잘림
- 변경 후: `<table>...</table>` 전체를 `<div className="overflow-x-auto">`로 감쌈
- 이유: fixed table layout + 컬럼 리사이즈 영속 폭 + `overflow-hidden` 카드 조합에서 오른쪽 컬럼이 클리핑되는 공통 버그 수정

### 복원 방법
이 ID(HIST-20260708-001)만으로 복원 시 `<table>` 앞뒤에 추가한 `<div className="overflow-x-auto">`/`</div>` 래퍼를 제거한다.

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
