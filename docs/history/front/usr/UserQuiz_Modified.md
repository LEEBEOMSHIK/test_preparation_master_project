## HIST-20260713-003

- **날짜**: 2026-07-13
- **수정 범위**: 사용자 프론트엔드 / 퀴즈 풀이 + 시험 결과 표시 — 대체 정답(`||`) 노출 포맷
- **수정 개요**: 백엔드 `AnswerGrader`에 추가된 대체 정답(`||`) 채점 지원(`docs/history/back/usr/UserQuiz_Modified.md` HIST-20260713-004)에 맞춰, 오답 시 "정답:" 표시에서도 `" || "` 구분자를 사람이 읽기 좋은 `"A 또는 B"` 형태로 보여주도록 공용 포맷 함수를 추가했다. `src/lib/answer.ts`에 `formatAnswerAlternatives(answer)`를 신설하고, 퀴즈 풀이 화면(`user/quiz/[categoryId]/page.tsx`)의 오답 시 "정답:" 표시와 `ExamResultDisplay.tsx`의 시험 결과 상세(보기 없는 유형)의 "정답" 표시에 적용했다. 관리자 화면(문항 상세/목록)은 원문 정답 문자열을 그대로 노출해야 하므로 변경하지 않았다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/answer.ts` | 수정 | `formatAnswerAlternatives(answer: string): string` 신규 추가 — `\s*\|\|\s*` 기준 분리 후 각 항목 trim, 항목이 1개면(구분자 없음) 원문 그대로 반환, 2개 이상이면 `' 또는 '`로 join |
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | 오답 시 "정답:" 표시부(`answerState.result?.answer`)를 `formatAnswerAlternatives(answerState.result?.answer ?? '')`로 감쌈. `hasOptions` import 라인에 `formatAnswerAlternatives` 추가 |
| `frontend/src/components/ui/ExamResultDisplay.tsx` | 수정 | 보기 없는 유형(CODE 제외)의 "정답" 표시부(`item.correctAnswer ?? '—'`)를 `item.correctAnswer ? formatAnswerAlternatives(item.correctAnswer) : '—'`로 변경. `hasOptions` import 라인에 `formatAnswerAlternatives` 추가. CODE 유형(CodeBlock 렌더)과 보기(options) 있는 유형(번호별 하이라이트 표시)은 원문 정답 문자열을 직접 노출하지 않으므로 대상 아님 |

### 수정 상세

#### `frontend/src/lib/answer.ts`
- 변경 전: `formatAnswerAlternatives` 없음.
- 변경 후: 함수 신규 추가(위 설명 참고). 순수 함수, 부수효과 없음.
- 이유: 백엔드 대체 정답 채점과 짝을 이루는 사용자 노출용 포맷터가 필요했고, 오답 표시가 여러 화면에 있으므로 공용 유틸로 추출.

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전: `{answerState.result?.answer}` — 백엔드가 반환한 정답 문자열을 `||` 구분자 포함 원문 그대로 표시.
- 변경 후: `{formatAnswerAlternatives(answerState.result?.answer ?? '')}`.
- 이유: 사용자에게 `||`라는 내부 구분자 대신 "A 또는 B" 형태로 자연스럽게 노출하기 위함.

#### `frontend/src/components/ui/ExamResultDisplay.tsx`
- 변경 전: `{item.correctAnswer ?? '—'}`.
- 변경 후: `{item.correctAnswer ? formatAnswerAlternatives(item.correctAnswer) : '—'}`.
- 이유: 위와 동일.

### 검증 결과
- `npx tsc --noEmit`: 통과 (오류 없음, dev 서버 가동 중이라 `npm run build`는 실행하지 않음)

### 복원 방법
이 ID(HIST-20260713-003)만으로 복원 시:
1. `frontend/src/lib/answer.ts`에서 `formatAnswerAlternatives` 함수를 제거한다.
2. `quiz/[categoryId]/page.tsx`의 "정답:" 표시부를 `{answerState.result?.answer}`로, import 라인을 `import { hasOptions } from '@/lib/answer';`로 되돌린다.
3. `ExamResultDisplay.tsx`의 "정답" 표시부를 `{item.correctAnswer ?? '—'}`로, import 라인을 `import { hasOptions } from '@/lib/answer';`로 되돌린다.

## HIST-20260713-002

- **날짜**: 2026-07-13
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 플레이 — 세션 내 라운드 간 문항 중복 출제 방지 + 안내 문구
- **수정 개요**: 데일리 퀴즈는 10문제 단위 라운드로 반복 요청하는데, 매 라운드 독립 랜덤 추출이라 직전 라운드와 문항이 자주 중복되던 문제를 세션 단위로 방지했다. 세션 동안 출제된 문항 ID를 `seenIds`(Set)에 누적하고, 라운드 요청 시 백엔드 신규 지원(`docs/history/back/usr/UserQuiz_Modified.md` HIST-20260713-003)인 `excludeIds`로 누적분을 전송한다. `excludeIds`를 보냈는데 응답이 빈 배열이면(세션 내 해당 조건의 모든 문항 소진) 기존처럼 홈으로 강제 이동시키는 alert 대신 신규 `exhausted` phase로 전환해 세션 누계 요약과 함께 [결과 보기]/[처음부터 다시] 버튼을 보여준다(excludeIds 없이 첫 요청부터 빈 배열이면 기존 alert 동작 그대로 유지). "라운드 N 완료" 화면에는 "계속하기를 누르면 아직 풀지 않은 문제가 이어서 출제됩니다." 안내 문구를 추가했다. 북마크 재풀이 모드(`isBookmarkMode`)는 이 로직 대상에서 제외했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/quizService.ts` | 수정 | `getQuestions`에 `excludeIds?: number[]` 파라미터 추가 — 있으면 콤마 조인해 쿼리스트링 전송 |
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | `seenIds` state 추가(라운드별 출제 ID 누적), `loadBatch`가 `overrideExcludeIds` 옵션 인자를 받아 excludeIds 계산·전송 및 응답 성공 시 `seenIds`에 누적, `excludeIds` 전송 후 빈 응답이면 신규 `exhausted` phase(`Phase` 유니언에 추가)로 전환, `handleRetake`에서 `seenIds` 초기화(+ `loadBatch(new Set())`로 즉시 반영), "라운드 완료" 화면에 안내 문구 추가 |

