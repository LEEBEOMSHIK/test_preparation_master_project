## HIST-20260717-002

- **날짜**: 2026-07-17
- **수정 범위**: 관리자 프론트엔드 / 시험지 SCHEDULING·SQL 문항 편집
- **수정 개요**: 시험지 등록·수정에서 구조화 문항을 제외하지 않고 schedulingData/sqlData를 원본 스냅샷 payload에 포함한다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `frontend/src/app/admin/exams/papers/new/page.tsx` | 수정 | 구조화 문항 선택·payload 지원 |
| `frontend/src/app/admin/exams/papers/[id]/edit/page.tsx` | 수정 | 구조화 문항 추가·수정 payload 지원 |
| `frontend/src/types/index.ts` | 수정 | 시험 문항 구조화 데이터 타입 확장 |
| `frontend/src/lib/sql.test.ts` | 추가 | SQL 기대 결과 payload·직렬화 회귀 테스트 |

### 수정 상세

- 기존 SCHEDULING·SQL 필터를 제거하고 두 JSON 구조를 백엔드로 전달한다.
- 이유: 문제은행의 모든 문항 유형을 시험지에서도 동일하게 사용할 수 있게 하기 위함.

---

## HIST-20260717-001

- **날짜**: 2026-07-17
- **수정 범위**: 관리자 프론트엔드 / 시험지 등록·수정 — 문항 원본 스냅샷 연결·명시적 동기화
- **수정 개요**: 시험지 신규/추가 요청에 QuestionBank 원본 ID를 전달하고, 수정 화면에 Skeleton 기반 동기화 미리보기·위험 표시·선택 적용·정답 이중 확인 패널을 추가했다. 기존 문항 제외 비교를 Question 행 ID가 아닌 `sourceQuestionBankId` 기준으로 수정했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `frontend/src/app/admin/exams/papers/new/page.tsx` | 수정 | 원본 ID payload, 지원 불가 유형 제외, Skeleton 적용 |
| `frontend/src/app/admin/exams/papers/[id]/edit/page.tsx` | 수정 | 동기화 패널, 원본 ID 기준 중복 제외, 삭제 즉시 로컬 상태 제거와 preview best-effort 갱신, 현재 선택 기준 정답 이중 확인 |
| `frontend/src/services/examService.ts` | 수정 | sync-preview/sync API 클라이언트 추가 |
| `frontend/src/types/index.ts` | 수정 | 원본 링크·동기화 미리보기 타입 추가 |

### 수정 상세

- 변경 전: QuestionBank 값을 FE가 복사 전송했고 시험지 문항 ID와 원본 ID를 혼동해 이미 추가된 문항 비교가 틀렸으며, 원본 변경 차이를 확인·적용할 UI가 없었다.
- 변경 후: FE는 `sourceQuestionBankId`를 함께 보내며, 링크/후보/변경 필드/정답 위험/지원 불가/활성 세션 상태를 보여준 뒤 선택 문항만 적용한다. 삭제 성공 즉시 `examQuestions`·`syncPreview.items`·`syncSelectedIds`에서 로컬 제거하고 후속 preview 재조회는 best-effort로 분리한다. 현재 선택에 정답 변경이 있을 때만 체크박스 2개와 `정답 동기화` 문구 확인을 요구하며 그 외에는 이전 승인 상태를 초기화한다.
- 이유: 출제 스냅샷 안정성을 유지하면서 관리자 승인 하에만 원본 변경을 반영하기 위함.

### 복원 방법

이 ID(`AdminExamPaper_Modified.md` 기준 HIST-20260717-001)로 복원 시 위 동기화 상태·패널·서비스 메서드·원본 ID payload를 제거하고 기존 ID 비교 로직으로 되돌린다.

---

## HIST-20260709-001

