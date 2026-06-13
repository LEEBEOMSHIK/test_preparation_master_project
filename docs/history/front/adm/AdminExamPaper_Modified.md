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