### 수정 상세

#### `frontend/src/services/quizService.ts`
- 변경 전: `getQuestions: (categoryId, limit = 10, language?, source?) => ... params: { ...categoryId, limit, ...language, ...source }`
- 변경 후: `getQuestions: (categoryId, limit = 10, language?, source?, excludeIds?: number[]) => ... params: { ..., ...(excludeIds && excludeIds.length > 0 ? { excludeIds: excludeIds.join(',') } : {}) }`
- 이유: 세션 내 누적 출제 ID를 백엔드 신규 `excludeIds` 쿼리 파라미터로 전달해야 함.

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전: `Phase = 'loading' | 'quiz' | 'continue' | 'result' | 'empty'`. `loadBatch`는 인자 없이 `categoryId/language/source`만으로 요청하고, 응답이 빈 배열이면(북마크 모드가 아닌 한) 항상 `alert('이 카테고리에 등록된 문항이 없습니다.')` 후 `/user/quiz`로 이동. `handleRetake`는 세션 카운터·`sessionResults`·`roundNum`만 초기화 후 `loadBatch()` 호출. "라운드 N 완료" 화면에는 세션 누계 텍스트만 존재.
- 변경 후: `Phase`에 `'exhausted'` 추가. `seenIds: Set<number>` state 신설. `loadBatch(overrideExcludeIds?: Set<number>)`로 시그니처 확장 — `excludeSet = overrideExcludeIds ?? seenIds`, 북마크 모드가 아니고 `excludeSet.size > 0`이면 `Array.from(excludeSet)`을 `excludeIds`로 전송. 응답 성공 시(북마크 모드 아니면) 반환된 문항 ID를 `setSeenIds`에 누적. 응답이 빈 배열이면: 북마크 모드는 기존 `empty` 그대로, `excludeIdsParam`을 보냈던 경우(=세션 내 모든 문항 소진)는 `exhausted` phase로 전환, 그 외(첫 요청부터 빈 배열)는 기존 alert+이동 유지. `handleRetake`에 `setSeenIds(new Set())` + `loadBatch(new Set())` 추가(setState 비동기라 override 인자로 명시적 빈 Set을 넘겨야 정확한 excludeIds로 요청됨). "라운드 완료" 화면에 `계속하기를 누르면 아직 풀지 않은 문제가 이어서 출제됩니다.` 문구(`text-xs text-gray-400`, `!isBookmarkMode`일 때만) 추가. 신규 `exhausted` phase 렌더 블록 추가(세션 누계 + [결과 보기]/[처음부터 다시] 버튼).
- 이유: 매 라운드 독립 랜덤 추출로 인해 직전 라운드와 문항이 자주 중복되는 사용자 경험 문제를 세션 단위로 해소하고, 모든 문항을 소진했을 때 강제로 홈으로 내보내는 대신 세션 결과를 확인하거나 처음부터 다시 풀 수 있는 선택지를 제공하기 위함.

### 검증 결과
- `npx tsc --noEmit`: 통과 (오류 없음, dev 서버 가동 중이라 `npm run build`는 실행하지 않음)

### 복원 방법
이 ID(HIST-20260713-002)만으로 복원 시:
1. `quizService.ts`의 `getQuestions`에서 `excludeIds` 파라미터와 params 확장 부분을 제거한다.
2. `quiz/[categoryId]/page.tsx`에서 `seenIds` state, `loadBatch`의 `overrideExcludeIds` 인자·excludeIds 계산·`setSeenIds` 누적 로직을 제거하고 `loadBatch()`를 인자 없는 원래 형태로 되돌린다.
3. `Phase` 유니언에서 `'exhausted'`를 제거하고 해당 phase 렌더 블록을 삭제한다.
4. `handleRetake`에서 `setSeenIds(new Set())`와 `loadBatch(new Set())` 대신 `loadBatch()`로 되돌린다.
5. "라운드 완료" 화면에서 추가한 안내 문구 `<p>`를 제거한다.

## HIST-20260713-001