- **날짜**: 2026-07-09
- **수정 범위**: 관리자 프론트엔드 / 시험지 등록·수정 — 신규 문항 유형 SQL 배지 지원
- **수정 개요**: 문항 유형에 `SQL`이 신설되면서 문항은행에서 시험지에 문항을 가져올 때 사용하는 `TYPE_LABEL`/`TYPE_COLOR` Record(공용 `QuestionType` 사용)가 SQL 키 누락으로 컴파일 에러가 발생해 두 파일 모두 SQL 키를 추가했다. 백엔드 상세는 [back/adm/QuestionBank_Modified.md HIST-20260709-001], 문항 등록/수정 상세는 [front/adm/AdminQuestion_Modified.md HIST-20260709-001] 참조.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/papers/new/page.tsx` | 수정 | `TYPE_LABEL.SQL = 'SQL'`, `TYPE_COLOR.SQL = 'bg-cyan-50 text-cyan-600'` 추가 |
| `frontend/src/app/admin/exams/papers/[id]/edit/page.tsx` | 수정 | 위와 동일 |

### 수정 상세

- 변경 전: 두 파일의 `TYPE_LABEL`/`TYPE_COLOR` Record에 `MULTIPLE_CHOICE`/`SHORT_ANSWER`/`OX`/`CODE`/`SCHEDULING` 5개 키만 존재.
- 변경 후: 두 파일 모두 `SQL` 키 추가.
- 이유: `types/index.ts`의 `QuestionType` 유니온에 `'SQL'`을 추가하면서 `Record<QuestionType, string>` 타입이 컴파일 에러가 되는 것을 막기 위함(`npx tsc --noEmit`로 확인).

### 복원 방법
이 ID(HIST-20260709-001)만으로 복원 시: 두 파일의 `TYPE_LABEL`/`TYPE_COLOR`에서 `SQL` 키를 제거한다.

## HIST-20260708-001

- **날짜**: 2026-07-08
- **수정 범위**: 관리자 프론트엔드 / 시험지 관리 — 테이블 클리핑 버그 수정
- **수정 개요**: 목록 표가 `table-fixed` + `useColumnResize` px 고정 `<colgroup>`을 쓰는데, 컬럼 폭 합이 카드 컨테이너 폭을 넘으면 카드 div의 `overflow-hidden` 때문에 가로 스크롤 없이 오른쪽 컬럼(관리 버튼 등)이 잘리는 버그가 있었다(localStorage에 폭이 영속되어 드래그로 넓힌 사용자는 항상 재현). `<table>`만 `overflow-x-auto` div로 감싸 가로 스크롤이 생기도록 수정했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/papers/page.tsx` | 수정 | 목록 `<table>`을 `<div className="overflow-x-auto">`로 감쌈 |

### 수정 상세

#### `frontend/src/app/admin/exams/papers/page.tsx`
- 변경 전: `<table className="w-full table-fixed text-sm">`가 카드 div(`overflow-hidden`) 바로 아래에 있어 오른쪽 컬럼이 잘림
- 변경 후: `<table>...</table>` 전체를 `<div className="overflow-x-auto">`로 감쌈
- 이유: fixed table layout + 컬럼 리사이즈 영속 폭 + `overflow-hidden` 카드 조합에서 오른쪽 컬럼이 클리핑되는 공통 버그 수정

### 복원 방법
이 ID(HIST-20260708-001)만으로 복원 시 `<table>` 앞뒤에 추가한 `<div className="overflow-x-auto">`/`</div>` 래퍼를 제거한다.

## HIST-20260707-001

