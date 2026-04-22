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