- **날짜**: 2026-07-13
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 홈 + 퀴즈 플레이 — "AI 커스텀" 통합 카드 신규 추가
- **수정 개요**: 데일리 퀴즈 홈(`/user/quiz`)에 "AI 커스텀" 섹션과 카드 1개("AI 커스텀 전체")를 문제 유형 섹션 위에 추가했다. QUESTION_TYPE 슬레이브 중 `hasAiCustomQuestions`가 하나라도 true일 때만 노출되며, 클릭 시 모달 없이 `/user/quiz/all?name=AI+커스텀+전체&source=AI_CUSTOM`으로 바로 이동해 카테고리 구분 없이 전체 AI 커스텀 문항(exam_year·exam_round 모두 null)을 랜덤 연속 출제한다. 퀴즈 플레이 라우트(`[categoryId]/page.tsx`)에 route param `'all'`을 특수값으로 인식하는 `isAllAiCustomMode`를 추가해 이 경우 `categoryId`를 `undefined`로 취급하고 `quizService.getQuestions`를 categoryId 없이 호출한다(source 쿼리스트링은 그대로 유지). `quizService.getQuestions`의 `categoryId` 파라미터를 `number | undefined`로 확장해 미전달 시 쿼리 파라미터 자체를 보내지 않도록 했다(백엔드 신규 지원: `docs/history/back/usr/UserQuiz_Modified.md` HIST-20260713-002 참고).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/quizService.ts` | 수정 | `getQuestions`의 `categoryId` 파라미터를 `number \| undefined`로 확장, undefined면 params에서 제외 |
| `frontend/src/app/user/quiz/page.tsx` | 수정 | "AI 커스텀" 섹션 + "AI 커스텀 전체" 카드 1개 추가(문제 유형 섹션 위), `hasAnyAiCustomQuestions` 노출 판정, 클릭 시 `/user/quiz/all?...` 이동 핸들러 추가 |
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | route param이 `'all'`이면 `isAllAiCustomMode=true`, `categoryId=undefined`로 분기해 `quizService.getQuestions(categoryId, ...)` 호출 시 categoryId 없이 요청 |

### 수정 상세

#### `frontend/src/services/quizService.ts`
- 변경 전: `getQuestions: (categoryId: number, limit = 10, language?: string, source?: string) => ... params: { categoryId, limit, ... }`
- 변경 후: `getQuestions: (categoryId: number | undefined, limit = 10, language?: string, source?: string) => ... params: { ...(categoryId !== undefined ? { categoryId } : {}), limit, ... }`
- 이유: AI 커스텀 통합 카드는 categoryId 없이 전체 문항을 대상으로 하므로, 서비스 레이어가 categoryId 생략을 지원해야 함.

#### `frontend/src/app/user/quiz/page.tsx`
- 변경 전: "문제 유형"/"시험 유형" 마스터 카드 그리드만 렌더.
- 변경 후: `visibleMasters` 렌더 블록 위에 `hasAnyAiCustomQuestions`(QUESTION_TYPE 슬레이브 중 `hasAiCustomQuestions` true가 하나라도 있는지) 조건부로 "AI 커스텀" 섹션 + 카드 1개("AI 커스텀 전체" / "랜덤 연속 출제") 추가. 클릭 시 `handleSelectAiCustomAll`이 `/user/quiz/all?name=AI 커스텀 전체&source=AI_CUSTOM`으로 즉시 이동(언어/출처 선택 모달 없음).
- 이유: 기존 AI 커스텀 문항은 카테고리별로 흩어져 있어 통합 출제 진입점이 없었음. 카테고리 무관 전체 AI 커스텀 문항을 한 번에 풀 수 있는 카드를 신설.

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전: `const categoryId = Number(rawCategoryId);` — route param이 항상 숫자 카테고리 ID 또는 `'bookmarks'`(NaN, 미사용)였음.
- 변경 후: `const isAllAiCustomMode = rawCategoryId === 'all'; const categoryId = isAllAiCustomMode ? undefined : Number(rawCategoryId);` — `'all'`이면 categoryId를 undefined로 취급해 `quizService.getQuestions(categoryId, 10, language, source)` 호출 시 categoryId 파라미터가 아예 전송되지 않음. source는 기존처럼 `searchParams.get('source')`로 그대로 전달.
- 이유: 홈 화면의 "AI 커스텀 전체" 카드에서 이동한 라우트가 카테고리 조건 없이 전체 AI 커스텀 문항을 요청할 수 있어야 함.

### 검증 결과
- `npx tsc --noEmit`: 통과 (오류 없음)

### 복원 방법
이 ID(HIST-20260713-001)만으로 복원 시:
1. `quizService.ts`의 `getQuestions` 시그니처를 `categoryId: number`로 되돌리고 params에서 `categoryId`를 항상 포함하도록 복원.
2. `quiz/page.tsx`에서 "AI 커스텀" 섹션 블록, `handleSelectAiCustomAll`, `hasAnyAiCustomQuestions` 계산 코드를 제거.
3. `quiz/[categoryId]/page.tsx`에서 `isAllAiCustomMode` 분기를 제거하고 `const categoryId = Number(rawCategoryId);`로 되돌린다.

## HIST-20260711-001

- **날짜**: 2026-07-11
- **수정 범위**: 사용자 프론트엔드 / 퀴즈 플레이 — SQL 유형 "결과 테이블(컬럼×튜플) 정답" 입력 UI
- **수정 개요**: 문항에 `sqlResultColumns`(SQL 결과 테이블 정답의 컬럼명만, 백엔드가 정답 유출 방지를 위해 컬럼명만 노출)가 존재하면 기존 `CodeAnswerInput` 대신 신규 `SqlResultAnswerInput`(열=컬럼명 고정, "+ 행 추가"/행 삭제 그리드)을 렌더링하도록 답안 입력 분기를 확장했다. 그리드 입력은 제출 시 `셀 \| 셀` + 줄바꿈으로 직렬화해 기존 `quizService.checkAnswer(questionId, userAnswer)` 문자열 계약을 그대로 사용한다(백엔드 API 변경 없음). 문항 전환 시 그리드를 초기화해야 하므로 `key={q.id}`로 컴포넌트를 리마운트한다. 오답일 때 "정답:" 표시 영역도 `q.sqlResultColumns`가 있으면 `font-mono whitespace-pre-wrap`으로 표시해 여러 행짜리 직렬화 문자열의 가독성을 확보했다(기존 CodeAnswerInput·CodeBlock의 monospace 컨벤션을 재사용).
- `quizService.ts`의 `QuizQuestion`에 `sqlResultColumns?: string[]` 필드를 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/SqlResultAnswerInput.tsx` | 추가 | SQL 결과 테이블 정답 입력 그리드 컴포넌트 신규 작성(컬럼 고정 헤더 + 행 추가/삭제, `셀 \| 셀` + 줄바꿈 직렬화) |
| `frontend/src/services/quizService.ts` | 수정 | `QuizQuestion`에 `sqlResultColumns?: string[]` 필드 추가 |
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | `(isCode \|\| isSql) && !optionsAvailable` 분기 내부에서 `q.sqlResultColumns` 존재 시 `SqlResultAnswerInput`(key={q.id})을, 없으면 기존 `CodeAnswerInput`을 렌더. "정답:" 표시 영역에 SQL 결과 테이블 문항 전용 monospace/pre-wrap 스타일 분기 추가 |

