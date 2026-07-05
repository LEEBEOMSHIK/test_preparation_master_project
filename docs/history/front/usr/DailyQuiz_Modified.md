## HIST-20260706-001

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 플레이 — 풀이 스크래치패드 코드 트레이싱 탭 구조화 위젯 개편
- **수정 개요**: 코드 트레이싱 탭을 monospace 자유 메모 단일 필드에서 "자유 메모 + 구조화 트레이스 블록(변수 워치 표·1D 배열 그리드·2D 배열 그리드·반복 스텝 표)" 조합으로 확장. 실행/eval 전혀 없음, 값은 전부 사용자가 직접 입력하는 프론트 전용 편집 위젯이며 localStorage에만 저장(BE/DB 변경 없음). 상세는 시험 응시 화면(`UserExamination_Modified.md` HIST-20260706-001) 참조 — 신규 파일은 두 화면 공용.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/TraceBlocks.tsx` | 추가(신규, 공용) | `TraceBlock` 판별 유니온 타입 정의 + `<TraceBlockEditor />` — 상세는 `UserExamination_Modified.md` HIST-20260706-001 참조 |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정(순수 확장, 공용) | `ScratchPadData.traceBlocks` 필드 추가, 코드 트레이싱 탭에 `TraceBlockEditor` 렌더 추가 — 상세는 동일 참조 |
| `CLAUDE.md` | 수정 | Shared Utilities 표에 `TraceBlockEditor`/`sanitizeTraceBlocks`/`TraceBlock` 행 추가(중복 기록 아님, 시험 응시 히스토리와 동일 항목) |

### 수정 상세

#### `frontend/src/components/ui/TraceBlocks.tsx` / `frontend/src/components/ui/ScratchPadPanel.tsx`
- 상세는 `docs/history/front/usr/UserExamination_Modified.md`의 HIST-20260706-001 참조(두 화면 공용 신규/수정 파일, `frontend/src/app/user/quiz/[categoryId]/page.tsx` 자체는 변경 없음 — `ScratchPadPanel`을 그대로 재사용)

### 복원 방법
이 ID(HIST-20260706-001)는 별도 복원 작업이 없다(퀴즈 화면 자체 코드는 변경되지 않음). 신규/수정 파일(`TraceBlocks.tsx`, `ScratchPadPanel.tsx`, `CLAUDE.md`)의 복원은 `UserExamination_Modified.md`의 HIST-20260706-001 복원 방법을 따르되, 양쪽 화면이 공용으로 사용 중이므로 시험 응시 화면도 함께 되돌리지 않는 한 파일을 삭제하지 말 것.

## HIST-20260705-001

- **날짜**: 2026-07-05
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 플레이 — 풀이 스크래치패드 1차 릴리스
- **수정 개요**: 퀴즈 풀이 화면 우하단에 FAB로 여는 풀이 스크래치패드(자유 메모 · CODE 트레이싱 · 안전 계산기)를 추가. localStorage에만 저장하며 BE/DB 변경·임의 코드 실행 없음. 시험 응시 화면(`UserExamination_Modified.md` HIST-20260705-001)과 신규 파일 공용.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/safeMathCalc.ts` | 추가(신규, 공용) | `evaluateExpression(expr)` — 화이트리스트 정규식 + 자체 재귀하강 파서로 사칙연산 평가. eval/Function 미사용, 항상 `{value}` 또는 `{error}` 반환(throw 없음) |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 추가(신규, 공용) | FAB(연필 아이콘) → 데스크톱은 우측 비모달 드로어, 모바일은 기존 답안 Bottom Sheet 컨벤션 재사용. 자유 메모/코드 트레이싱(CODE 유형 한정)/계산기 3탭, storageKey 단위 500ms 디바운스 localStorage 저장 |
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정(순수 추가) | `ScratchPadPanel` import 및 quiz phase 렌더 최상단에 `storageKey={tpmp_scratchpad:quiz:${categoryId}:${q.id}}` `isCodeQuestion={isCode}`로 1회 마운트. 기존 채점·세션 로직 변경 없음 |
| `CLAUDE.md` | 수정 | Shared Utilities 표에 `ScratchPadPanel`, `evaluateExpression` 행 추가(중복 기록 아님, 시험 응시 히스토리와 동일 항목) |

### 수정 상세

#### `frontend/src/lib/safeMathCalc.ts` / `frontend/src/components/ui/ScratchPadPanel.tsx`
- 상세는 `docs/history/front/usr/UserExamination_Modified.md`의 HIST-20260705-001 참조(두 화면 공용 신규 파일)

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전: `ScratchPadPanel` 미사용
- 변경 후: import 추가 + `if (!q) return null;` 이후 quiz phase 반환 JSX 최상단에 `<ScratchPadPanel storageKey={\`tpmp_scratchpad:quiz:${categoryId}:${q.id}\`} isCodeQuestion={isCode} />` 1회 마운트
- 이유: 카테고리+문항ID 조합으로 문항별 독립된 스크래치패드 데이터를 유지

