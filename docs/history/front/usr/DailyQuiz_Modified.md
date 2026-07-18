## HIST-20260718-003

- **날짜**: 2026-07-18
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 풀이 스크래치패드 — 코드 트레이싱 표기법 확장(나란히 2D 배열 + 오브젝트)
- **수정 개요**: 코드 트레이싱 "타이핑→자동 렌더" 표기법 파서(`traceNotation.ts`)에 두 가지 표기를 추가했다. (1) `[1,2,3][2,3,4]`처럼 중첩 없이 대괄호 그룹을 나란히 연속으로 쓴 형태를 2D 배열로 인식(기존에는 텍스트로 폴백). (2) `{k: v, ...}` 오브젝트 표기를 새 `ObjectLine`으로 파싱해 프리뷰에서 키-값 2열 표로 렌더. 기존 1D·중첩 2D·수식 자동계산·타입 배지 동작은 전혀 건드리지 않았다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `frontend/src/lib/traceNotation.ts` | 수정 | 나란히 2D 배열 인식(`splitTopLevelBracketGroups` 추가 + `parseArrayValue` 분기), 오브젝트 표기 파싱(`ObjectLine` 타입, `parseBraceGroup`/`splitEntryByTopColon`/`parseObjectValue` 추가, `classifyLine`·`ClassifiedLine`·최종 `parseTraceLines` 매핑에 object 분기 반영) |
| `frontend/src/components/ui/TracePreview.tsx` | 수정 | `ObjectRow` 컴포넌트 추가(이름+타입 배지 + 키-값 2열 표, 빈 객체는 "(빈 객체)" 안내), switch에 `case 'object'` 추가 |
| `frontend/src/lib/traceNotation.test.ts` | 수정 | 나란히 2D 배열 인식 테스트 1건 + 기존 중첩 2D·1D 회귀 테스트 2건, 오브젝트 파싱 테스트(단순 엔트리·값 내부 콜론 보존·명시 타입·빈 객체·콜론 없는 엔트리 text 폴백·불균형 중괄호 text 폴백) 6건 추가 |
| `CLAUDE.md` | 수정 | Shared Utilities 표의 `parseTraceLines`/`TracePreview` 행 설명에 나란히 2D·오브젝트 표기 지원 내용 반영 |

### 수정 상세

#### `frontend/src/lib/traceNotation.ts`
- 변경 전: rhs가 `[`로 시작할 때 `parseArrayValue`는 단일 최상위 대괄호 그룹만 처리했다(1D 또는 중첩 `[[..],[..]]` 2D). `[1,2,3][2,3,4]`처럼 그룹을 나란히 이어 쓰면 `parseBracketGroup`이 바깥 대괄호 뒤에 남는 문자를 감지해 실패 → text 폴백이었다. `{`로 시작하는 값은 배열/스칼라 어느 분기에도 걸리지 않아 `scalarAssign`으로 떨어져 `inferScalarType`이 항상 `'string'`으로 표시했다(오브젝트 구조를 표현할 수단이 없었다).
- 변경 후:
  - `splitTopLevelBracketGroups(rhs)`: rhs가 공백만 사이에 두고 이어지는 최상위 `[...]` 그룹 2개 이상으로 전체를 덮으면 그룹별 원문 문자열 배열을 반환(괄호 깊이·따옴표만으로 그룹 경계 판정, 각 그룹 내부의 실제 유효성은 이후 `parseBracketGroup`이 재검증). 그룹이 1개뿐이거나 경계 판정에 실패하면 null.
  - `parseArrayValue`가 먼저 `splitTopLevelBracketGroups`를 호출해 그룹이 2개 이상이면 각 그룹을 `parseBracketGroup`으로 1D 파싱해 행으로 삼아 `array2d`를 반환(한 그룹이라도 실패하면 null → text 폴백). 그룹이 1개면 기존 로직(단일 그룹 `parseBracketGroup` → 1D 또는 중첩 2D)으로 그대로 위임 — 기존 동작 미변경.
  - `ObjectLine` 인터페이스(`kind: 'object'; name; entries: {key,value}[]; typeLabel; typeSource`)를 `TraceLine` 유니온에 추가.
  - `parseBraceGroup(raw)`: `parseBracketGroup`과 동일한 깊이/따옴표 추적 로직을 `{...}`용으로 적용해 최상위 콤마로 엔트리 문자열 배열을 분리(불균형·미종료 문자열은 null).
  - `splitEntryByTopColon(entry)`: 엔트리 문자열을 중첩/따옴표 밖의 첫 번째 콜론으로 key/value 분리(값 내부 콜론은 보존, 예 `url: http://x` → `key='url', value='http://x'`). 최상위 콜론이 없으면 null.
  - `parseObjectValue(rhs)`: `parseBraceGroup` 결과의 각 엔트리를 `splitEntryByTopColon`으로 분리하고, 콜론 없는 엔트리가 하나라도 있으면(Set 형태 `{1, 2, 3}` 등) 전체 null(오브젝트로 보지 않음). 빈 `{}`는 entries 빈 배열로 정상 처리.
  - `classifyLine`에서 배열 분기(`rhs.startsWith('[')`) 다음, 기존 `scalarAssign` 반환 이전에 `rhs.startsWith('{')` 분기를 추가해 `parseObjectValue` 결과를 `ObjectLine`으로 반환(실패 시 text 폴백). typeLabel은 명시 타입 있으면 그것, 없으면 `'object'`.
  - `ClassifiedLine` 유니온에 `ObjectLine` 추가, `parseTraceLines` 최종 매핑에서 `array1d`/`array2d`/`text`와 함께 `object`도 그대로 통과시키도록 조건 확장(env 등록·수식 계산 대상 아님).
  - 값은 재귀 파싱하지 않고 문자열 그대로 보존하며, 파서는 어떤 입력에도 throw하지 않고 실패 시 text로 폴백하는 기존 안전 원칙을 그대로 유지했다. eval/new Function/신뢰 불가 JSON.parse는 사용하지 않았다.
- 이유: 사용자가 "둘 다 개선"을 명시 선택. 자주 쓰는 나란히 2D 표기와 오브젝트 표기를 지원해 트레이싱 프리뷰의 표현 범위를 넓히되, 기존 1D·중첩 2D·수식 자동계산·타입 추론 경로는 전혀 변경하지 않았다.

#### `frontend/src/components/ui/TracePreview.tsx`
- 변경 전: switch 문에 `var`/`array1d`/`array2d`/`text`/`expr` 케이스만 있었고 `ObjectLine`을 렌더할 컴포넌트가 없었다.
- 변경 후: `Array2DGrid` 바로 다음, `FreeTextRow` 이전에 `ObjectRow` 컴포넌트를 추가했다. 상단에 이름 칩 + `TypeBadge`(기존 `Array1DRow`/`Array2DGrid`와 동일한 `text-xs font-semibold text-indigo-600 dark:text-indigo-300 font-mono` + 배지 배치 컨벤션 준용), 아래에 `키`/`값` 2열 `<table>`(기존 `Array2DGrid`와 동일한 border/bg/폰트 톤 — `border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-mono` 셀 스타일)을 렌더한다. entries가 빈 배열이면 `Array2DGrid`의 `(빈 배열)` 패턴을 준용해 `(빈 객체)`를 표시한다. switch 문에 `case 'object'`를 추가해 `ObjectRow`에 name/entries/typeLabel/typeSource를 전달한다.
- 이유: 파서가 반환하는 `ObjectLine`을 기존 컴포넌트 스타일 컨벤션에 맞춰 읽기 전용으로 시각화하기 위해.

#### `frontend/src/lib/traceNotation.test.ts`
- 변경 전: 배열 파싱(대괄호 그룹 분리) 테스트만 있었고 나란히 2D·오브젝트 표기 테스트가 없었다.
- 변경 후: 기존 `describe('parseTraceLines array parsing')` 블록에 나란히 2D 인식 테스트(`[1,2,3][2,3,4]` → `array2d`, grid `[['1','2','3'],['2','3','4']]`, typeLabel `number[][]`)와 기존 중첩 2D(`[[1,2],[3,4]]`)·1D(`[1,2,3]`) 회귀 확인 테스트를 추가했다. 새 `describe('parseTraceLines object parsing')` 블록에 단순 엔트리(`{1: 3, 3: 4}`), 값 내부 콜론 보존(`{url: http://x}`), 명시 타입(`o: Map = {1: 2}`), 빈 객체(`{}`), 콜론 없는 엔트리 text 폴백(`{1, 2}`), 불균형 중괄호 text 폴백(`{1: 2`) 테스트를 추가했다.
- 이유: 신규 파서 분기의 정상 케이스·안전 폴백 케이스와 기존 동작 무회귀를 함께 검증하기 위해.