### 수정 상세

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전: `(isCode || isSql) && !optionsAvailable`이면 항상 `CodeAnswerInput` 렌더
- 변경 후: 위 조건이 참이고 `q.sqlResultColumns && q.sqlResultColumns.length > 0`이면 `<SqlResultAnswerInput key={q.id} columns={q.sqlResultColumns} value={inputValue} onChange={setInputValue} disabled={...} />`, 그 외는 기존 `CodeAnswerInput` 그대로
- 이유: SQL "결과 테이블(컬럼×튜플) 정답" 채점을 지원하는 문항은 자유 텍스트/코드 입력보다 컬럼이 고정된 표 입력이 사용성·정확도 모두에서 우월하기 때문.

### 복원 방법
이 ID(HIST-20260711-001)만으로 복원 시:
1. `frontend/src/app/user/quiz/[categoryId]/page.tsx`에서 `SqlResultAnswerInput` import와 조건부 렌더 분기를 제거하고 `(isCode || isSql) && !optionsAvailable`이면 항상 `CodeAnswerInput`을 렌더하도록 되돌린다. "정답:" 표시 영역의 monospace/pre-wrap 분기도 제거한다.
2. `quizService.ts`에서 `QuizQuestion.sqlResultColumns` 필드를 제거한다.
3. `frontend/src/components/ui/SqlResultAnswerInput.tsx` 파일을 삭제한다.

## HIST-20260710-001

- **날짜**: 2026-07-10
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 풀이 — 보기 있는 문항 답안 입력 안내 문구 갱신
- **수정 개요**: 백엔드 `AnswerGrader`가 보기(options) 있는 문항 채점을 "빈칸 순서 비교"(콤마 구분 다중 빈칸 지원, 상세는 `docs/history/back/adm/QuestionBank_Modified.md`의 HIST-20260710-001)로 재작성함에 따라, 답안 입력 input의 placeholder를 `'정답 보기 번호 입력'`에서 `'정답 보기 번호 입력 (빈칸이 여러 개면 순서대로 콤마 구분)'`으로 갱신했다. UI 구조(입력 필드 하나, `CodeAnswerInput` 분기 등)는 변경하지 않았다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | 답안 input의 `placeholder={optionsAvailable ? '...' : '...'}` 중 보기 있음 분기 문구 갱신 |

### 수정 상세

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전: `placeholder={optionsAvailable ? '정답 보기 번호 입력' : '답을 입력하고 Enter 또는 정답확인 버튼을 누르세요'}`
- 변경 후: `placeholder={optionsAvailable ? '정답 보기 번호 입력 (빈칸이 여러 개면 순서대로 콤마 구분)' : '답을 입력하고 Enter 또는 정답확인 버튼을 누르세요'}`
- 이유: 다중 빈칸 채점 지원에 맞춰 입력 방법 안내를 명확히 하기 위함.

### 복원 방법
이 ID(HIST-20260710-001)만으로 복원 시, `frontend/src/app/user/quiz/[categoryId]/page.tsx`의 해당 placeholder를 `'정답 보기 번호 입력'`으로 되돌린다.

## HIST-20260709-001