### 복원 방법
이 ID(HIST-20260705-001)만으로 복원 시: `frontend/src/app/user/quiz/[categoryId]/page.tsx`에서 `ScratchPadPanel` import 문과 `<ScratchPadPanel .../>` 마운트 라인을 제거한다. 신규 파일(`safeMathCalc.ts`, `ScratchPadPanel.tsx`) 자체 삭제 및 `CLAUDE.md` 표 항목 제거는 `UserExamination_Modified.md`의 HIST-20260705-001 복원 방법을 따른다(양쪽에서 동시에 사용 중이므로 시험 화면도 함께 되돌리지 않는 한 파일을 삭제하지 말 것).

## HIST-20260622-001

- **날짜**: 2026-06-22
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 플레이
- **수정 개요**: 퀴즈 세션 결과 화면을 ExamResultDisplay 공용 컴포넌트로 교체 — 채점 이력 누적 및 문항별 정오/해설 아코디언 표시

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | SessionResultItem 타입·상태 추가, 세 채점 경로에 push, handleSelectOX useCallback 추출, result phase를 ExamResultDisplay로 교체, handleRetake 추가 |
| `frontend/src/components/ui/ExamResultDisplay.tsx` | 수정 | Props에 `completionLabel?: string` 추가, 집계 카드 헤딩을 `completionLabel ?? '시험 완료'`로 변경 |

### 수정 상세

#### `frontend/src/components/ui/ExamResultDisplay.tsx`
- 변경 전: Props에 `completionLabel` 없음; 집계 카드 `<h2>시험 완료</h2>` 하드코딩
- 변경 후: `completionLabel?: string` prop 추가; `<h2>{completionLabel ?? '시험 완료'}</h2>`로 변경 (기본값 유지 → 기존 시험·이력 화면 무영향)
- 이유: 퀴즈 결과 화면에서 "퀴즈 완료"로 표시하기 위해 하위호환 prop 도입

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전: `phase === 'result'` 시 점수·정답수만 보여주는 자체 카드 UI, 아코디언 없음
- 변경 후:
  1. 파일 상단에 `SessionResultItem` 인터페이스 및 `mapSessionResultsToExamResultData` 순수 함수 추가
  2. `sessionResults: SessionResultItem[]` 상태 추가
  3. `handleSubmitAnswer` / `handleSelectOption` / `handleSelectOX`(신규 useCallback) 채점 성공 분기에 `setSessionResults` push 추가
  4. OX 인라인 async onClick → `handleSelectOX` useCallback으로 추출, JSX는 `onClick={() => handleSelectOX(val as 'O' | 'X')}`
  5. `handleRetake` 추가: sessionAnswered·sessionCorrect·sessionResults 초기화 후 loadBatch()
  6. `result` phase 전체를 `<ExamResultDisplay result={...} completionLabel="퀴즈 완료" onRetake={handleRetake} .../>` 로 대체
- 이유: 세션 결과 화면에서 문항별 정오·정답·해설 아코디언을 제공하여 복습 UX 개선

### 복원 방법
이 ID(HIST-20260622-001)만으로 복원 시:
- `ExamResultDisplay.tsx`: `completionLabel?: string` prop 제거, `{completionLabel ?? '시험 완료'}` → `시험 완료`로 되돌리기
- `page.tsx`: `SessionResultItem` 인터페이스·`mapSessionResultsToExamResultData` 함수 제거, `sessionResults` 상태 제거, 세 채점 경로의 `setSessionResults(...)` 라인 제거, `handleSelectOX` useCallback 제거(OX JSX 인라인 async onClick 복원), `handleRetake` 제거, result phase 블록을 기존 자체 카드 UI로 되돌리기, ExamResultDisplay·ExamResultData·QuestionResult·QuestionType import 제거

---

## HIST-20260613-003

- **날짜**: 2026-06-13
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 플레이
- **수정 개요**: 연도·회차 배지를 문항 본문 위 → 문항 카드 우측 상단으로 이동

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | 문제 카드 `relative` + 배지 `absolute top-4 right-4`, 본문 `pr-24`로 겹침 방지 |

### 수정 상세

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전: 배지가 `inline-block`으로 본문(RichContent) 위에 블록 배치
- 변경 후: 문제 카드 div에 `relative` 추가, 배지를 `absolute top-4 right-4`로 우측 상단 배치. 본문 첫 줄이 배지에 가려지지 않도록 RichContent에 `pr-24` 추가
- 이유: 연도·회차 배지를 문항 우측 상단에 배치 요청

### 복원 방법
이 ID(HIST-20260613-003)로 복원 시: 카드 div의 `relative` 제거, 배지를 `inline-block`으로 되돌리고 본문 위로 이동, RichContent의 `pr-24` 제거.