### 복원 방법
이 ID(HIST-20260718-003)만으로 복원 시:
- `frontend/src/lib/traceNotation.ts`에서 `splitTopLevelBracketGroups` 함수, `parseArrayValue` 안의 나란히 2D 분기(함수 상단 `topGroups` 관련 블록), `ObjectLine` 인터페이스, `TraceLine` 유니온의 `ObjectLine` 추가, `parseBraceGroup`/`splitEntryByTopColon`/`parseObjectValue` 함수, `classifyLine`의 `rhs.startsWith('{')` 분기, `ClassifiedLine` 유니온의 `ObjectLine` 추가, `parseTraceLines` 최종 매핑의 `object` 조건 추가를 모두 제거하고 파일 상단 표기법 설명 주석의 나란히 2D·오브젝트 관련 문구 2줄을 제거한다.
- `frontend/src/components/ui/TracePreview.tsx`에서 `ObjectRow` 컴포넌트 전체와 switch 문의 `case 'object'` 블록을 제거한다.
- `frontend/src/lib/traceNotation.test.ts`에서 이번에 추가한 나란히 2D·1D 회귀 테스트 2건과 `describe('parseTraceLines object parsing')` 블록 전체를 제거한다.
- `CLAUDE.md`의 Shared Utilities 표에서 `parseTraceLines`/`TracePreview` 행 설명 중 나란히 2D·오브젝트 관련 문구를 제거해 이전 서술로 되돌린다.

---

## HIST-20260718-002

- **날짜**: 2026-07-18
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 화면 키보드 단축키
- **수정 개요**: 데일리 퀴즈 화면(`user/quiz/[categoryId]/page.tsx`)에 Alt 조합 키보드 단축키(정답 확인, 다음 문제)를 추가하고, 버튼 title 속성과 데스크톱 전용 힌트 텍스트로 단축키 정보를 노출했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | Alt+Enter/Alt+→ 키보드 단축키 effect 추가, 관련 버튼 title·힌트 텍스트 추가 |

### 수정 상세

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전: 정답 확인과 다음 문제 이동은 오직 버튼 클릭(또는 입력창의 기존 Enter·Ctrl+Enter 제출)으로만 가능했다. 관련 단축키·안내 문구가 없었다.
- 변경 후:
  - `handleSelectOX` 정의 직후, "Loading" 분기 직전에 새 `useEffect`를 추가해 `window`에 `keydown` 리스너를 등록했다. `e.altKey && e.key === 'Enter'`이면 "정답확인" 버튼의 기존 disabled 조건과 동일하게 `!answerState?.submitted && inputValue.trim() && !checking`일 때만 `handleSubmitAnswer()`를 호출한다. `e.altKey && e.key === 'ArrowRight'`이면 `answerState?.submitted === true`일 때만 `e.preventDefault()` 후 `handleNext()`를 호출한다. 이 화면은 앞으로만 진행하므로 Alt+←는 바인딩하지 않았다.
  - 단축키 활성 가드: `phase !== 'quiz'`, `!q`, `noteTarget`(개념노트 모달 열림) 중 하나라도 해당하면 effect가 조기 반환해 리스너를 등록하지 않는다(결과/이어풀기/로딩 등 다른 phase, 개념노트 모달 열림 시 비활성). effect cleanup에서 `removeEventListener`로 항상 해제한다.
  - 기존 입력창의 Enter(단답 제출)·Ctrl+Enter(CODE 제출) 바인딩은 그대로 두고 건드리지 않았다. Alt+Enter는 별개의 독립 리스너로 추가했다.
  - "정답확인" 버튼에 `title="정답 확인 (Alt+Enter)"`를 추가하고 그 아래(제출 전에만) 데스크톱 전용(`hidden sm:block`) 힌트 "Alt+Enter 정답 확인"을 추가했다. "다음 문제/라운드 완료" 버튼에 `title="다음 문제 (Alt+→)"`를 추가하고 그 아래(제출 후에만) 힌트 "Alt+→ 다음"을 추가했다. 이 파일은 기존에 `dark:` 클래스를 사용하므로 힌트 텍스트에도 `dark:text-gray-500`을 함께 적용했다.
- 이유: 사용자가 Alt 조합 키보드 단축키를 명시적으로 요청했다. 기존 버튼 클릭·타이머·모달·기존 Enter/Ctrl+Enter 흐름은 전혀 변경하지 않고 순수 추가로만 구현했다.

### 복원 방법
이 ID(HIST-20260718-002)만으로 복원 시, `frontend/src/app/user/quiz/[categoryId]/page.tsx`에서 위에서 추가한 Alt 단축키 `useEffect` 블록 전체, "정답확인"/"다음 문제" 버튼의 `title` 속성 2개, 두 힌트 `<p>` 태그(제출 전/제출 후) 2개를 모두 제거한다.

---

## HIST-20260718-001

- **날짜**: 2026-07-18
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 완료 결과 복습 표시
- **수정 개요**: 데일리 퀴즈 세션 결과에 명시적인 문제은행 ID를 전달해 공용 결과 화면에서 복습 표시를 추가·해제할 수 있게 했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | 세션 결과의 퀴즈 문항 ID를 `questionBankId`로 명시 매핑 |
| `frontend/src/types/index.ts` | 수정 | 결과 문항의 nullable `questionBankId` 타입 추가 |
| `frontend/src/components/ui/ExamResultDisplay.tsx` | 수정 | 공용 결과 복습 표시 조회·토글 UI |
| `frontend/src/components/ui/ExamResultDisplay.test.tsx` | 수정 | 공용 결과 북마크 동작 회귀 테스트 |

### 수정 상세

- 데일리 퀴즈의 `QuizQuestion.id`는 문제은행 ID라는 계약을 결과 모델에 명시해, 시험 결과의 `questionId`와 혼용하지 않는다.
- 완료 결과의 정답·오답 문항 모두에서 복습 표시를 사용할 수 있고 오답 필터에서도 버튼을 유지한다. 목록 상태를 확인하기 전에는 토글을 잠그고 모바일에서도 상태 텍스트를 항상 표시한다.
- 공용 결과 컴포넌트는 커밋된 결과 ID만 비동기 토글 응답에 사용하고, 언마운트 뒤 늦은 목록·토글 응답과 현재 결과 밖 북마크 ID를 상태에 반영하지 않는다.

---

## HIST-20260717-002

- **날짜**: 2026-07-17
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 결과 문항 미리보기
- **수정 개요**: 시험·퀴즈 공용 `ExamResultDisplay`의 접힌 문항 헤더에 제목 우선 4단계 fallback을 적용했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `frontend/src/components/ui/ExamResultDisplay.tsx` | 수정 | 제목·발문·본문·기본 문구 순 미리보기 |
| `frontend/src/components/ui/ExamResultDisplay.test.tsx` | 추가 | HTML 제거와 fallback 우선순위 검증 |
| `frontend/src/types/index.ts` | 수정 | 결과 문항 제목 nullable 선택 필드 |

### 수정 상세

- 제목이 없는 퀴즈 결과는 기존 데이터의 발문 또는 본문을 사용하므로 legacy 응답도 깨지지 않는다.
- 빈 제목·빈 HTML 본문까지 모두 없으면 `문항 제목 없음`을 표시한다.

---

## HIST-20260717-001

- **날짜**: 2026-07-17
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 풀이 스크래치패드 — 코드 트레이싱 배열 프리뷰 파싱 보정
- **수정 개요**: 코드 트레이싱 배열 파서가 중괄호 튜플 내부 쉼표를 최상위 원소 구분자로 잘못 처리해 `[{1, "AB"}, {2, "DC"}, {3, "EB"}]`를 6개 셀로 표시하던 결함을 수정했다. 대괄호·중괄호·소괄호의 중첩과 작은따옴표·큰따옴표·백슬래시 이스케이프를 함께 추적하며, 바깥 배열 바로 아래의 쉼표만 분리한다. 불균형 괄호와 미종료 문자열은 배열로 렌더하지 않고 자유 텍스트로 안전하게 폴백한다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/traceNotation.ts` | 수정 | 상태 기반 배열 그룹 파싱으로 중첩 그룹·문자열 내부 쉼표 보존 및 malformed 입력 폴백 |
| `frontend/src/lib/traceNotation.test.ts` | 추가 | 튜플·문자열 이스케이프·중첩 그룹·빈 배열·바깥 대괄호 중복/누락·malformed 입력과 기존 1D/2D 배열 회귀 테스트 |

### 수정 상세

#### `frontend/src/lib/traceNotation.ts`
- 변경 전: 바깥 `]` 탐색과 원소 분리가 대괄호 깊이만 추적해 `{1, "AB"}` 내부의 쉼표와 문자열 안의 쉼표·대괄호를 구분하지 못했다. 괄호나 따옴표가 깨진 입력도 일부 배열로 오인할 수 있었다.
- 변경 후: 단일 상태 기반 `parseBracketGroup`이 `[]`·`{}`·`()` 스택, 작은따옴표·큰따옴표, 백슬래시 이스케이프를 추적한다. 바깥 배열 바로 아래의 쉼표만 셀 경계로 사용하고 모든 그룹·문자열이 정상 종료된 경우에만 배열을 반환한다. 중괄호 튜플은 새 렌더 종류 없이 1D 배열의 원자 셀로 유지한다.
- 이유: 데일리 퀴즈 화면의 공용 스크래치패드 프리뷰에서 구조를 포함한 배열 메모가 데이터 손실 없이 표시되고, 잘못 닫힌 입력은 안전하게 원문 보존되도록 하기 위함.

#### `frontend/src/lib/traceNotation.test.ts`
- 변경 전: `traceNotation` 전용 단위 테스트가 없어 배열 구분 경계와 malformed 폴백의 회귀를 자동 검증하지 못했다.
- 변경 후: 사용자 재현 입력이 3개 원자 셀로 유지되는지, 문자열 내부 쉼표·이스케이프와 중첩 중괄호·소괄호를 보존하는지, 빈 배열이 빈 1D 배열로 유지되는지, 불균형 그룹·바깥 대괄호 중복/누락 입력이 text로 폴백하는지, 기존 1D/2D 배열 동작이 유지되는지를 검증하는 Jest 테스트를 추가했다.
- 이유: 동일 결함 재발과 기존 배열 렌더 회귀를 방지하기 위함.

### 복원 방법

이 ID(`DailyQuiz_Modified.md` 기준 HIST-20260717-001)로 복원 시 `traceNotation.ts`의 상태 기반 `parseBracketGroup`을 기존 대괄호 깊이 전용 `findMatchingBracketEnd`·`splitTopLevel` 구현으로 되돌리고 `traceNotation.test.ts`를 제거한다.

---

## HIST-20260714-002

- **날짜**: 2026-07-14
- **수정 범위**: 사용자 프론트엔드 / 풀이 스크래치패드 - 스케줄링 간트차트
- **수정 개요**: 간트차트 시간축을 셀 중앙 인덱스에서 셀 경계 눈금 방식으로 변경

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/SchedulingSolveTool.tsx` | 수정 | 간트차트 시간축 렌더링을 table 헤더 중앙 인덱스에서 셀 경계 눈금(flex 구조)으로 변경 |