- **날짜**: 2026-07-09
- **수정 범위**: 사용자 프론트엔드 / 퀴즈 플레이 — 신규 문항 유형 SQL 표시·답안 입력
- **수정 개요**: 퀴즈 문항이 SQL 유형인 경우 SchedulingProblemTable 렌더 아래에 공용 `<SqlProblemView>`를 렌더링해 테이블 구조·샘플 데이터를 표 또는 스키마(DDL) 형태로 표시한다. 답안 입력은 CODE 유형과 동일하게 멀티라인 monospace `CodeAnswerInput`을 재사용하도록 분기를 `(isCode || isSql) && !optionsAvailable`로 확장했다(정답은 SHORT_ANSWER·SCHEDULING과 동일한 콤마 다중값 채점 라우팅, 백엔드 AnswerGrader에서 처리). `ScratchPadPanel`의 `isCodeQuestion`은 `isCode` 그대로 유지(SQL은 코드 트레이싱 대상이 아님).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/quizService.ts` | 수정 | `QuizQuestion`에 `sqlData?: SqlData` 필드 추가 |
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | `{q.schedulingData && <SchedulingProblemTable .../>}` 아래에 `{q.sqlData && <SqlProblemView data={q.sqlData} />}` 추가, `isSql` 판정 추가, 답안 입력 분기를 `(isCode \|\| isSql) && !optionsAvailable`로 확장(placeholder도 SQL 전용 문구로 분기) |

### 수정 상세

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전: `{q.schedulingData && <SchedulingProblemTable data={q.schedulingData} />}` 다음 별도 렌더 없음. 답안 입력은 `isCode && !optionsAvailable`일 때만 `CodeAnswerInput`, 그 외는 일반 `<input>`.
- 변경 후: `SchedulingProblemTable` 아래에 `{q.sqlData && <SqlProblemView data={q.sqlData} />}` 추가. `const isSql = q.questionType === 'SQL';` 추가, 답안 입력 조건을 `(isCode || isSql) && !optionsAvailable`로 확장하고 SQL일 때 placeholder를 `'SQL 답안을 입력하세요'`로 분기.
- 이유: SQL 답안은 여러 줄(SELECT/WHERE/GROUP BY 등)이 될 수 있어 CODE와 동일한 멀티라인 monospace 입력이 필요하기 때문. 채점은 여전히 텍스트 비교(SQL 실행 없음)이므로 표시·입력 UI만 CODE와 공유한다.

### 복원 방법
이 ID(HIST-20260709-001)만으로 복원 시:
- `quizService.ts`: `QuizQuestion.sqlData` 필드 제거
- `quiz/[categoryId]/page.tsx`: `<SqlProblemView>` 렌더 블록·import·`isSql` 변수 제거, 답안 입력 분기를 `isCode && !optionsAvailable`로 되돌리고 placeholder를 `'코드 답안을 입력하세요'` 고정으로 복원

## HIST-20260706-001

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 프론트엔드 / 퀴즈 플레이 — CPU 스케줄링 구조화 문항(SCHEDULING 유형) 표시
- **수정 개요**: 퀴즈 문항이 SCHEDULING 유형인 경우 CodeBlock 아래에 공용 `<SchedulingProblemTable>`을 렌더링해 알고리즘·프로세스 목록(도착/실행/우선순위)을 표로 표시한다. 답안 입력은 기존 "주관식(단답형)" 텍스트 input 분기를 그대로 재사용(SHORT_ANSWER와 동일한 콤마 다중값 채점 라우팅은 백엔드 AnswerGrader에서 처리).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/quizService.ts` | 수정 | `QuizQuestion`에 `schedulingData?: SchedulingData` 필드 추가 |
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | `{q.code && <CodeBlock .../>}` 아래에 `{q.schedulingData && <SchedulingProblemTable data={q.schedulingData} />}` 추가 |

### 수정 상세

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전: 문제 카드에서 `q.code`가 있으면 `<CodeBlock>`만 렌더
- 변경 후: `<CodeBlock>` 아래에 `q.schedulingData`가 있으면 `<SchedulingProblemTable data={q.schedulingData} />` 추가 렌더. 답안 입력 영역은 `!isMultipleChoice && !isOX` 기존 분기를 그대로 통과(SCHEDULING도 일반 텍스트 input로 처리)하므로 별도 분기 추가 없음.

### 복원 방법
이 ID(HIST-20260706-001)만으로 복원 시:
- `quizService.ts`: `QuizQuestion.schedulingData` 필드 제거
- `quiz/[categoryId]/page.tsx`: `<SchedulingProblemTable>` 렌더 블록 및 import 제거

## HIST-20260630-001

- **날짜**: 2026-06-30
- **수정 범위**: 사용자 프론트엔드 / 퀴즈 플레이 — CODE 문항 CodeBlock 높이 제한 제거
- **수정 개요**: CODE 유형 문항 본문 CodeBlock에 적용된 `max-h-48 overflow-y-auto`(높이 제한 + 내부 스크롤)를 제거하여 코드 전체가 펼쳐지도록 복원. 가독성 회복.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | CodeBlock의 `className="max-h-48 overflow-y-auto"` prop 제거 (L417) |

### 수정 상세

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx` (L416-418 영역)
- 변경 전:
  ```tsx
  <CodeBlock code={q.code} language={q.language} className="max-h-48 overflow-y-auto" />
  ```
- 변경 후:
  ```tsx
  <CodeBlock code={q.code} language={q.language} />
  ```
- 이유: 직전 작업(HIST-20260629-002)에서 "긴 코드에서도 답안칸이 같은 화면에 보이도록" max-h-48을 추가했으나, 사용자 피드백으로 코드가 좁은 박스에 갇혀 스크롤해야 하는 가독성 문제가 제기됨. 높이 제한 없이 전체 코드를 펼쳐 표시하도록 되돌림.

### 복원 방법
이 ID(HIST-20260630-001)만으로 복원 시: `quiz/[categoryId]/page.tsx` L417의 `<CodeBlock code={q.code} language={q.language} />`에 `className="max-h-48 overflow-y-auto"` prop을 다시 추가한다.

---

## HIST-20260629-002

- **날짜**: 2026-06-29
- **수정 범위**: 사용자 프론트엔드 / 퀴즈 플레이 — CODE 문항 답안 입력 개선
- **수정 개요**: CODE 유형 답안 입력을 단일 라인 `<input>`에서 공용 `CodeAnswerInput`(멀티라인 monospace, Tab=공백2칸 들여쓰기, Ctrl+Enter 제출)으로 교체. SHORT_ANSWER 단답은 기존 input 유지. 문제 CodeBlock에 `max-h-48 overflow-y-auto` 추가로 긴 코드에서도 답안칸이 같은 화면에 보이도록 함. 공용 컴포넌트 `CodeAnswerInput` 신설.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/CodeAnswerInput.tsx` | 추가 | CODE 유형 멀티라인 monospace 답안 입력 공용 컴포넌트 신설 |
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | `isCode` 분기 추가, CODE면 CodeAnswerInput·그 외 주관식은 기존 input. CodeBlock에 max-h 추가 |
| `CLAUDE.md` | 수정 | Shared Utilities 표에 `CodeAnswerInput` 행 추가 |