---

## HIST-20260613-002

- **날짜**: 2026-06-13
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 플레이
- **수정 개요**: 퀴즈 문항 카드에 examYear/examRound 기반 연도·회차 배지 표시 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/quizService.ts` | 수정 | `QuizQuestion` 인터페이스에 `examYear?: number`, `examRound?: number` 필드 추가 |
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | 문항 카드 내 `RichContent` 위에 연도/회차 배지 조건부 렌더링 추가 |

### 수정 상세

#### `frontend/src/services/quizService.ts`
- 변경 전: `QuizQuestion`에 `id, content, questionType, options?, code?, language?` 만 존재
- 변경 후: `examYear?: number`, `examRound?: number` 필드 추가
- 이유: BE `QuizQuestionView` record에 추가된 두 필드를 FE 타입에 반영

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전: 문제 카드 `<div>` 내 첫 자식이 바로 `<RichContent html={q.content} ... />`
- 변경 후: `RichContent` 위에 조건부 배지 블록 추가
  ```tsx
  {(q.examYear != null || q.examRound != null) && (
    <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
      {q.examYear != null && q.examRound != null
        ? `${q.examYear}년 ${q.examRound}회`
        : q.examYear != null
        ? `${q.examYear}년`
        : `${q.examRound}회`}
    </span>
  )}
  ```
- 이유: 출처 연도/회차가 있는 문항에서 사용자가 시험 회차를 인지할 수 있도록

### 복원 방법
이 ID(HIST-20260613-002)로 복원 시: `quizService.ts`의 `QuizQuestion`에서 `examYear?`, `examRound?` 라인 제거; `page.tsx` 문제 카드에서 배지 블록(`{(q.examYear != null || ...}`) 제거.

---

## HIST-20260613-001

- **날짜**: 2026-06-13
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 플레이
- **수정 개요**: 답안 제출 버튼/안내 문구의 "제출" 텍스트를 "정답확인"으로 변경

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | 버튼 라벨 '제출' → '정답확인', placeholder '제출 버튼' → '정답확인 버튼' |

### 수정 상세

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전: 버튼 `{checking ? '확인 중...' : '제출'}`, placeholder "...또는 제출 버튼을 누르세요"
- 변경 후: 버튼 `{checking ? '확인 중...' : '정답확인'}`, placeholder "...또는 정답확인 버튼을 누르세요"
- 이유: 퀴즈는 제출 즉시 정오를 확인하는 흐름이라 "정답확인"이 동작에 더 부합.

### 복원 방법
이 ID(HIST-20260613-001)로 복원 시 '정답확인'을 '제출'로 되돌린다.

---

## HIST-20260612-001

- **날짜**: 2026-06-12
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 플레이
- **수정 개요**: 퀴즈 플레이 화면 로딩 분기의 텍스트 스피너를 스켈레톤 UI로 교체 (CLAUDE.md 규칙 준수)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/app/user/quiz/[categoryId]/page.tsx | 수정 | phase === 'loading' 분기의 텍스트("문제를 불러오는 중...") → QuizCardSkeleton으로 교체 |
| frontend/src/components/ui/Skeleton.tsx | 추가 | QuizCardSkeleton 컴포넌트 신규 추가 (헤더 + 진행바 + 문제 카드 + 선택지 4개 모사) |
| CLAUDE.md | 수정 | Skeleton UI 표에 QuizCardSkeleton 항목 추가 |

### 수정 상세

#### `app/user/quiz/[categoryId]/page.tsx`
- 변경 전:
  ```tsx
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 text-sm">문제를 불러오는 중...</p>
      </div>
    );
  }
  ```
- 변경 후:
  ```tsx
  if (phase === 'loading') {
    return <QuizCardSkeleton />;
  }
  ```
- 이유: CLAUDE.md 스켈레톤 규칙 — 텍스트/스피너 단독 사용 금지

#### `components/ui/Skeleton.tsx`
- 변경 전: QuizCardSkeleton 없음
- 변경 후: `QuizCardSkeleton` 추가. `max-w-2xl mx-auto` 컨테이너로 퀴즈 실제 레이아웃과 동일한 너비 사용. 헤더(카테고리명 + 진행상태 + 종료버튼) → 진행바(h-1.5 rounded-full) → 문제카드(본문 3줄 + 선택지 4개 h-11 rounded-xl) 순서로 구성.
- 이유: 기존 스켈레톤 중 단일 문제 카드 형태에 맞는 것이 없어 신규 추가

### 복원 방법
이 ID(HIST-20260612-001)만으로 복원 시: page.tsx의 `phase === 'loading'` 분기를 변경 전 텍스트 블록으로 되돌리고, Skeleton.tsx에서 `QuizCardSkeleton` 함수 블록(주석 포함) 제거, CLAUDE.md 표에서 QuizCardSkeleton 행 삭제.