### 수정 상세

#### `components/ui/SchedulingSolveTool.tsx`
- 변경 전: `<table>` 구조. `<thead>`의 `<th>`마다 `normalizedGantt.map((_, c) => <th>{c}</th>)`로 셀 폭(`w-12`)과 동일한 `<th>`에 인덱스 `c`(0-based)를 셀 위 중앙 정렬로 표시. `<tbody>`의 `<td>`에 `hashLabelToColorClass(cell)` 배경색을 적용한 `<input>` 배치.
- 변경 후: `<table>`을 `flex pt-4 w-max` 컨테이너로 교체. 각 셀을 `relative w-12 -ml-px first:ml-0` div로 감싸 인접 셀 border를 겹쳐 붙이고, 셀 왼쪽 상단에 `absolute -top-4 left-0 -translate-x-1/2`로 시작 경계 숫자 `c`를 표시. 마지막 셀에는 오른쪽 상단에 `absolute -top-4 right-0 translate-x-1/2`로 종료 경계 숫자 `c+1`(=총 시간)을 추가로 표시. `<input>`은 첫 셀에 `rounded-l`, 마지막 셀에 `rounded-r`을 조건부 적용하고 `focus:z-10`을 추가해 border 겹침 시 포커스 링이 인접 셀에 가려지지 않도록 함. `value`/`onChange={handleGanttCellChange}`/`spellCheck={false}`/색상 로직(`hashLabelToColorClass`)/다크모드 클래스/`w-12`/focus ring 스타일은 그대로 유지. `totalTime === 0` 안내 분기와 `normalizedGantt`/`resizeGantt` 로직은 미변경.
- 이유: 셀 위 중앙 인덱스 표기는 완료시간을 한 칸 오해하게 만들 수 있어(P1이 셀 0·1을 채워도 마지막 라벨이 1로 보여 완료시간을 1로 오인), 경계선 위에 눈금을 표시하는 교과서 표준 간트차트 방식으로 정합성 개선.

### 복원 방법
이 ID(HIST-20260714-002)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.

---

## HIST-20260714-001

- **날짜**: 2026-07-14
- **수정 범위**: 사용자 프론트엔드 / 풀이 스크래치패드(공용 `ScratchPadPanel`) — 계산기 이력 보관 개수 5 → 10 확대
- **수정 개요**: 스크래치패드 계산기 탭의 "최근 계산" 이력이 최대 5개까지만 보관·표시되던 것을 10개로 늘렸다. 이력 개수를 결정하는 상수 `MAX_CALC_HISTORY`(계산 성공 시 `calcHistory` 배열을 `slice(0, MAX_CALC_HISTORY)`로 자름)의 값만 변경했으며, "최근 계산" 라벨·렌더 로직에는 하드코딩된 숫자가 없어(`data.calcHistory`를 전체 map) 추가 수정이 필요 없었다. localStorage에 이미 저장된 기존 이력에는 영향 없음(다음 계산부터 최대 10개로 누적).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정(공용) | 상수 `MAX_CALC_HISTORY` 값 `5` → `10` |

### 수정 상세

#### `components/ui/ScratchPadPanel.tsx`
- 변경 전: `const MAX_CALC_HISTORY = 5;`
- 변경 후: `const MAX_CALC_HISTORY = 10;`

### 복원 방법
이 ID(HIST-20260714-001)만으로 복원 시: `ScratchPadPanel.tsx`의 `MAX_CALC_HISTORY`를 다시 `5`로 되돌린다.

---

## HIST-20260710-002

- **날짜**: 2026-07-10
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 풀이 화면 — 복습 표시(북마크) 재풀이 모드 추가
- **수정 개요**: 복습 표시 목록 화면(`/user/bookmarks`)의 "복습 시작" 버튼에서 진입하는 `/user/quiz/bookmarks` 경로를 위해, 기존 카테고리별 퀴즈 풀이 화면(`app/user/quiz/[categoryId]/page.tsx`)에 route param이 `'bookmarks'`일 때만 활성화되는 북마크 재풀이 모드를 추가했다. `quizService.getBookmarkedQuestions()`로 사용자의 북마크 문항 전체를 한 번에 로드(배치 재로드 없음)하고, 기존 흐름(문항 카드·답 입력·채점·해설·스크래치패드·북마크 별 토글)을 그대로 재사용한다. 문항의 실제 채점은 `checkAnswer(questionId, userAnswer)`가 문항 id만으로 처리하므로(서버가 문항의 실제 categoryId를 자체 결정) FE는 route의 categoryId가 숫자가 아니어도 채점 경로에는 영향이 없음을 확인했다. `categoryId`가 `NaN`이 되는 지점(스크래치패드 storageKey)만 `rawCategoryId('bookmarks')`로 대체했다. 문항이 0개면 안내 문구 + 복습 표시 화면 복귀 버튼을 보여주는 신규 `'empty'` phase를 추가했고, 배치 완료 화면(`'continue'` phase)에서는 "계속 풀기"(추가 배치 로드) 버튼을 숨겼다. 결과 화면의 "뒤로가기"도 북마크 모드에서는 `/user/bookmarks`로 향하도록 자체 판단으로 개선했다(계획서에 명시되지 않았으나 UX 일관성을 위해 추가, 위험 없는 변경).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | `isBookmarkMode` 판별, `loadBatch` 분기, `Phase`에 `'empty'` 추가, continue phase "계속 풀기" 버튼 숨김, 결과 화면 뒤로가기 목적지 분기, 스크래치패드 storageKey를 `rawCategoryId` 기반으로 변경 |
| `frontend/src/services/quizService.ts` | 수정 | `getBookmarkedQuestions()` 신규 추가 — `GET /user/quiz/bookmarked-questions` |

### 수정 상세

#### `services/quizService.ts`
- 변경 전: `getCategories`/`getQuestions`/`checkAnswer` 3개 메서드만 존재
- 변경 후: `getBookmarkedQuestions: () => apiClient.get<ApiResponse<QuizQuestion[]>>('/user/quiz/bookmarked-questions')` 추가
- 이유: 백엔드 신규 엔드포인트(`docs/history/back/usr/UserQuiz_Modified.md` HIST-20260710-002) 호출용

#### `app/user/quiz/[categoryId]/page.tsx`
- 변경 전: `categoryId = Number(params.categoryId)`만 존재, `Phase = 'loading' | 'quiz' | 'continue' | 'result'`, `loadBatch`가 항상 `quizService.getQuestions(...)` 호출, 문항 0개 시 항상 alert + `/user/quiz`로 리다이렉트, continue phase에 "종료하기"/"계속 풀기" 버튼 항상 노출, 결과 화면 뒤로가기는 항상 `/user/quiz`, 스크래치패드 storageKey가 `categoryId`(숫자) 기반
- 변경 후: `rawCategoryId = String(params.categoryId)`, `isBookmarkMode = rawCategoryId === 'bookmarks'`, `categoryName` 기본값이 북마크 모드면 `'복습 표시'`. `Phase`에 `'empty'` 추가. `loadBatch`는 북마크 모드면 `quizService.getBookmarkedQuestions()`를 호출하고, 결과가 0개면(북마크 모드 한정) alert 없이 `setPhase('empty')`. `'empty'` phase는 안내 문구 + `/user/bookmarks`로 돌아가는 버튼 렌더. continue phase는 `!isBookmarkMode`일 때만 "계속 풀기" 버튼 렌더(북마크 모드는 배치 재로드가 없으므로). 결과 화면 `onBack`/`backLabel`이 북마크 모드면 `/user/bookmarks`·"복습 표시로 돌아가기". 스크래치패드 storageKey를 `tpmp_scratchpad:quiz:${rawCategoryId}:${q.id}`로 변경(북마크 모드에서 `categoryId`가 `NaN`이 되는 것을 회피)
- 이유: 계획서 스펙 그대로 구현. 북마크 별 토글로 해제해도 현재 세션 문항 목록은 유지되는 요구사항은 기존 `handleToggleBookmark`가 `bookmarkedIds` state만 갱신하고 `questions` 배열을 건드리지 않으므로 별도 코드 변경 없이 이미 충족됨을 확인(계획서 5번 항목)