### 수정 상세

#### `frontend/src/components/ui/CodeAnswerInput.tsx` (신규)
- props: `value`, `onChange`, `disabled?`, `placeholder?`, `onCtrlEnter?`, `rows?(기본6)`, `className?`
- Tab 키: `e.preventDefault()` 후 커서(`selectionStart/End`) 위치에 공백 2칸(`TAB_INSERT`) 삽입, `requestAnimationFrame`에서 `setSelectionRange`로 커서 복원 → 포커스 이동 방지
- Ctrl+Enter(또는 Cmd+Enter): `onCtrlEnter?.()` 실행. 상단에 `코드 답안 입력 (Tab: 들여쓰기 · Ctrl+Enter: 제출)` 안내 레이블(onCtrlEnter 없으면 제출 안내 숨김)

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- `const isCode = q.questionType === 'CODE';` 추가 (L351 영역)
- 주관식 렌더(L474 영역): `isCode`면 `<CodeAnswerInput value={inputValue} onChange={setInputValue} disabled={submitted} placeholder="코드 답안을 입력하세요" onCtrlEnter={handleSubmitAnswer} />`, 아니면 기존 `<input onKeyDown Enter=제출>` 유지 (Enter 즉시제출/멀티라인 줄바꿈 충돌 해소)
- CodeBlock(L414): `className="max-h-48 overflow-y-auto"` 추가
- 이유: CODE 답안은 줄바꿈·들여쓰기가 필요해 단일 라인 input이 부적합. 퀴즈·시험 공용화로 CLAUDE.md "동일 로직 2곳↑ 공통 추출" 준수

### 복원 방법
이 ID(HIST-20260629-002)만으로 복원 시: `CodeAnswerInput.tsx` 삭제, 퀴즈 page에서 `isCode` 분기·import 제거하고 주관식을 기존 단일 `<input>`으로 되돌림, CodeBlock의 `max-h-48 overflow-y-auto` 제거, CLAUDE.md 표 행 제거.

---

## HIST-20260629-001

- **날짜**: 2026-06-29
- **수정 범위**: 사용자 프론트엔드 / 퀴즈 플레이 — 문항 title 헤더 시각 분리 강화
- **수정 개요**: title 헤더 텍스트를 text-xs→text-sm / text-gray-400→text-gray-500으로 키우고, 구분선을 border-gray-100→border-gray-200으로 진하게, title 블록에 mb-2를 추가해 본문과 확실히 분리

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | title 헤더 블록 className 조정 — 텍스트 크기·색·구분선·하단 여백 강화 |

### 수정 상세

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx` (L403-412 영역)
- 변경 전:
  ```tsx
  <div className="pr-24 pb-3 border-b border-gray-100">
    <span className="text-xs font-semibold text-gray-400 leading-tight">
      {q.title}
    </span>
  </div>
  ```
- 변경 후:
  ```tsx
  <div className="pr-24 pb-3 mb-2 border-b border-gray-200">
    <span className="text-sm font-semibold text-gray-500 leading-tight">
      {q.title}
    </span>
  </div>
  ```
- 이유:
  - `text-xs text-gray-400`(12px, 옅은 회색) → `text-sm text-gray-500`(14px, 중간 회색)으로 본문보다 작되 뚜렷한 부제 라벨로 위계 명확화
  - `border-gray-100`(거의 투명) → `border-gray-200`(가시적 구분선)으로 헤더/본문 경계선 강화
  - `mb-2` 추가: 기존 부모 `space-y-5`와 합산되어 title 블록 아래 실질적인 공백 확보
  - title 없을 때(q.title 빈 값) 조건부 렌더 로직(`q.title && q.title.trim() !== ''`) 및 `pr-24` 유지

### 복원 방법
이 ID(HIST-20260629-001)만으로 복원 시: `quiz/[categoryId]/page.tsx` title 헤더 div 를 `"pr-24 pb-3 border-b border-gray-100"`, span을 `"text-xs font-semibold text-gray-400 leading-tight"`로 되돌리고 `mb-2` 제거.

---

## HIST-20260626-001

- **날짜**: 2026-06-26
- **수정 범위**: 사용자 프론트엔드 / 퀴즈 플레이 — 개념노트·즐겨찾기 버튼 시각 구분
- **수정 개요**: 개념노트(인디고 테마 "개념 정리") vs 즐겨찾기(앰버 테마 "복습 표시") 버튼을 색·라벨·테두리로 뚜렷이 구분. 비활성 상태에서도 각자 테마색 테두리/틴트를 적용해 회색 알약처럼 동일해 보이던 문제 해결.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | 개념노트 버튼 인디고 테마·라벨·title 변경, 즐겨찾기 버튼 앰버 테마·라벨·title 변경 |

### 수정 상세

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx` (L515-550 영역)

**개념노트 버튼**
- 변경 전:
  - className: `"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition hover:bg-white/60"` (테두리 없음, 회색 호버)
  - 아이콘 color: 노트 있음 `text-indigo-500`, 없음 `text-gray-400`
  - 라벨: 있음 `'노트'`, 없음 `'메모'`
  - title: `"개념노트 작성"`
- 변경 후:
  - className: 노트 있음 `bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100`, 없음 `border-indigo-200 text-indigo-500 hover:bg-indigo-50` (항상 border 표시)
  - 아이콘: 상위 button의 테마색 상속(currentColor)
  - 라벨: 있음 `'개념 정리됨'`, 없음 `'개념 정리'`
  - title: `"이 문제의 개념을 정리합니다"`

