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