### 복원 방법
이 ID(HIST-20260710-002)만으로 복원 시: `quizService.ts`에서 `getBookmarkedQuestions` 제거. `[categoryId]/page.tsx`에서 `rawCategoryId`/`isBookmarkMode` 관련 분기(loadBatch, `'empty'` phase, continue phase 버튼 숨김, 결과 화면 목적지 분기)를 제거하고 `categoryId = Number(params.categoryId)`·스크래치패드 storageKey를 `${categoryId}` 기반으로 되돌린다.

## HIST-20260710-001

- **날짜**: 2026-07-10
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 — 출처(전체/기출/AI 커스텀) 필터 추가
- **수정 개요**: 기존 CODE 언어 필터(HIST-20260707-005)와 동일한 구조로, `hasAiCustomQuestions === true`인 카테고리(examYear·examRound 모두 null인 AI 커스텀 문항이 있는 문제 유형)를 클릭했을 때도 모달을 띄워 출처(기출/AI 커스텀/전체)를 고를 수 있게 했다. 한 카테고리가 CODE 문항과 AI 커스텀 문항을 동시에 보유하면(`hasCodeQuestions && hasAiCustomQuestions`) 언어·출처 두 섹션을 모달 하나에 함께 보여주고 "시작" 버튼으로 한 번에 확정하도록 `CodeLanguageModal`을 확장했다. 선택 결과는 `?language=`·`?source=` 쿼리로 함께 전달되어 퀴즈 풀이 화면에서 `quizService.getQuestions(categoryId, 10, language, source)`로 필터링된 문항을 받아온다. 헤더에는 언어 배지 옆에 출처 배지(기출=인디고, AI 커스텀=앰버)를 추가 표시(문항 카드 우상단의 연도/회차·AI 커스텀 배지와는 별개).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `DomainSlave`에 `hasAiCustomQuestions?: boolean` 필드 추가 |
| `frontend/src/services/quizService.ts` | 수정 | `getQuestions(categoryId, limit, language?, source?)`로 확장 — source 있을 때만 쿼리 파라미터 전달 |
| `frontend/src/components/ui/CodeLanguageModal.tsx` | 수정 | `showLanguage`/`showSource` props 추가해 언어·출처 섹션을 독립 제어. 둘 다 표시되는 경우 내부 state로 선택을 보류했다가 "시작" 버튼으로 `onSelect({ language, source })` 확정. `onSelect` 시그니처를 `(language?: string) => void`에서 `(selection: { language?: string; source?: string }) => void`로 변경(breaking, 호출부는 아래 `page.tsx`뿐이라 함께 수정) |
| `frontend/src/app/user/quiz/page.tsx` | 수정 | `handleSelect` 조건에 `slave.hasAiCustomQuestions` 추가, `handleSelectLanguage`를 `handleSelectScope({ language?, source? })`로 이름 변경 및 두 값 모두 쿼리에 반영, `<CodeLanguageModal>` 호출부에 `showLanguage`/`showSource` 전달 |
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | `source` 쿼리 파라미터 추가 읽기, `loadBatch`·`useEffect` deps에 `source` 추가, 헤더에 출처 배지 렌더 추가 |
| `CLAUDE.md` | 수정 | Shared Utilities 표의 `CodeLanguageModal` 행을 확장된 props·역할로 갱신 |
| `AGENTS.md` | 수정 | Shared Utilities 표에 `CodeLanguageModal` 행 신규 추가(기존에 행 자체가 없었음) |

### 수정 상세

#### `types/index.ts`
- 변경 전: `DomainSlave { ..., hasCodeQuestions? }`
- 변경 후: `hasAiCustomQuestions?: boolean` 필드 추가
- 이유: 백엔드 `DomainSlaveResponse.hasAiCustomQuestions`를 FE 타입에 반영

#### `services/quizService.ts`
- 변경 전: `getQuestions(categoryId, limit = 10, language?)` — language만 조건부 전달
- 변경 후: `getQuestions(categoryId, limit = 10, language?, source?)` — language·source 각각 값이 있을 때만 쿼리 파라미터 전달(둘 다 없으면 기존과 100% 동일한 쿼리스트링, 회귀 없음)
- 이유: 출처 필터 API 호출 지원

#### `components/ui/CodeLanguageModal.tsx`
- 변경 전: props `{ open, onClose, onSelect: (language?: string) => void }`, 언어 그리드만 렌더, 클릭 즉시 확정
- 변경 후: props에 `showLanguage`/`showSource` 추가, `onSelect: (selection: { language?; source? }) => void`로 변경. `showLanguage && !showSource`는 언어 그리드만(클릭 즉시 확정), `!showLanguage && showSource`는 출처 그리드만(클릭 즉시 확정), 둘 다 true면 두 그리드를 함께 보여주되 내부 `useState`로 선택 보류(선택된 버튼은 인디고 테두리/배경 강조) 후 "시작" 버튼 클릭 시 확정. 안내 문구·모달 제목도 표시 섹션 조합에 따라 3가지로 분기(언어만/출처만/둘다)
- 이유: 계획서 스펙 그대로 구현. **직접 판단한 부분**: "시작" 버튼 UI는 인디고 배경(`bg-indigo-600`) full-width 버튼으로, 취소 버튼 바로 위에 배치(둘 다 표시 케이스에서만 렌더). 미확정 상태 버튼 강조 색상은 기존 hover 스타일과 동일 톤(인디고)을 선택 상태에도 재사용해 톤 일관성을 유지했다

#### `app/user/quiz/page.tsx`
- 변경 전: `handleSelect`가 `slave.hasCodeQuestions`만 검사, `handleSelectLanguage(language?: string)`가 `?language=` 쿼리만 세팅
- 변경 후: `handleSelect` 조건이 `slave.hasCodeQuestions || slave.hasAiCustomQuestions`. `handleSelectScope(selection: { language?; source? })`로 이름 변경, `language`·`source` 둘 다 있으면 쿼리에 모두 반영 후 이동. `<CodeLanguageModal>` 호출부에 `showLanguage={languageModalSlave?.hasCodeQuestions ?? false}`, `showSource={languageModalSlave?.hasAiCustomQuestions ?? false}` 전달
- 이유: AI 커스텀 카테고리도 모달을 거치도록 확장, CODE 필터 기존 동작은 회귀 없음(showLanguage=true·showSource=false인 경우 기존과 동일한 즉시확정 UI)

#### `app/user/quiz/[categoryId]/page.tsx`
- 변경 전: `language` 쿼리만 읽어 `loadBatch`(3-arg `getQuestions`)에 전달, 헤더에 언어 배지만 표시
- 변경 후: `source` 쿼리 추가 읽기, `loadBatch`가 4-arg `getQuestions(categoryId, 10, language, source)` 호출, `useCallback`/`useEffect` deps에 `source` 추가. 헤더 언어 배지 옆에 출처 배지(source==='AI_CUSTOM'이면 앰버, 아니면 인디고) 조건부 렌더 추가(source 없으면 렌더 안 함). 문항 카드 우상단의 연도/회차·AI 커스텀 배지(414-427행 부근, 문항 실제 데이터 기반)는 건드리지 않음
- 이유: 출처 필터를 실제 API 호출에 반영하고 현재 필터 상태를 사용자에게 시각적으로 안내

#### `CLAUDE.md` / `AGENTS.md`
- 변경 전: `CodeLanguageModal` 행이 `onSelect(language?: string)` 시그니처로 설명됨(AGENTS.md는 행 자체 없음)
- 변경 후: 확장된 props(`showLanguage`/`showSource`)와 `onSelect({ language?, source? })` 시그니처로 갱신, AGENTS.md에는 짧은 한 줄 설명으로 신규 행 추가
- 이유: 공용 컴포넌트 문서 최신화

### 복원 방법
이 ID(HIST-20260710-001)만으로 복원 시: `types/index.ts`에서 `hasAiCustomQuestions` 필드 제거. `quizService.ts`의 `getQuestions`를 3-arg(language만)로 되돌린다. `CodeLanguageModal.tsx`를 HIST-20260707-005 시점(props `{ open, onClose, onSelect: (language?) => void }`, 언어 그리드만, showLanguage/showSource·source 섹션·"시작" 버튼 전부 제거)으로 되돌린다. `page.tsx`의 `handleSelect` 조건에서 `|| slave.hasAiCustomQuestions` 제거, `handleSelectScope`를 `handleSelectLanguage(language?: string)`로 되돌리고 `<CodeLanguageModal>` 호출부에서 `showLanguage`/`showSource` props 제거, `onSelect={handleSelectLanguage}`로 되돌린다. `[categoryId]/page.tsx`에서 `source` 읽기·deps·출처 배지 블록 제거. `CLAUDE.md`/`AGENTS.md`의 `CodeLanguageModal` 행을 HIST-20260707-005 시점 내용으로 되돌린다(AGENTS.md는 행 자체를 삭제).