- **날짜**: 2026-07-07
- **수정 범위**: 관리자 프론트엔드 / 시험지 관리 — 목록 최신 등록순 정렬
- **수정 개요**: 관리자 시험지 관리 목록에서 검색/필터 적용 후 `createdAt DESC`로 정렬해 최신 등록 시험지가 먼저 보이도록 했다. 백엔드 기본 정렬 보강과 별개로 프론트 표시 단계에서도 동일 기준을 적용하는 안전장치다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/papers/page.tsx` | 수정 | 필터링된 시험지 목록을 `createdAt` 내림차순으로 정렬 |

### 수정 상세

- 변경 전: 시험지 목록은 API 응답 순서를 그대로 표시했다.
- 변경 후: `filtered` 계산 시 필터링 결과를 복사한 뒤 `createdAt` 최신순으로 정렬한다.
- 이유: 관리자 화면에서 최근 등록한 시험지를 우선 확인할 수 있게 하기 위함.

### 복원 방법

이 ID(HIST-20260707-001)만으로 복원 시: `frontend/src/app/admin/exams/papers/page.tsx`의 `filtered` 계산에서 `base` 배열과 `sort((a, b) => ...)`를 제거하고 기존처럼 `allPapers.filter(...)` 결과를 바로 반환한다.

## HIST-20260704-002

- **날짜**: 2026-07-04
- **수정 범위**: 관리자 프론트엔드 / 시험지 관리
- **수정 개요**: 관리 컬럼(수정/삭제 아이콘 버튼) 잘림 수정 — 기본폭 160→200px, localStorage 키 `:v2` 갱신. (이 표는 클라이언트 슬라이싱 페이지네이션이 없어 Pagination 컴포넌트 교체 대상 아님)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/papers/page.tsx` | 수정 | `useColumnResize` storageKey `tpmp:admin-exam-papers:col-widths` → `:v2`, 관리 컬럼 기본폭 160→200 |

### 수정 상세

#### `frontend/src/app/admin/exams/papers/page.tsx`
- 변경 전: `useColumnResize('tpmp:admin-exam-papers:col-widths', [48, 280, 96, 72, 100, 160])`
- 변경 후: `useColumnResize('tpmp:admin-exam-papers:col-widths:v2', [48, 280, 96, 72, 100, 200])`
- 이유: 아이콘+텍스트로 구성된 "수정"/"삭제" 버튼 2개(각 ~70px) + 여백을 160px 컬럼이 담지 못해 잘렸다.

### 복원 방법
이 ID(HIST-20260704-002)만으로 복원 시: `useColumnResize` 호출을 `('tpmp:admin-exam-papers:col-widths', [48, 280, 96, 72, 100, 160])`로 되돌린다.

## HIST-20260703-001