**즐겨찾기 버튼**
- 변경 전:
  - className: `"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 hover:bg-white/60"` (테두리 없음, 회색 호버)
  - 채운 별 color: `text-amber-400`, 빈 별 color: `text-gray-400`
  - 라벨: 표시됨 `'즐겨찾기됨'`, 미표시 `'즐겨찾기'`
  - title: 표시됨 `'즐겨찾기 해제'`, 미표시 `'즐겨찾기 추가'`
- 변경 후:
  - className: 표시됨 `bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100`, 미표시 `border-amber-200 text-amber-500 hover:bg-amber-50` (항상 border 표시)
  - 채운 별: `text-amber-500`, 빈 별: currentColor 상속
  - 라벨: 표시됨 `'복습함'`, 미표시 `'복습 표시'`
  - title: 표시됨 `'복습 표시 해제'`, 미표시 `'나중에 다시 풀 문제로 표시'`

### 복원 방법
이 ID(HIST-20260626-001)만으로 복원 시: 위 "변경 전" className·라벨·title·아이콘 색을 `quiz/[categoryId]/page.tsx` L515-550 영역에 재적용한다.

---

## HIST-20260625-002

- **날짜**: 2026-06-25
- **수정 범위**: 사용자 프론트엔드 / 퀴즈 플레이
- **수정 개요**: `QuizQuestion` 인터페이스에 `title` 필드 추가, 퀴즈 문제 카드 상단에 title 헤더 렌더링(null/빈 문자열 시 미렌더)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/quizService.ts` | 수정 | `QuizQuestion` 인터페이스에 `title?: string` 필드 추가 (content 위) |
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | 문제 카드 배지와 `RichContent` 사이에 title 헤더 블록 추가 |

### 수정 상세

#### `frontend/src/services/quizService.ts`
- 변경 전:
  ```ts
  export interface QuizQuestion {
    id: number;
    content: string;
    ...
  }
  ```
- 변경 후:
  ```ts
  export interface QuizQuestion {
    id: number;
    title?: string;
    content: string;
    ...
  }
  ```
- 이유: BE `QuizQuestionView`에 추가된 `title` 필드를 FE 타입에 반영.

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx` (L403 영역)
- 변경 전: `<RichContent html={q.content} ...>` 바로 위에 title 관련 마크업 없음
- 변경 후: `q.title && q.title.trim() !== ''`일 때 `text-xs font-semibold text-gray-400` 텍스트 + `border-b border-gray-100`으로 본문과 시각 구분하는 헤더 블록 삽입. `pr-24` 적용으로 우상단 배지와 가로 겹침 방지.
- 이유: 관리자가 입력한 문항 제목(관리용)을 사용자 화면에 small/muted 스타일로 노출하되, 콘텐츠 본문(`text-gray-800 font-medium`)보다 위계를 낮게 표시.

### 복원 방법
이 ID(HIST-20260625-002)만으로 복원 시:
1. `quizService.ts` `QuizQuestion`에서 `title?: string` 줄 제거.
2. `quiz/[categoryId]/page.tsx`에서 `{q.title && q.title.trim() !== '' && (...)}` 블록 제거.

---

## HIST-20260625-001

- **날짜**: 2026-06-25
- **수정 범위**: 사용자 프론트엔드 / 퀴즈 플레이
- **수정 개요**: 퀴즈 문제 카드 우상단 연/회차 배지를 `if/else` 분기로 확장 — examYear·examRound 둘 다 null이면 'AI 커스텀' amber 배지 표시

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | 문제 카드 우상단 배지를 조건부 분기로 확장 — 연/회차 존재 시 기존 indigo 배지, 둘 다 null 시 amber 배지 |

### 수정 상세

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx` (L390-398 영역)
- 변경 전:
  ```tsx
  {(q.examYear != null || q.examRound != null) && (
    <span className="absolute top-4 right-4 text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
      {q.examYear != null && q.examRound != null
        ? `${q.examYear}년 ${q.examRound}회`
        : q.examYear != null
        ? `${q.examYear}년`
        : `${q.examRound}회`}
    </span>
  )}
  ```
- 변경 후:
  ```tsx
  {(q.examYear != null || q.examRound != null) ? (
    <span className="absolute top-4 right-4 text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
      {q.examYear != null && q.examRound != null
        ? `${q.examYear}년 ${q.examRound}회`
        : q.examYear != null
        ? `${q.examYear}년`
        : `${q.examRound}회`}
    </span>
  ) : (
    <span className="absolute top-4 right-4 text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
      AI 커스텀
    </span>
  )}
  ```
- 이유: AI 생성/커스텀 문항을 풀 때 연/회차 배지가 아예 없어 문항 출처가 불분명했음. amber 배지로 시각적으로 구분하여 사용자가 출처를 인식할 수 있게 함.
- 다크모드: 이 화면의 기존 indigo 배지가 `dark:` 변형 없이 라이트 전용 클래스만 사용하므로 amber 배지도 동일 패턴 적용.
- 위치/크기: 기존 indigo 배지와 동일한 `absolute top-4 right-4`, `px-2.5 py-0.5 rounded-full text-xs font-medium` 유지.

### 복원 방법
이 ID(HIST-20260625-001)만으로 복원 시: 위 "변경 전" 코드를 `user/quiz/[categoryId]/page.tsx` 해당 위치에 적용한다.

---

## HIST-20260622-001

- **날짜**: 2026-06-22
- **수정 범위**: 사용자 프론트엔드 / 퀴즈 플레이 결과 화면
- **수정 개요**: 데일리 퀴즈 결과 화면을 점수/채점 중심에서 풀이량 중심으로 재정렬 — showScoreCard=false 적용 + 풀이량 헤더 카드 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/ExamResultDisplay.tsx` | 수정 | `showScoreCard?: boolean` prop 추가, false일 때 점수 원형+완료 헤딩+정답수 카드 미렌더 |
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | result phase에 풀이량 헤더 카드 추가, ExamResultDisplay에 `showScoreCard={false}` 전달 |