## HIST-20260707-005

- **날짜**: 2026-07-07
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 — CODE(프로그래밍 언어) 카테고리 언어 필터
- **수정 개요**: 데일리 퀴즈 카테고리 목록에서 `hasCodeQuestions === true`인 카테고리(CODE 유형 문항이 있는 문제 유형)를 클릭하면 즉시 이동하지 않고 신규 `CodeLanguageModal`(Java/Python/C/전체)을 띄워 언어를 고른 뒤 `?language=` 쿼리와 함께 퀴즈 풀이 화면으로 이동한다. 풀이 화면은 이 쿼리를 읽어 `quizService.getQuestions`에 전달해 해당 언어 문항만 받아온다. `hasCodeQuestions`가 false/undefined인 카테고리는 기존과 동일하게 즉시 이동(회귀 없음).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `DomainSlave`에 `hasCodeQuestions?: boolean` 필드 추가 |
| `frontend/src/services/quizService.ts` | 수정 | `getQuestions(categoryId, limit, language?)`로 확장 — language 있을 때만 쿼리 파라미터 전달 |
| `frontend/src/components/ui/CodeLanguageModal.tsx` | 추가 | Java/Python/C/전체 언어 선택 모달(AlertModal 패턴 준용) |
| `frontend/src/app/user/quiz/page.tsx` | 수정 | `handleSelect`에서 `hasCodeQuestions` 카테고리는 모달 오픈으로 분기, `handleSelectLanguage`로 언어 쿼리 포함 이동 |
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | `language` 쿼리 파라미터를 읽어 `loadBatch`(최초 로딩·계속 풀기 공용)에 반영, 헤더에 선택 언어 뱃지 표시 |
| `CLAUDE.md` | 수정 | Shared Utilities 표에 `CodeLanguageModal` 행 추가 |

### 수정 상세

#### `types/index.ts`
- 변경 전: `DomainSlave { id, masterId, name, displayOrder? }`
- 변경 후: `hasCodeQuestions?: boolean` 필드 추가
- 이유: 백엔드 `DomainSlaveResponse.hasCodeQuestions`를 FE 타입에 반영

#### `services/quizService.ts`
- 변경 전: `getQuestions: (categoryId: number, limit = 10) => apiClient.get(..., { params: { categoryId, limit } })`
- 변경 후: `getQuestions: (categoryId: number, limit = 10, language?: string) => apiClient.get(..., { params: { categoryId, limit, ...(language ? { language } : {}) } })`
- 이유: language 미전달 시 기존 요청과 100% 동일한 쿼리스트링 유지(회귀 없음)

#### `components/ui/CodeLanguageModal.tsx` (신규)
- 변경 전: 파일 없음
- 변경 후: `AlertModal.tsx`의 오버레이(`fixed inset-0 z-[9999] bg-black/50`)·ESC 닫기·다크모드 클래스 패턴을 그대로 따르는 모달. `CODE_LANGUAGES`(전체/Java/Python/C) 버튼 그리드, `onSelect(language?: string)` 콜백("전체"는 `undefined`)
- 이유: 신규 공용 컴포넌트

#### `app/user/quiz/page.tsx`
- 변경 전: `handleSelect(slave)`가 무조건 `router.push(/user/quiz/${slave.id}?name=...)`로 즉시 이동
- 변경 후: `slave.hasCodeQuestions`가 true면 `languageModalSlave` state에 저장해 `CodeLanguageModal`을 오픈하고 이동을 보류. 모달에서 언어 선택 시 `handleSelectLanguage`가 `URLSearchParams({ name })`에 `language`(있을 때만) 추가해 이동. 그 외 카테고리는 기존과 동일하게 즉시 이동.
- 이유: CODE 카테고리에서만 언어 선택 단계를 추가하고 나머지는 회귀 없이 유지

#### `app/user/quiz/[categoryId]/page.tsx`
- 변경 전: `const categoryName = searchParams.get('name') ?? '퀴즈';` 이후 language 개념 없음. `loadBatch`는 `quizService.getQuestions(categoryId, 10)` 호출, `useEffect` deps `[categoryId]`.
- 변경 후: `const language = searchParams.get('language') ?? undefined;` 추가. `loadBatch`가 `quizService.getQuestions(categoryId, 10, language)` 호출하도록 변경하고 `useCallback` deps에 `language` 추가, 최초 로딩 `useEffect` deps도 `[categoryId, language]`로 확장(계속 풀기(`handleContinue` → `loadBatch` 재호출)에도 동일 language가 자동 유지됨). 헤더에 `LANGUAGE_LABELS` 매핑 기반 언어 뱃지(`{language && <span>...</span>}`) 추가.
- 이유: 선택한 언어를 풀이 화면·다음 배치 로딩까지 일관되게 유지

### 복원 방법
이 ID(HIST-20260707-005)만으로 복원 시:
1. `types/index.ts`에서 `DomainSlave.hasCodeQuestions?` 필드 제거
2. `quizService.ts`의 `getQuestions`를 `(categoryId: number, limit = 10)` 2-인자 형태로 복원
3. `components/ui/CodeLanguageModal.tsx` 삭제
4. `app/user/quiz/page.tsx`: `languageModalSlave` state·`handleSelectLanguage`·`CodeLanguageModal` 렌더 제거, `handleSelect`를 무조건 즉시 `router.push` 하는 원래 형태로 복원
5. `app/user/quiz/[categoryId]/page.tsx`: `language` 변수·`LANGUAGE_LABELS`·헤더 뱃지 제거, `loadBatch` 호출을 `quizService.getQuestions(categoryId, 10)`로 복원, useEffect/useCallback deps에서 `language` 제거
6. `CLAUDE.md`에서 `CodeLanguageModal` 행 제거

## HIST-20260707-004

- **날짜**: 2026-07-07
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 — 복습 표시 버튼 라벨 문구 수정
- **수정 개요**: 데일리 퀴즈 문제 카드의 복습 표시 버튼에서, 표시된 상태의 라벨 `'복습함'`이 "이미 복습을 완료했다"는 뉘앙스로 오해될 수 있어 실제 의미("나중에 다시 풀 문제로 표시")에 맞게 `'복습 표시됨'`으로 정정. 미표시 상태 라벨(`'복습 표시'`)과 툴팁·토글 동작·앰버 스타일은 변경 없음.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | 복습 표시 버튼 라벨: `bookmarkedIds.has(q.id) ? '복습함' : '복습 표시'` → `bookmarkedIds.has(q.id) ? '복습 표시됨' : '복습 표시'` |

### 수정 상세

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전: `<span>{bookmarkedIds.has(q.id) ? '복습함' : '복습 표시'}</span>` (약 593행)
- 변경 후: `<span>{bookmarkedIds.has(q.id) ? '복습 표시됨' : '복습 표시'}</span>`
- 이유: '복습함'이 "복습을 이미 마쳤다"는 완료 뉘앙스로 읽혀, 실제 기능(나중에 다시 풀 문제로 북마크 표시)과 어긋나는 위화감을 줌.

### 복원 방법
이 ID(HIST-20260707-004)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다.

---

## HIST-20260707-003