- **날짜**: 2026-07-03
- **수정 범위**: 관리자 프론트엔드 / 시험지 관리
- **수정 개요**: 시험지 목록 표에 컬럼 드래그 리사이즈 적용 (배치3)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/papers/page.tsx` | 수정 | `useColumnResize`·`ColResizeHandle` import, `table-fixed`+`colgroup`, th에 `relative`+핸들(0~4), 시험지제목 td `max-w-0` → `overflow-hidden` |

### 수정 상세

#### `admin/exams/papers/page.tsx`
- 변경 전: `<table className="w-full text-sm">`, th에 인라인 `w-12`/`w-24`/`w-20`/`w-28`/`w-44`, 시험지제목 td `max-w-0`
- 변경 후:
  - `useColumnResize('tpmp:admin-exam-papers:col-widths', [48,280,96,72,100,160])` 호출
  - `<table className="w-full table-fixed text-sm">`
  - `<colgroup>{widths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>`
  - th 0~4에 `relative` + `<ColResizeHandle>` 추가, 마지막 '관리' th 제외
  - 시험지제목 td: `max-w-0` → `overflow-hidden` (내부 `<p className="truncate">` 유지)
  - 기존 th 인라인 `w-*` 삭제
- 이유: 컬럼 너비를 마우스 드래그로 조정하고 localStorage에 영구 저장

### 복원 방법
HIST-20260703-001 복원 시: import 2개 제거, `widths`/`startResize` 제거, `table-fixed` 제거, `<colgroup>` 제거, th에서 `relative`·핸들 제거 및 인라인 `w-*` 복원, 시험지제목 td `overflow-hidden` → `max-w-0`.

---

## HIST-20260626-001

- **날짜**: 2026-06-26
- **수정 범위**: 관리자 프론트엔드 / 시험지 관리 — 문항 목록 카테고리 배지 추가
- **수정 개요**: 시험지 수정(edit) 화면의 현재 문항 목록 + 은행 문항 피커, 시험지 등록(new) 화면의 문항 선택 목록 3곳에 카테고리 배지 추가. 값 있으면 회색 pill, 없으면 `—`.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/papers/[id]/edit/page.tsx` | 수정 | 현재 문항 목록(examQuestions) + 은행 문항 피커(filteredBank) 각 행에 categoryName 배지 추가 |
| `frontend/src/app/admin/exams/papers/new/page.tsx` | 수정 | 문항 선택 목록(filteredQuestions) 각 행에 categoryName 배지 추가 |

### 수정 상세

#### `papers/[id]/edit/page.tsx` — 현재 문항 목록
- 변경 전: `questionType` 배지만 표시
- 변경 후: `questionType` 배지 왼쪽에 `q.categoryName ? <pill>categoryName</pill> : <span>—</span>` 추가
- 스타일: `shrink-0 mt-0.5 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600` (문항관리 화면과 동일)

#### `papers/[id]/edit/page.tsx` — 은행 문항 피커
- 변경 전: `questionType` 배지만 표시 (`QuestionSummary` 타입, `categoryName` 필드 보유)
- 변경 후: 동일 패턴으로 categoryName 배지 추가

#### `papers/new/page.tsx` — 문항 선택 목록
- 변경 전: `questionType` 배지만 표시
- 변경 후: 동일 패턴으로 categoryName 배지 추가

### 복원 방법
이 ID(HIST-20260626-001)로 복원 시 3곳의 `{q.categoryName ? ... : <span className="...">—</span>}` 블록을 제거한다.

---

## HIST-20260619-001

- **날짜**: 2026-06-19
- **수정 범위**: 관리자 프론트엔드 / 시험지 수정 — PDF 문항 파일 업로드 UI
- **수정 개요**: 시험지 편집 페이지에 "파일로 문항 추가" 카드 신설. PDF를 선택하면 `examService.adminUploadQuestions`로 업로드 → 서버 파서가 문항을 자동 분리 → 문항 목록 새로고침 + 가져온 개수 안내. (BE 파서 HIST-20260619-001과 짝, BE는 `docs/history/back/adm/AdminExamPaper_Modified.md` 참조)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/papers/[id]/edit/page.tsx` | 수정 | `uploadingPdf`/`uploadResult` 상태 + `handlePdfUpload` 핸들러 + "파일로 문항 추가" 카드(드래시드 라벨 + hidden file input) 추가 |

### 수정 상세
- 서비스 레이어(`examService.adminUploadQuestions`)는 기존에 이미 완성되어 있었고, 이를 호출하는 UI만 추가.
- `handlePdfUpload`: 파일 MIME/확장자(`application/pdf`/`.pdf`) 검증 → 업로드 → 성공 시 `adminGetExamQuestions`로 목록 재조회·갱신 → "N개 문항을 가져왔습니다" 안내. 실패 시 기존 `error` 영역에 메시지. `e.target.value=''`로 같은 파일 재선택 허용.
- 로딩 중에는 라벨에 스피너 + "업로드·파싱 중..." 표시(텍스트 단독 금지 규칙 준수, 인라인 spinner는 액션 진행 표시 용도).
- 안내 문구로 분리 규칙(문항 번호/보기 마커)과 폴백(분리 실패 시 1문항 저장)을 명시해 관리자 기대치 조정.
- [보정] 비PDF 파일 선택 시 가드 분기(`file.type !== 'application/pdf'`)에서 `setError` 호출 직후 `setUploadResult('')`를 추가 — 직전 업로드 성공 메시지가 에러와 함께 잔존하는 UX 결함 수정.

### 검증 포인트
- PDF 선택 → imported 개수만큼 문항 목록에 추가·갱신되는지.
- 비PDF 파일 선택 시 "PDF 파일만 업로드할 수 있습니다." 안내.
- 업로드 실패(서버 오류) 시 에러 영역 노출 + 로딩 해제.

### 복원 방법
이 ID(HIST-20260619-001)로 복원 시 `[id]/edit/page.tsx`의 `uploadingPdf`/`uploadResult` 상태, `handlePdfUpload` 핸들러, "파일로 문항 추가" 카드 블록을 제거한다.

---

## HIST-20260615-001

- **날짜**: 2026-06-15
- **수정 범위**: 관리자 프론트엔드 / 시험지·문항 문항 선택 목록 미리보기
- **수정 개요**: 문항 선택 목록의 문제 미리보기를 `line-clamp-2` → `truncate`로 통일 (사용자 개념노트 목록과 동일하게 한 줄 + 말줄임 처리).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/papers/new/page.tsx` | 수정 | 문항 선택 목록 미리보기 `line-clamp-2` → `truncate` |
| `frontend/src/app/admin/exams/papers/[id]/edit/page.tsx` | 수정 | 문항 선택/포함 목록 미리보기 2곳 `line-clamp-2` → `truncate` |
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | 추출/문항 목록 미리보기 `line-clamp-2` → `truncate` |

### 수정 상세
- 미리보기는 이미 `stripHtml(q.content)`로 태그가 제거된 상태였고, 줄 수만 `line-clamp-2`(2줄) → `truncate`(1줄 + 말줄임표)로 통일해 행 높이를 일정하게 정돈.
- 관리자 문항 목록 메인(`admin/exams/questions/page.tsx`)은 이미 `truncate`라 변경 없음.
- **검증**: `npx tsc --noEmit` 통과. 크롬(admin) — `/admin/exams/papers/new` 문항 선택 목록이 단일 줄 + 말줄임표로 표시됨 확인.

### 복원 방법
이 ID(HIST-20260615-001)로 복원 시 해당 미리보기 `<p>`의 `truncate`를 `line-clamp-2`로 되돌린다. (questions/new 동일 변경 포함)

---

## HIST-20260613-001

- **날짜**: 2026-06-13
- **수정 범위**: 관리자 프론트엔드 / 시험지 수정
- **수정 개요**: 시험지 편집 페이지의 `as unknown as ExamQuestion[]` 이중 캐스팅 제거 — 서비스 반환 타입 정합으로 근본 해결

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/examService.ts` | 수정 | `adminGetExamQuestions` 반환 타입 `ApiResponse<QuestionSummary[]>` → `ApiResponse<ExamQuestion[]>` (ExamQuestion import 추가) |
| `frontend/src/app/admin/exams/papers/[id]/edit/page.tsx` | 수정 | line 63·139의 `as unknown as ExamQuestion[]` 캐스팅 제거 |

### 수정 상세
- 원인: BE `GET /admin/exams/{id}/questions`는 `QuestionDetailResponse`(id·seq·content·questionType·options·answer·explanation·code·language)를 반환하는데, FE 서비스가 `QuestionSummary[]`(seq 없음)로 잘못 선언되어 `ExamQuestion[]`(seq 필수) 할당 시 타입 불일치 → `as unknown as`로 우회하고 있었음.
- 수정: 서비스 반환 타입을 `ExamQuestion[]`(BE QuestionDetailResponse와 필드 일치)로 정정하니 캐스팅 없이 직접 할당 가능. CLAUDE.md TypeScript strict 원칙 준수.
- 검증: tsc 통과(0건).

### 복원 방법
이 ID(HIST-20260613-001)로 복원 시 서비스 반환 타입을 `QuestionSummary[]`로 되돌리고 page.tsx 두 곳에 `as unknown as ExamQuestion[]`을 다시 추가한다.

---

## HIST-20260506-001

- **날짜**: 2026-05-06
- **수정 범위**: 관리자 프론트엔드 / 시험지 수정
- **수정 개요**: `adminGetExamQuestions` 응답 데이터를 `ExamQuestion[]`으로 캐스팅 시 발생하는 TypeScript 타입 오류 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/papers/[id]/edit/page.tsx` | 수정 | `as ExamQuestion[]` → `as unknown as ExamQuestion[]` (2곳) |

### 수정 상세

#### `admin/exams/papers/[id]/edit/page.tsx`
- **원인**: `questionsRes.data.data`의 추론 타입이 `QuestionSummary[] | undefined`이고, `ExamQuestion`에는 `seq` 필드가 있어 두 타입 간 겹치는 구조가 충분하지 않다고 TypeScript가 판단하여 직접 캐스팅 불가
- 변경 전: `(questionsRes.data.data as ExamQuestion[]) ?? []` (2곳)
- 변경 후: `(questionsRes.data.data as unknown as ExamQuestion[]) ?? []` (2곳) — `unknown` 경유 이중 캐스팅으로 의도적 변환임을 명시

### 복원 방법

HIST-20260506-001 복원 시: `as unknown as ExamQuestion[]` → `as ExamQuestion[]` 으로 되돌림 (단, TS 타입 오류 재발).

---

## HIST-20260505-001

- **날짜**: 2026-05-05
- **수정 범위**: 관리자 프론트엔드 / 시험지 관리
- **수정 개요**: 시험지 등록/수정 화면의 문항 선택 목록에 '상세' 버튼 추가 — 클릭 시 `QuestionDetailModal`로 전체 내용 확인 가능

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/QuestionDetailModal.tsx` | 추가 | 문항 상세 모달 공통 컴포넌트 신규 생성 |
| `frontend/src/app/admin/exams/papers/new/page.tsx` | 수정 | 문항 선택 목록에 '상세' 버튼 추가 |
| `frontend/src/app/admin/exams/papers/[id]/edit/page.tsx` | 수정 | 현재 문항 목록 + 문항 추가 피커 양쪽에 '상세' 버튼 추가 |

### 수정 상세

#### `src/components/ui/QuestionDetailModal.tsx` (신규)
- 변경 후: `<QuestionDetailModal question={item|null} onClose={fn} />` — 문항 내용(RichContent)·코드·선택지·정답·해설 표시, ESC 키 닫기, 배경 클릭 닫기 지원
- 이유: 여러 관리자 페이지에서 동일한 상세 보기 필요 → 공통 컴포넌트화

#### `papers/new/page.tsx` · `papers/[id]/edit/page.tsx`
- 변경 전: 문항 목록에 선택(체크박스)만 존재
- 변경 후: 각 문항 행 우측에 '상세' 버튼 추가 (`e.stopPropagation()`으로 체크박스 동작과 분리)

### 복원 방법

이 ID(HIST-20260505-001)만으로 복원 시 각 파일에서 `QuestionDetailModal` import·`detailQ` state·`<QuestionDetailModal>` 렌더링·'상세' 버튼을 제거한다.

---

## HIST-20260504-010

- **날짜**: 2026-05-04
- **수정 범위**: 관리자 프론트엔드 / 문제 관리 · 시험지 관리 (공통 유틸 도입)
- **수정 개요**: 인라인 `.replace(/<[^>]+>/g, '')` → `stripHtml()` 공통 유틸로 교체

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | `q.content.replace(...)` → `stripHtml(q.content)` |
| `frontend/src/app/admin/exams/papers/new/page.tsx` | 수정 | 동일 |
| `frontend/src/app/admin/exams/questions/new/page.tsx` | 수정 | 동일 |
| `frontend/src/app/admin/exams/papers/[id]/edit/page.tsx` | 수정 | 동일 (2곳) |

### 수정 상세

#### 각 파일 공통
- 변경 전: `{q.content.replace(/<[^>]+>/g, '')}`
- 변경 후: `import { stripHtml } from '@/lib/html'` + `{stripHtml(q.content)}`
- 이유: 동일한 HTML 제거 로직을 한 곳에서 관리

### 복원 방법

이 ID(HIST-20260504-010)만으로 복원 시 `stripHtml` import를 제거하고 `.replace(/<[^>]+>/g, '')` 인라인으로 되돌린다.

---

## HIST-20260504-007

- **날짜**: 2026-05-04
- **수정 범위**: 관리자 프론트엔드 / 시험지 관리
- **수정 개요**: 문제 피커 목록에서 에디터 HTML이 태그 그대로 노출되던 문제 수정 → `.replace(/<[^>]+>/g, '')` 적용

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/papers/new/page.tsx` | 수정 | 문제 선택 목록 `q.content` → HTML 태그 제거 후 표시 |
| `frontend/src/app/admin/exams/papers/[id]/edit/page.tsx` | 수정 | 시험지 수정 문제 목록 2곳 동일 패턴 적용 |

### 수정 상세

#### `frontend/src/app/admin/exams/papers/new/page.tsx` (line 264)
- 변경 전: `{q.content}`
- 변경 후: `{q.content.replace(/<[^>]+>/g, '')}`
- 이유: line-clamp-2 미리보기 영역에 HTML 태그가 노출됨

#### `frontend/src/app/admin/exams/papers/[id]/edit/page.tsx` (line 243, 336)
- 변경 전: `{q.content}`
- 변경 후: `{q.content.replace(/<[^>]+>/g, '')}`
- 이유: 동일 — 피커/목록 미리보기는 순수 텍스트로만 표시

### 복원 방법

이 ID(HIST-20260504-007)만으로 복원 시 위 "변경 전" 내용을 각 파일에 적용한다.

---

## HIST-20260430-011

- **날짜**: 2026-04-30
- **수정 범위**: 관리자 프론트엔드 / 시험지 관리
- **수정 개요**: 시험지 제목·출제방식 키워드 검색 조건 추가 (버튼 클릭 시 적용)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/papers/page.tsx` | 수정 | `allPapers` + `keyword`/`modeFilter` 입력 상태, `appliedKeyword`/`appliedModeFilter` 적용 상태, `useMemo` 필터링, 검색 UI 추가 |

### 복원 방법

이 ID(HIST-20260430-011)로 복원 시: 검색 상태 변수 제거, `useMemo` 제거, `papers` 상태명 복원, 검색 UI 패널 제거

---

## HIST-20260420-004

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 프론트엔드 / 시험지 관리
- **수정 개요**: 시험지 수정 화면에 현재 문항 목록 표시 + 문항 삭제 + 문항 풀에서 문항 추가 기능 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `src/app/admin/exams/papers/[id]/edit/page.tsx` | 수정 | 시험지 수정 화면 전면 재작성 — 기본 정보, 현재 문항 목록(삭제), 문항 추가 3섹션 구성 |
| `src/services/examService.ts` | 수정 | `adminGetExamQuestions()`, `adminRemoveQuestion()` 추가 |
| `src/types/index.ts` | 수정 | `ExamQuestion` 인터페이스 추가 |

### 수정 상세

#### `papers/[id]/edit/page.tsx`
- 변경 전: 제목 + questionMode 수정만 가능, 문항 관리 불가
- 변경 후:
  - 섹션 1 — 기본 정보: title, questionMode 저장 (즉시 PUT)
  - 섹션 2 — 현재 문항: seq 번호, 내용 미리보기, 유형 배지, X 버튼으로 즉시 삭제
  - 섹션 3 — 문항 추가: 문항 풀 검색 + 체크박스 선택 + 일괄 추가

### 복원 방법

HIST-20260420-004 복원 시:
- `papers/[id]/edit/page.tsx`를 이전 단순 폼(제목+questionMode)으로 되돌림
- `examService.ts`에서 `adminGetExamQuestions`, `adminRemoveQuestion` 제거
- `types/index.ts`에서 `ExamQuestion` 인터페이스 제거

---

## HIST-20260419-014

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 프론트엔드 / 시험지 관리
- **수정 개요**: 시험지 등록 시 단일 원자적 API 호출로 변경 (시험지+문항 동시 생성)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/services/examService.ts | 수정 | adminCreateExamWithQuestions 메서드 추가 |
| frontend/src/app/admin/exams/papers/new/page.tsx | 수정 | handleSubmit에서 2-step→1-step API 변경 |

### 수정 상세

#### `examService.ts`
- 변경 전: `adminCreateExam` + `adminAddQuestionsBulk` 별도 호출
- 변경 후: `adminCreateExamWithQuestions(title, questionMode, questions)` 단일 호출
- 이유: 시험지 생성 후 문항 추가 실패 시 시험지가 남는 문제 해결

#### `papers/new/page.tsx`
- 변경 전: createExam → examId 추출 → addQuestionsBulk (2 HTTP 요청)
- 변경 후: createExamWithQuestions (1 HTTP 요청) — 실패 시 트랜잭션 전체 롤백

### 복원 방법

HIST-20260419-014 복원 시 `handleSubmit`을 기존 2-step 방식으로 되돌리고 `adminCreateExamWithQuestions` 제거

---

## HIST-20260419-013

- **날짜**: 2026-04-19
- **수정 범위**: 관리자 프론트엔드 / 시험지 관리
- **수정 개요**: 시험지 등록 시 문항 미선택 차단, 시험지 목록에 수정·삭제 버튼 추가, 시험지 수정 페이지 신규 생성, 문항 일괄 추가 body 포맷 버그 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/app/admin/exams/papers/new/page.tsx | 수정 | 문항 0개 선택 시 등록 차단 validation 추가 |
| frontend/src/app/admin/exams/papers/page.tsx | 수정 | 수정·삭제 버튼 추가 (edit→/[id]/edit, delete→confirm+API) |
| frontend/src/app/admin/exams/papers/[id]/edit/page.tsx | 추가 | 시험지 제목·출제방식 수정 페이지 신규 생성 |
| frontend/src/services/examService.ts | 수정 | adminAddQuestionsBulk body { questions } → 직접 배열, adminGetExam 메서드 추가 |

### 수정 상세

#### `frontend/src/app/admin/exams/papers/new/page.tsx`
- 변경 전: selectedIds.size === 0 이어도 제출 가능 (시험지만 생성됨)
- 변경 후: `if (selectedIds.size === 0) { setError('문항을 하나 이상 선택해야 시험지를 등록할 수 있습니다.'); return; }`
- 이유: 문항 없는 시험지 생성 방지

#### `frontend/src/app/admin/exams/papers/page.tsx`
- 변경 전: 시험지 목록 테이블에 관리 버튼 없음
- 변경 후: 수정(연필 아이콘, indigo), 삭제(휴지통 아이콘, red) 버튼 추가; deletingId 상태로 삭제 중 disabled 처리
- 이유: 시험지 수정·삭제 기능 요구

#### `frontend/src/app/admin/exams/papers/[id]/edit/page.tsx` (신규)
- 변경 전: 파일 없음
- 변경 후: adminGetExam(id)로 기존 데이터 로드 후 title·questionMode 수정 가능, adminUpdateExam(id, {...}) 제출
- 이유: 시험지 수정 기능 요구

#### `frontend/src/services/examService.ts`
- 변경 전:
  ```typescript
  adminAddQuestionsBulk: (examId, questions) =>
    apiClient.post(..., { questions })  // { questions: [...] } 형태로 전송 — 버그
  ```
- 변경 후:
  ```typescript
  adminAddQuestionsBulk: (examId, questions) =>
    apiClient.post(..., questions)  // 배열 직접 전송
  adminGetExam: (id) =>
    apiClient.get(`/admin/exams/${id}`)  // 신규
  ```
- 이유: 백엔드 `@RequestBody List<QuestionRequest>` 는 배열 직접 수신; { questions } 래핑 시 400/500 오류

### 복원 방법

이 ID(HIST-20260419-013)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.
- `papers/new/page.tsx`: selectedIds.size === 0 validation 조건 제거
- `papers/page.tsx`: 관리 컬럼 및 handleDelete 제거 (이전 버전으로 교체)
- `papers/[id]/edit/page.tsx`: 파일 삭제
- `examService.ts`: adminAddQuestionsBulk body를 `{ questions }` 로 되돌리고 adminGetExam 제거