### 수정 상세

#### `frontend/src/components/ui/ExamResultDisplay.tsx`
- 변경 전: Props에 showScoreCard 없음. 점수 집계 카드(원형+헤딩+정답수)가 항상 렌더됨.
- 변경 후:
  ```tsx
  interface Props {
    ...
    showScoreCard?: boolean; // false면 점수 집계 카드 미렌더, 기본 true
  }
  export function ExamResultDisplay({ ..., showScoreCard = true }: Props) {
    ...
    {showScoreCard && (
      <div className="bg-white rounded-2xl ..."> {/* 점수 집계 카드 */} </div>
    )}
  ```
- 이유: 퀴즈 결과 화면에서 점수/등급 프레이밍 없이 풀이량만 표시하기 위해. 시험 사용처(exam/[id], exam-history/[historyId])는 기본값 true이므로 무영향.

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전: result phase에서 ExamResultDisplay를 단독 렌더, examinationTitle=categoryName, showScoreCard 미전달(default true).
- 변경 후:
  ```tsx
  if (phase === 'result') {
    const resultData = mapSessionResultsToExamResultData(sessionResults);
    const sessionCorrectCount = sessionResults.filter(r => r.checkResult.correct).length;
    return (
      <div className="bg-gray-50 min-h-screen">
        {/* 풀이량 헤더 카드 */}
        <div className="max-w-2xl mx-auto pt-8 px-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-1">
            <p className="text-xs font-semibold text-gray-400 ...">{ categoryName }</p>
            <p className="text-2xl font-bold text-indigo-600">{ sessionResults.length }문제</p>
            <p className="text-sm text-gray-500">이번 세션 풀이 완료 · { sessionCorrectCount }문제 확인</p>
          </div>
        </div>
        <ExamResultDisplay
          result={resultData}
          showScoreCard={false}
          onBack={() => router.push('/user/quiz')}
          backLabel="카테고리 선택"
          showSavedBanner={false}
          onRetake={handleRetake}
        />
      </div>
    );
  }
  ```
- 이유: 퀴즈는 점수/채점 중심이 아닌 복습+풀이량 중심으로 재정렬. examinationTitle은 상단 헤더 카드에서 표시하므로 ExamResultDisplay에 전달 제거.

### 복원 방법
이 ID(HIST-20260622-001)만으로 복원 시:
- ExamResultDisplay.tsx: `showScoreCard?: boolean` prop 제거, 함수 구조분해에서 제거, `{showScoreCard && (` 래퍼를 제거하고 점수 집계 카드를 항상 렌더하도록 복원.
- quiz/[categoryId]/page.tsx: result phase를 단독 ExamResultDisplay 렌더로 되돌리고, examinationTitle={categoryName}, completionLabel="퀴즈 완료" 복원.

---

## HIST-20260619-001

- **날짜**: 2026-06-19
- **수정 범위**: 사용자 프론트엔드 / 퀴즈 플레이
- **수정 개요**: `useSearchParams()` Suspense 경계 누락으로 발생하는 Next.js 14 프로덕션 빌드 실패 결함 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | `useSearchParams()` 사용 본문을 `QuizPlayContent` 자식 컴포넌트로 분리, export default를 `<Suspense fallback={<QuizCardSkeleton />}>`로 감싸도록 리팩토링 |

### 수정 상세

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전:
  ```tsx
  export default function QuizPlayPage() {
    const searchParams = useSearchParams(); // Suspense 경계 없이 최상위 호출
    // ... 전체 컴포넌트 로직
  }
  ```
- 변경 후:
  ```tsx
  function QuizPlayContent() {
    const searchParams = useSearchParams(); // 자식 컴포넌트로 분리
    // ... 전체 컴포넌트 로직
  }

  export default function QuizPlayPage() {
    return (
      <Suspense fallback={<QuizCardSkeleton />}>
        <QuizPlayContent />
      </Suspense>
    );
  }
  ```
- 이유: Next.js 14 App Router 정적 생성 단계에서 `useSearchParams()`를 Suspense 경계 없이 export default 컴포넌트 최상위에서 호출하면 빌드 에러(`useSearchParams() should be wrapped in a suspense boundary`) 발생. `/user/settings`와 동일한 패턴으로 수정. fallback은 CLAUDE.md 스켈레톤 UI 컨벤션에 따라 `<QuizCardSkeleton />` 사용.

### 검증 결과
- `npx tsc --noEmit`: 통과 (오류 없음)
- `npm run build`: 통과 — 47개 정적 페이지 전체 생성 성공 (`/user/quiz/[categoryId]` ƒ Dynamic으로 정상 포함)
- 추가 `useSearchParams` 결함: 빌드 출력에서 새로운 결함 없음 (viewport metadata 경고는 기존 사전 존재 경고로 이번 수정과 무관)

### 복원 방법
이 ID(HIST-20260619-001)만으로 복원 시, `frontend/src/app/user/quiz/[categoryId]/page.tsx`에서 `QuizPlayContent` 내부 로직을 `QuizPlayPage`로 다시 합치고, `Suspense` import 및 `QuizPlayContent` 함수 선언을 제거한다.