- **날짜**: 2026-07-07
- **수정 범위**: 사용자 프론트엔드 / 풀이 스크래치패드 — 이진트리 시각화 "트리" 탭 신규 추가
- **수정 개요**: 풀이 화면 공용 `ScratchPadPanel.tsx`에 레벨오더 배열 표기(`[1, 2, 3, null, 4, 5]`)를 SVG 이진트리로 자동 렌더하는 "트리" 탭을 신규 추가(`BinaryTreeTool.tsx`, LeetCode 표준 BFS 역직렬화 + in-order 좌표 배치, 순수 시각화·채점 없음, 노드 200개 상한). 데일리 퀴즈(`user/quiz/[categoryId]`)도 이 스크래치패드를 공용으로 쓰므로 함께 반영된다. 상세 변경 내역은 [front/usr/UserExamination_Modified.md HIST-20260707-003] 참조.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/BinaryTreeTool.tsx` | 추가 | 레벨오더 배열 표기 → 이진트리 SVG 시각화 컴포넌트 |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정(공용) | `ScratchPadData.treeInput` 추가, `TabKey`에 `'tree'` 추가, 탭 목록·렌더 분기에 "트리" 탭 편입 |
| `CLAUDE.md` | 수정 | Shared Utilities 표에 `BinaryTreeTool` 행 추가 |

### 수정 상세

#### `frontend/src/components/ui/BinaryTreeTool.tsx`
- 변경 전: 파일 없음(신규)
- 변경 후: `parseLevelOrderTree`(BFS 큐 역직렬화, throw 없음, 노드 200개 초과 시 에러) + `computeLayout`(in-order x·깊이 y) + `BinaryTreeTool` 컴포넌트(입력란 + SVG 렌더)
- 이유: 상세 내역은 [front/usr/UserExamination_Modified.md HIST-20260707-003] 참조

#### `frontend/src/components/ui/ScratchPadPanel.tsx`
- 변경 전: `treeInput` 필드·`'tree'` 탭 없음
- 변경 후: `treeInput` 필드 추가, `loadData` 하위호환 폴백, tabs 배열·렌더 분기에 트리 탭 편입
- 이유: 상세 내역은 [front/usr/UserExamination_Modified.md HIST-20260707-003] 참조

### 복원 방법
이 ID(HIST-20260707-003)만으로 복원 시, [front/usr/UserExamination_Modified.md HIST-20260707-003]의 복원 방법과 동일하게 `BinaryTreeTool.tsx`를 삭제하고 `ScratchPadPanel.tsx`의 트리 탭 관련 변경(필드·TabKey·tabs·렌더 분기·import)을 되돌린다.

## HIST-20260707-002

- **날짜**: 2026-07-07
- **수정 범위**: 사용자 프론트엔드 / 풀이 스크래치패드 — 데스크톱 드로어 position:fixed 무력화 버그 수정
- **수정 개요**: ScratchPadPanel 데스크톱 드로어 position:fixed 무력화 버그 수정 — className에서 `relative` 토큰 제거(fixed와 relative 동시 지정 시 relative가 우선 적용되어 드로어가 우측 고정이 아닌 좌측 in-flow로 렌더되던 문제, 브라우저 검증으로 발견). 데일리 퀴즈(`user/quiz/[categoryId]`)도 이 스크래치패드를 공용으로 쓰므로 함께 반영된다. 상세 변경 내역은 [front/usr/UserExamination_Modified.md HIST-20260707-002] 참조.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정(공용) | 데스크톱 드로어 className에서 `relative` 토큰 제거 |

### 수정 상세

#### `frontend/src/components/ui/ScratchPadPanel.tsx`
- 변경 전: 데스크톱 드로어 className에 `fixed`와 `relative`가 동시에 적용되어 있어, 브라우저 검증 결과 실제 computed position이 `relative`로 덮이며 드로어가 페이지 좌측 in-flow 요소로 렌더됨.
- 변경 후: className에서 `relative` 토큰 제거, `fixed`만 남김. 자세한 before/after는 [front/usr/UserExamination_Modified.md HIST-20260707-002] 참조.
- 이유: `fixed`+`relative` 동시 지정으로 인한 position 무력화 버그 수정.

### 복원 방법
이 ID(HIST-20260707-002)만으로 복원 시 [front/usr/UserExamination_Modified.md HIST-20260707-002]의 "수정 상세"를 그대로 적용해 `ScratchPadPanel.tsx`를 원복한다(className 끝에 `relative` 재추가).

## HIST-20260707-001

- **날짜**: 2026-07-07
- **수정 범위**: 사용자 프론트엔드 / 풀이 스크래치패드 — 데스크톱 드로어 폭 리사이즈 + z-index 수정
- **수정 개요**: 시험·퀴즈 풀이 화면 공용 `ScratchPadPanel.tsx`의 데스크톱(lg↑) 우측 드로어에 왼쪽 가장자리 드래그 리사이즈를 추가해 고정 `w-80`(320px)을 300~720px(뷰포트의 90% 상한) 범위에서 자유롭게 넓힐 수 있게 했다. 최종 폭은 `localStorage`(`tpmp:scratchpad:panel-width`)에 저장되어 다음 오픈 시에도 유지된다. 동시에 드로어의 `z-40`이 레이아웃 헤더의 로그아웃/네비 드롭다운(동일 `z-40`)을 DOM 순서상 덮어 클릭이 막히던 버그를 `z-30`으로 낮춰 해결했다. 데일리 퀴즈(`user/quiz/[categoryId]`)에서도 이 스크래치패드가 공용으로 쓰이므로 함께 반영된다. 상세 변경 내역은 [front/usr/UserExamination_Modified.md HIST-20260707-001] 참조.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정(공용) | 데스크톱 드로어 폭 드래그 리사이즈(localStorage 영속) 추가 + 드로어 `z-40`→`z-30` 수정 |

### 수정 상세

#### `frontend/src/components/ui/ScratchPadPanel.tsx`
- 변경 전: 데스크톱 드로어가 `w-80` 고정 폭(리사이즈 불가)이었고, `z-40`으로 인해 레이아웃 헤더의 로그아웃/네비 드롭다운이 가려 클릭되지 않았음.
- 변경 후: `panelWidth` state(localStorage 키 `tpmp:scratchpad:panel-width`, 기본 320px, 300~720px clamp)와 왼쪽 가장자리 드래그 리사이즈 핸들(`handleResizeMouseDown`/`Move`/`Up`)을 추가하고, 드로어 `z-40`을 `z-30`으로 낮춤. 자세한 코드 스니펫은 [front/usr/UserExamination_Modified.md HIST-20260707-001] 참조.
- 이유: 좁은 고정 폭 개선 + 헤더 드롭다운 클릭 불가 버그 수정.

### 복원 방법
이 ID(HIST-20260707-001)만으로 복원 시 [front/usr/UserExamination_Modified.md HIST-20260707-001]의 "수정 상세"를 그대로 적용해 `ScratchPadPanel.tsx`를 원복한다(리사이즈 관련 코드 전체 제거 + 드로어 `z-40`·`w-80` 복원).

## HIST-20260706-009

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 플레이 — 발문(지시문) 강조 표시
- **수정 개요**: 문제 카드에서 발문(예: "다음 설명을 보고 알맞은 용어를 작성하시오.")이 있는 문항은 문항 내용(RichContent) 위에 굵은 글씨로 발문을 먼저 보여주고, 그 아래 본문(content)은 보조 톤(`text-gray-700 dark:text-gray-300`)으로 낮춰 발문=강조·본문=설명의 시각적 위계를 만들었다. 발문이 없는 문항은 기존과 동일하게 렌더링된다. 이번 파일(`page.tsx`)의 이전 미커밋 변경(채점완화+다크모드 보정)은 건드리지 않고 발문 관련 부분만 추가했다. 백엔드/타입 반영은 [back/adm/QuestionBank_Modified.md HIST-20260706-003], [front/adm/AdminQuestion_Modified.md HIST-20260706-004] 참조.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | 문제 카드에서 `RichContent` 렌더 위에 `q.instruction` 강조 문단 추가, `RichContent`의 className을 발문 유무에 따라 조건부(발문 있으면 보조 톤, 없으면 기존 강조 톤)로 변경 |
| `frontend/src/services/quizService.ts` | 수정 | `QuizQuestion` 인터페이스에 `instruction?: string` 추가 |

### 수정 상세

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전: `<RichContent html={q.content} className="text-gray-800 font-medium text-base pr-24" />` — 발문 개념 없이 본문만 강조 톤으로 렌더.
- 변경 후: `RichContent` 위에 `{q.instruction && <p className="text-gray-900 dark:text-gray-100 font-semibold text-base leading-snug whitespace-pre-wrap pr-24">{q.instruction}</p>}` 추가. `RichContent`의 className을 `q.instruction`이 있으면 `'text-gray-700 dark:text-gray-300 font-normal'`(보조 톤), 없으면 기존 `'text-gray-800 font-medium'`(강조 톤)로 분기(공통 `'text-base pr-24'`는 유지).
- 이유: 발문(지시문)과 본문(설명)을 시각적으로 명확히 구분하기 위함 — 발문이 있을 때는 발문이 1차 강조 요소가 되고 본문은 보조 설명으로 내려간다. 다크모드 대비를 위해 `dark:` variant를 포함했다.

#### `frontend/src/services/quizService.ts`
- 변경 전: `QuizQuestion`에 `instruction` 필드 없음.
- 변경 후: `content` 다음에 `instruction?: string` 추가.
- 이유: 백엔드 `QuizQuestionView.instruction`을 프론트 타입에 반영해 퀴즈 화면에서 사용.

### 복원 방법
이 ID(HIST-20260706-009)만으로 복원 시: `page.tsx`에서 발문 강조 `<p>` 블록을 제거하고 `RichContent`의 className을 `"text-gray-800 font-medium text-base pr-24"` 고정값으로 되돌리며, `quizService.ts`의 `QuizQuestion.instruction?` 필드를 제거한다.

## HIST-20260706-008

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 플레이 — 다크모드 가시성 보정 (`dark:` 클래스 부재 지점 보완)
- **수정 개요**: 퀴즈 플레이 화면(`page.tsx`)의 라운드 완료 결과 카드(점수 배지·정답 개수·세션 누계 텍스트)와 문항별 결과 피드백 박스(정답/오답 배경·레이블·정답값·해설)에 `dark:` variant를 추가해 다크모드에서도 배경·텍스트 대비가 확보되도록 보정했다. 라이트 모드 스타일·마크업 구조는 변경 없음. 공용 컴포넌트 `ExamResultDisplay.tsx`(결과 화면 아코디언·집계 카드 등 전반)와 `CodeAnswerInput.tsx`(CODE 유형 입력창)도 함께 다크모드 보정되었으며, 두 컴포넌트는 시험 응시 화면(`exam/[id]`, `user/exam-history`)과 공용이라 상세는 [front/usr/UserExamination_Modified.md HIST-20260706-008] 참조.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/quiz/[categoryId]/page.tsx` | 수정 | 라운드 완료 카드·결과 피드백 박스에 `dark:` 클래스 추가 |
| `frontend/src/components/ui/ExamResultDisplay.tsx` | 수정(공용) | 아코디언·집계 카드·필터탭·객관식/코드/단답 답안 표시·해설 박스 전반에 `dark:` 클래스 추가 — 상세는 `UserExamination_Modified.md` HIST-20260706-008 참조 |
| `frontend/src/components/ui/CodeAnswerInput.tsx` | 수정(공용) | textarea 배경·글자색·테두리·placeholder에 `dark:` 클래스 추가 — 상세는 동일 참조 |

### 수정 상세

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전: 라운드 완료 카드(`bg-green-50/yellow-50/red-50`, `text-green-700` 등)와 결과 피드백 박스(`bg-green-50 border-green-200`, `text-green-700`/`text-red-700`, `text-gray-700`/`text-gray-600` 등)에 `dark:` 클래스 전무 — 다크모드에서 밝은 배경 위 밝은 글자로 가독성 저하.
- 변경 후: 배경은 `dark:bg-{color}-900/30`, 배지 배경은 `dark:bg-{color}-900/50`, 텍스트는 `dark:text-{color}-300`, 보조 회색 텍스트는 `dark:text-gray-300/400/500` 계열로 보정.
- 이유: 다크모드에서 결과 피드백을 확실히 읽을 수 있도록.

#### `frontend/src/components/ui/ExamResultDisplay.tsx`
- 변경 전: 전체 컴포넌트(배경·카드·아코디언·객관식 선택지·CODE/단답 답안·해설 박스)에 `dark:` 클래스 전무.
- 변경 후: 페이지 배경(`dark:bg-gray-900`), 카드/박스(`dark:bg-gray-800`, `dark:border-gray-700`), 필터 탭 비활성 상태, 정답/오답 배지·선택지·내 답/정답 텍스트(`dark:text-green-300`/`dark:text-red-300` 등), 해설 박스, 하단 sticky 액션 바까지 `dark:` 계열 보정.
- 이유: 시험 응시(`exam/[id]`)·퀴즈·시험 이력 조회 3개 화면에서 공용으로 쓰이는 컴포넌트라 한 곳만 고쳐도 전체 반영됨.

#### `frontend/src/components/ui/CodeAnswerInput.tsx`
- 변경 전: textarea에 배경·글자색 미지정(브라우저 기본값 사용) + 테두리 `border-gray-300` 고정 → 다크모드에서 밝은 배경에 입력 텍스트가 잘 안 보이는 문제.
- 변경 후: `dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:placeholder-gray-500 dark:disabled:bg-gray-900`, 안내 문구 `dark:text-gray-500` 추가. CodeBlock(정답/코드 표시, Darcula 다크 고정)은 변경하지 않음 — 이번 보정은 입력 컴포넌트 한정.
- 이유: CODE 유형 문항 풀이 시 다크모드에서 입력 텍스트 가독성 확보.

### 복원 방법
이 ID(HIST-20260706-008)만으로 복원 시: 위 3개 파일에서 이번에 추가된 `dark:` 클래스 문자열만 제거(라이트 모드 클래스는 그대로 유지). 공용 파일(`ExamResultDisplay.tsx`, `CodeAnswerInput.tsx`) 복원 시 `UserExamination_Modified.md` HIST-20260706-008과 함께 되돌려야 한다.

## HIST-20260706-007

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 플레이 — 풀이 스크래치패드에 "페이지 부재(페이지 교체)" 풀이 도구 탭 신설(항상 노출, 채점·자동계산 없음)
- **수정 개요**: 공용 컴포넌트(`ScratchPadPanel.tsx`)에 신규 `PageReplacementTool.tsx`(참조열/프레임 수로 표 골격만 생성, FIFO/LRU/Optimal 자동 계산·채점 없음, 부재 토글은 사용자 직접 입력 집계)가 계산기처럼 항상 노출되는 탭으로 추가됨. 상세는 시험 응시 화면(`UserExamination_Modified.md` HIST-20260706-007) 참조 — 신규 로직은 두 화면 공용이며 퀴즈 화면(`frontend/src/app/user/quiz/[categoryId]/page.tsx`) 자체 코드는 변경 없음.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/PageReplacementTool.tsx` | 추가(공용) | 페이지 부재 풀이 도구 컴포넌트 신설 — 상세는 `UserExamination_Modified.md` HIST-20260706-007 참조 |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정(공용) | `ScratchPadData`에 `pageReplacement` 필드 추가, 탭 배열/렌더 분기 확장 — 상세는 동일 참조 |
| `CLAUDE.md` | 수정 | Shared Utilities 표 갱신(중복 기록 아님, 시험 응시 히스토리와 동일 항목) |

### 수정 상세
공용 파일(`PageReplacementTool.tsx` 신규, `ScratchPadPanel.tsx` 수정)의 상세는 `UserExamination_Modified.md`의 HIST-20260706-007 항목을 참조. 이 화면 자체 코드(`frontend/src/app/user/quiz/[categoryId]/page.tsx`)는 변경되지 않았다.

### 복원 방법
이 ID(HIST-20260706-007)만으로 복원 시: 공용 파일 복원은 `UserExamination_Modified.md` HIST-20260706-007의 "복원 방법"을 따른다(동일 파일을 사용하므로 시험 응시 화면과 함께 되돌려야 함). 이 화면 자체는 변경된 파일이 없어 추가 조치 불필요.

## HIST-20260706-006

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 플레이 — 풀이 스크래치패드 코드 트레이싱 프리뷰에서 `=` 없이 수식만 적은 줄(이름 없는 수식)도 자동 계산
- **수정 개요**: 공용 파서(`traceNotation.ts`)가 `av / len`처럼 `이름 =` 대입 없이 수식만 적은 줄도, 사칙연산자 최소 1개 포함 + 화이트리스트 통과 + 참조 식별자가 named 변수 픽스포인트 종료 후 최종 env에 전부 존재하는 조건에서 자동 계산해 이름 없는 `ExprLine`(`TracePreview`의 `ExprRow`)으로 표시하도록 확장됨. 상세는 시험 응시 화면(`UserExamination_Modified.md` HIST-20260706-006) 참조 — 신규 로직은 두 화면 공용이며 퀴즈 화면(`frontend/src/app/user/quiz/[categoryId]/page.tsx`) 자체 코드는 변경 없음.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/traceNotation.ts` | 수정(공용) | `ExprLine`/`ExprCandidateInfo`/`HAS_OPERATOR_PATTERN` 추가, 이름 없는 수식 후보 분류 및 최종 픽스포인트 이후 1회 평가 로직 추가 — 상세는 `UserExamination_Modified.md` HIST-20260706-006 참조 |
| `frontend/src/components/ui/TracePreview.tsx` | 수정(공용) | `ExprRow` 컴포넌트 및 `case 'expr'` 추가 — 상세는 동일 참조 |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정(공용) | 안내 문구에 `av / len` 예시 추가 — 상세는 동일 참조 |
| `CLAUDE.md` | 수정 | Shared Utilities 표 갱신(중복 기록 아님, 시험 응시 히스토리와 동일 항목) |

### 수정 상세
공용 파일(`traceNotation.ts`, `TracePreview.tsx`, `ScratchPadPanel.tsx`)의 변경 전/후 상세는 `UserExamination_Modified.md`의 HIST-20260706-006 항목을 참조. 이 화면 자체 코드(`frontend/src/app/user/quiz/[categoryId]/page.tsx`)는 변경되지 않았다.

### 복원 방법
이 ID(HIST-20260706-006)만으로 복원 시: 공용 파일 복원은 `UserExamination_Modified.md` HIST-20260706-006의 "복원 방법"을 따른다(동일 파일을 사용하므로 시험 응시 화면과 함께 되돌려야 함). 이 화면 자체는 변경된 파일이 없어 추가 조치 불필요.

## HIST-20260706-005

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 플레이 — 풀이 스크래치패드 코드 트레이싱 프리뷰 변수 참조 수식 계산을 두 방향으로 확장(리터럴 수식 계산, 순서 무관 변수 참조)
- **수정 개요**: 공용 파서(`traceNotation.ts`)가 리터럴 수식(`av = 10 / 4` → 2.5, 날짜·전화번호·버전형 압축 나열은 가드로 계산 제외)과 순서 무관 변수 참조(`avg = av/len` 앞에 `av`, `len`이 나중에 정의돼도 계산)를 픽스포인트 다중 패스로 지원하도록 확장됨. 상세는 시험 응시 화면(`UserExamination_Modified.md` HIST-20260706-005) 참조 — 신규 로직은 두 화면 공용이며 퀴즈 화면(`frontend/src/app/user/quiz/[categoryId]/page.tsx`) 자체 코드는 변경 없음.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/traceNotation.ts` | 수정(공용) | `classifyLine` 기반 픽스포인트 다중 패스 해석 도입, `tryEvaluateFormula`가 식별자 0개 리터럴 수식도 처리(날짜/버전/전화번호 가드 포함) — 상세는 `UserExamination_Modified.md` HIST-20260706-005 참조 |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정(공용) | 안내 문구를 "정의 순서 무관·리터럴 수식 자동 계산"으로 갱신 — 상세는 동일 참조 |
| `CLAUDE.md` | 수정 | Shared Utilities 표 갱신(중복 기록 아님, 시험 응시 히스토리와 동일 항목) |

### 수정 상세
공용 파일(`traceNotation.ts`, `ScratchPadPanel.tsx`)의 변경 전/후 상세는 `UserExamination_Modified.md`의 HIST-20260706-005 항목을 참조. 이 화면 자체 코드(`frontend/src/app/user/quiz/[categoryId]/page.tsx`)는 변경되지 않았다.

### 복원 방법
이 ID(HIST-20260706-005)만으로 복원 시: 공용 파일 복원은 `UserExamination_Modified.md` HIST-20260706-005의 "복원 방법"을 따른다(동일 파일을 사용하므로 시험 응시 화면과 함께 되돌려야 함). 이 화면 자체는 변경된 파일이 없어 추가 조치 불필요.

## HIST-20260706-004

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 플레이 — 풀이 스크래치패드 코드 트레이싱 프리뷰에 변수 참조 수식 자동 계산 추가
- **수정 개요**: 위→아래 순회하며 누적되는 숫자 변수 환경(Map)을 이용해 `avg = sum / len`처럼 이미 정의된 숫자 변수를 참조하는 사칙연산 수식을 기존 안전 계산기(`evaluateExpression`, eval/Function 미사용)로 자동 계산하고, 결과를 환경에 등록해 다음 줄에서 재참조 가능. 미정의 참조·계산 오류·비수식은 기존과 동일하게 문자열로 안전 폴백(회귀 없음). 상세는 시험 응시 화면(`UserExamination_Modified.md` HIST-20260706-004) 참조 — 신규 로직/컴포넌트는 두 화면 공용이며 퀴즈 화면(`frontend/src/app/user/quiz/[categoryId]/page.tsx`) 자체 코드는 변경 없음.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/traceNotation.ts` | 수정(공용) | `VarLine.sourceExpr` 필드, `tryEvaluateFormula`/`formatComputedNumber` 등 수식 자동 계산 로직 추가 — 상세는 `UserExamination_Modified.md` HIST-20260706-004 참조 |
| `frontend/src/components/ui/TracePreview.tsx` | 수정(공용) | `VarRow`가 계산된 라인을 `이름 = 수식 = 결과`로 렌더 — 상세는 동일 참조 |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정(공용) | 안내 문구·placeholder에 `avg = sum / len` 예시 추가 — 상세는 동일 참조 |
| `CLAUDE.md` | 수정 | Shared Utilities 표 갱신(중복 기록 아님, 시험 응시 히스토리와 동일 항목) |

### 수정 상세

#### `frontend/src/lib/traceNotation.ts` / `frontend/src/components/ui/TracePreview.tsx` / `frontend/src/components/ui/ScratchPadPanel.tsx`
- 상세는 `docs/history/front/usr/UserExamination_Modified.md`의 HIST-20260706-004 참조(두 화면 공용 수정 파일, `frontend/src/app/user/quiz/[categoryId]/page.tsx` 자체는 변경 없음 — `ScratchPadPanel`을 그대로 재사용)

### 복원 방법
이 ID(HIST-20260706-004)는 별도 복원 작업이 없다(퀴즈 화면 자체 코드는 변경되지 않음). 공용 수정 파일의 복원은 `UserExamination_Modified.md`의 HIST-20260706-004 복원 방법을 따르되, 양쪽 화면이 공용으로 사용 중이므로 시험 응시 화면도 함께 되돌리지 않는 한 파일을 삭제하지 말 것.

## HIST-20260706-003

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 플레이 — 풀이 스크래치패드 코드 트레이싱 프리뷰에 타입 배지(자동추론 + 표기법 오버라이드) 추가
- **수정 개요**: `name: type = value` 타입 명시 표기법 + 값 기반 자동 타입 추론(`number`/`boolean`/`null`/`undefined`/`string`, 배열은 `number[]`/`string[]`/`number[][]`/`string[][]`/`array`)을 지원하고, 프리뷰에 explicit/inferred 구분 타입 배지를 추가. 실행/eval 전혀 없음. 상세는 시험 응시 화면(`UserExamination_Modified.md` HIST-20260706-003) 참조 — 신규 로직/컴포넌트는 두 화면 공용이며 퀴즈 화면(`frontend/src/app/user/quiz/[categoryId]/page.tsx`) 자체 코드는 변경 없음.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/traceNotation.ts` | 수정(공용) | 명시 타입 캡처 정규식, `TypeSource`, `typeLabel`/`typeSource` 필드, 자동 추론 함수 3종 추가 — 상세는 `UserExamination_Modified.md` HIST-20260706-003 참조 |
| `frontend/src/components/ui/TracePreview.tsx` | 수정(공용) | `TypeBadge` 컴포넌트 추가, 각 Row에 타입 배지 렌더 — 상세는 동일 참조 |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정(공용) | 안내 문구·placeholder에 `x: long = 3` 예시 추가 — 상세는 동일 참조 |
| `CLAUDE.md` | 수정 | Shared Utilities 표 갱신(중복 기록 아님, 시험 응시 히스토리와 동일 항목) |

### 수정 상세

#### `frontend/src/lib/traceNotation.ts` / `frontend/src/components/ui/TracePreview.tsx` / `frontend/src/components/ui/ScratchPadPanel.tsx`
- 상세는 `docs/history/front/usr/UserExamination_Modified.md`의 HIST-20260706-003 참조(두 화면 공용 수정 파일, `frontend/src/app/user/quiz/[categoryId]/page.tsx` 자체는 변경 없음 — `ScratchPadPanel`을 그대로 재사용)

### 복원 방법
이 ID(HIST-20260706-003)는 별도 복원 작업이 없다(퀴즈 화면 자체 코드는 변경되지 않음). 공용 수정 파일의 복원은 `UserExamination_Modified.md`의 HIST-20260706-003 복원 방법을 따르되, 양쪽 화면이 공용으로 사용 중이므로 시험 응시 화면도 함께 되돌리지 않는 한 파일을 삭제하지 말 것.

## HIST-20260706-002

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 플레이 — 풀이 스크래치패드 코드 트레이싱 탭 "타이핑→자동 렌더"로 교체
- **수정 개요**: 클릭식 블록 위젯(`TraceBlocks.tsx`의 `TraceBlockEditor`)을 제거하고 표기법 타이핑→자동 렌더 프리뷰(`TracePreview`)로 교체. 실행/eval 전혀 없음, 기존 로컬 저장분은 표기법 텍스트로 1회 이관되어 손실 없음. 상세는 시험 응시 화면(`UserExamination_Modified.md` HIST-20260706-002) 참조 — 신규/삭제 파일은 두 화면 공용이며 퀴즈 화면(`frontend/src/app/user/quiz/[categoryId]/page.tsx`) 자체 코드는 변경 없음.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/traceNotation.ts` | 추가(신규, 공용) | 표기법 순수 파서 `parseTraceLines`/`TraceLine` + 레거시 이관 함수 — 상세는 `UserExamination_Modified.md` HIST-20260706-002 참조 |
| `frontend/src/components/ui/TracePreview.tsx` | 추가(신규, 공용) | `<TracePreview lines />` 읽기 전용 프리뷰 — 상세는 동일 참조 |
| `frontend/src/components/ui/TraceBlocks.tsx` | 삭제(공용) | 클릭식 블록 에디터 전체 제거 — 상세는 동일 참조 |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정(공용) | 코드 트레이싱 탭을 표기법 textarea + 자동 렌더 프리뷰 2단 구성으로 교체, `traceBlocks`는 레거시 이관 전용으로 축소 — 상세는 동일 참조 |
| `CLAUDE.md` | 수정 | Shared Utilities 표 갱신(중복 기록 아님, 시험 응시 히스토리와 동일 항목) |

### 수정 상세

#### `frontend/src/lib/traceNotation.ts` / `frontend/src/components/ui/TracePreview.tsx` / `frontend/src/components/ui/TraceBlocks.tsx` / `frontend/src/components/ui/ScratchPadPanel.tsx`
- 상세는 `docs/history/front/usr/UserExamination_Modified.md`의 HIST-20260706-002 참조(두 화면 공용 신규/삭제/수정 파일, `frontend/src/app/user/quiz/[categoryId]/page.tsx` 자체는 변경 없음 — `ScratchPadPanel`을 그대로 재사용)

### 복원 방법
이 ID(HIST-20260706-002)는 별도 복원 작업이 없다(퀴즈 화면 자체 코드는 변경되지 않음). 신규/삭제/수정 파일의 복원은 `UserExamination_Modified.md`의 HIST-20260706-002 복원 방법을 따르되, 양쪽 화면이 공용으로 사용 중이므로 시험 응시 화면도 함께 되돌리지 않는 한 파일을 삭제하지 말 것.

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
