## HIST-20260826-001

- **날짜**: 2026-08-26
- **수정 범위**: 사용자 프론트엔드 / 공용 시험 결과 테스트 안정화
- **수정 개요**: 병렬 Jest worker 경합에서 초기 북마크 조회 상태 반영이 Testing Library 기본 1초를 넘겨 간헐적으로 실패하던 테스트 한 곳에만 5초 대기 한도를 적용했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/ExamResultDisplay.test.tsx` | 수정 | 초기 `복습 표시됨` 버튼 조회의 `findByRole` timeout을 5초로 한정 |

### 수정 상세

- 변경 전: 즉시 resolve mock을 사용해도 병렬 전체 테스트의 worker 경합 시 해당 버튼 상태 반영이 기본 1초를 넘으면 실패했다.
- 변경 후: 실패가 재현된 111행의 `findByRole`에만 `{ timeout: 5000 }`을 전달했다. production 코드와 다른 테스트 timeout은 변경하지 않았다.
- 이유: 단독 18/18 및 전체 `--runInBand` 68/68 통과로 기능 로직은 정상이며, 병렬 실행에서만 발생하는 렌더링 지연을 해당 비동기 assertion 범위에서 흡수한다.

### 검증 결과

- `npx jest src/components/ui/ExamResultDisplay.test.tsx --runInBand` 통과 (18/18).
- `npm test -- --watch=false` 병렬 전체 통과 (13 suite, 68/68).

### 복원 방법

이 ID를 복원할 때 `ExamResultDisplay.test.tsx` 111행 `findByRole`의 세 번째 인자 `{ timeout: 5000 }`만 제거해 기본 timeout으로 되돌린다.

## HIST-20260723-002

- **날짜**: 2026-07-23
- **수정 범위**: 사용자 프론트엔드 / 시험 목록 (`/user/exams`) — 모바일 필터 바 접이식(collapsible) 개편
- **수정 개요**: 모바일 뷰포트(390×844)에서 검색 input 1개 + select 4개가 전부 세로로 쌓여 필터 바가 화면 상단 상당 부분을 차지하던 문제를 해결했다. 모바일 기본 상태는 검색 input과 "필터" 토글 버튼(활성 필터 개수 배지 포함)만 노출하고, 토글을 누르면 select 4개가 2×2 그리드로 펼쳐지는 구조로 변경했다. `sm:` 이상(1440px 실측 확인)에서는 `sm:flex sm:flex-row sm:gap-3`로 강제 오버라이드되어 토글 상태와 무관하게 기존 한 줄 레이아웃을 그대로 유지한다. 필터 상태(`searchTitle`/`filterCategory`/`filterYear`/`filterRound`/`filterAiCustom`)와 `filteredExams` 계산 로직은 변경하지 않았고, 배지 표시용 `activeFilterCount` 파생값만 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/app/user/exams/page.tsx | 수정 | `filterExpanded` 로컬 상태, `activeFilterCount` 파생값 추가. 필터 바 마크업을 (검색 input + 모바일 전용 필터 토글 버튼) / (select 4개 래퍼: 모바일은 접힘·2×2 그리드, `sm:` 이상은 기존 flex-row 강제 유지)로 재구성 |

### 수정 상세

#### `frontend/src/app/user/exams/page.tsx`
- 변경 전: `<div className="... flex flex-col sm:flex-row gap-3">` 아래 검색 input과 select 4개가 형제 요소로 나열되어, 모바일에서 5개 요소가 전부 세로로 풀 너비 스택됨
- 변경 후: 검색 input과 "필터" 토글 버튼(`sm:hidden`, `activeFilterCount > 0`일 때 배지 표시)을 한 줄 래퍼(`flex gap-2 sm:flex-1`)로 묶고, select 4개는 별도 래퍼(`filterExpanded ? 'grid grid-cols-2' : 'hidden'` + `sm:flex sm:flex-row sm:gap-3`)로 묶어 모바일에서는 토글로 펼침/접힘, `sm:` 이상에서는 항상 기존과 동일한 한 줄 레이아웃이 되도록 구성. 각 select에 `w-full sm:w-auto` 추가(모바일 그리드 셀 채움, 데스크톱은 기존처럼 auto 너비)
- 이유: 모바일에서 필터 바가 과도한 세로 공간을 차지해 실제 시험 목록을 보려면 큰 스크롤이 필요했던 UX 문제 해결. 접이식 구조로 기본 노출 영역을 최소화하면서 데스크톱 레이아웃은 완전히 보존

### 검증 근거
- `npx tsc --noEmit` 통과(에러 없음)
- chrome-devtools MCP 브라우저 확인(user@tpmp.com 로그인):
  - 390×844: 필터 바가 검색 input + "필터" 버튼 한 줄로 축소되어 목록이 즉시 노출됨(기존 대비 세로 공간 대폭 감소)
  - "필터" 토글 클릭 → select 4개가 2×2 그리드로 펼쳐짐(선택형 유형/연도/회차/전체)
  - 연도 필터를 "2025년"으로 선택 → 새로고침 없이 목록이 6건→3건으로 즉시 재필터링됨, 토글 버튼에 배지 "1" 표시 확인
  - 1440px로 리사이즈 → 토글 버튼 미노출, 검색 input + select 4개가 기존과 동일한 한 줄 레이아웃으로 표시되어 회귀 없음 확인

### 복원 방법
이 ID(HIST-20260723-002)만으로 복원 시 `frontend/src/app/user/exams/page.tsx`에서 `filterExpanded` 상태 선언과 `activeFilterCount` 파생값을 제거하고, 필터 바 마크업을 원래의 단일 `<div className="... flex flex-col sm:flex-row gap-3">` 아래 검색 input + select 4개가 형제로 나열된 구조로 되돌린다(각 select의 `w-full sm:w-auto` 클래스도 제거).

## HIST-20260723-001

- **날짜**: 2026-07-23
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 (`/exam/[id]`) — 모바일 FAB·"다음" 버튼 겹침 수정
- **수정 개요**: `ScratchPadPanel`(풀이 스크래치패드) FAB가 모바일 뷰포트(390×844)에서 `fixed bottom-5`(20px) 고정 위치라, 시험 응시 화면에서 스크롤해 마주하는 문제 카드 하단 "다음" 버튼과 겹쳐 클릭이 막히는 버그를 수정했다. `ScratchPadPanel`에 FAB 하단 오프셋을 페이지별로 override할 수 있는 `fabBottomClassName` prop을 추가하고, 이 화면에서는 실측 기반으로 `bottom-24 lg:bottom-5`를 전달했다. 데스크톱(`lg` 이상)은 기존 위치(20px)를 그대로 유지한다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/components/ui/ScratchPadPanel.tsx | 수정 | `fabBottomClassName?: string`(기본값 `'bottom-5'`) prop 추가, FAB `className`의 하드코딩된 `bottom-5`를 이 prop으로 대체(`/user/concepts/[id]`, `/user/concepts/explore/[id]`는 prop 미전달로 기존 동작 그대로 유지) |
| frontend/src/app/exam/[id]/page.tsx | 수정 | `<ScratchPadPanel>` 호출에 `fabBottomClassName="bottom-24 lg:bottom-5"` 전달 |

### 수정 상세

#### `frontend/src/components/ui/ScratchPadPanel.tsx`
- 변경 전: FAB `className`이 `` `fixed bottom-5 right-5 z-40 ...` ``로 하드코딩되어 페이지별 조정 불가
- 변경 후: `fabBottomClassName = 'bottom-5'` prop을 추가하고 `` `fixed ${fabBottomClassName} right-5 z-40 ...` ``로 대체. 나머지(`right-5`, `z-40` 등)는 그대로 유지
- 이유: 여러 페이지에서 공용으로 쓰이는 컴포넌트라 페이지별 하단 고정 버튼과의 충돌을 해당 페이지에서만 개별적으로 회피할 수 있어야 함

#### `frontend/src/app/exam/[id]/page.tsx`
- 변경 전: `<ScratchPadPanel storageKey={...} isCodeQuestion={isCode} />` (fabBottomClassName 미전달 → 기본값 `bottom-5`)
- 변경 후: `<ScratchPadPanel storageKey={...} isCodeQuestion={isCode} fabBottomClassName="bottom-24 lg:bottom-5" />`
- 실측 근거(chrome-devtools MCP, 390×844 뷰포트, `/exam/20` 실제 시험 응시 화면, 문제 카드 최하단까지 스크롤): 기존 `bottom-5`일 때 FAB `top≈776px / bottom≈824px`(48px 높이), 같은 시점 "다음" 버튼 `top≈761px / bottom≈803px` — 두 사각형이 `top 776~803` 구간에서 겹침 확인. `bottom-24`(96px)로 변경 후 FAB `top≈700px / bottom≈748px`이 되어 "다음" 버튼 top(761px)까지 13px 여유가 생겨 겹침이 완전히 해소됨을 브라우저에서 스크린샷으로 재확인
- 이유: 모바일에서 FAB가 시험 응시의 핵심 조작 버튼("다음")을 가려 클릭을 막는 버그 수정

### 복원 방법
이 ID(HIST-20260723-001)만으로 복원 시 `frontend/src/components/ui/ScratchPadPanel.tsx`에서 `fabBottomClassName` prop과 FAB `className`의 템플릿 치환을 되돌리고(다시 `bottom-5` 하드코딩), `frontend/src/app/exam/[id]/page.tsx`의 `<ScratchPadPanel>` 호출에서 `fabBottomClassName="bottom-24 lg:bottom-5"`를 제거한다. 단, `/user/quiz/[categoryId]/page.tsx`도 같은 prop을 쓰므로 `docs/history/front/usr/DailyQuiz_Modified.md`의 HIST-20260723-001도 함께 복원해야 컴포넌트 prop 정의가 일관된다.

## HIST-20260722-001

- **날짜**: 2026-07-22
- **수정 범위**: 사용자 프론트엔드 / 시험 목록 (`/user/exams`) — AI 커스텀 안내 문구 추가
- **수정 개요**: DB에서 AI 커스텀 시험 6개의 제목을 실제 시험 회차 표기에서 사이트 자체 회차("TPMP 모의고사 N회")로 변경한 것에 맞춰(백엔드 히스토리 HIST-20260722-002 참고), 프론트에서는 `isAiCustom`인 시험이 실제 기출문제가 아니라 AI가 새로 구성한 모의고사임을 알리는 고정 안내 문구를 카드 목록 배지 툴팁과 시험 시작 팝업 두 곳에 추가했다. DB 컬럼 신설 없이 프론트 하드코딩 텍스트로 처리(전 시험 동일 문구).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/app/user/exams/page.tsx | 수정 | 카드 목록 "AI 커스텀" 배지에 `title` 툴팁 속성 추가, 시험 시작 팝업 제목 옆에 배지 추가 + `selectedExam.isAiCustom`이면 안내 문구 박스 추가 |

### 수정 상세

#### `frontend/src/app/user/exams/page.tsx`
- 변경 전: 카드 목록 "AI 커스텀" 배지는 텍스트만 표시(툴팁 없음). 시험 시작 팝업은 제목만 표시하고 AI 커스텀 여부·안내 문구가 전혀 없었음
- 변경 후: 카드 목록 배지에 `title="정보처리기사 실기 시험의 출제 범위와 최신 출제 경향을 참고하여 AI가 새로 구성한 모의고사입니다. 실제 기출문제를 사용하지 않았습니다."` 툴팁 추가. 시험 시작 팝업 제목(`<h3>`) 옆에 카드 목록과 동일한 "AI 커스텀" 배지 추가, `selectedExam.isAiCustom`이면 정보 박스(bg-indigo-50)에 동일 안내 문구 표시(기존 "브라우저를 닫으면 초기화됩니다" 경고 박스 위)
- 이유: 실제 국가기술자격 시험 회차 제목을 사이트 자체 회차로 바꾸면서, 저작권 문제가 없는 AI 생성 콘텐츠임을 사용자에게 명확히 알리기 위함. 제목 자체에는 "AI" 단어를 넣지 않고 배지+안내 문구로만 표시하기로 결정(제목은 "TPMP 모의고사 N회"로 깔끔하게 유지)

### 복원 방법
이 ID(HIST-20260722-001)만으로 복원 시 `frontend/src/app/user/exams/page.tsx`에서 카드 목록 배지의 `title` 속성, 시험 시작 팝업 제목 옆 배지, `selectedExam.isAiCustom` 안내 문구 박스를 제거한다.

## HIST-20260721-001

- **날짜**: 2026-07-21
- **수정 범위**: 사용자 프론트엔드 / 시험 목록 (`/user/exams`) — 년도·회차·AI 커스텀 필터 추가
- **수정 개요**: 시험 목록 화면 필터 바에 연도·회차·AI 커스텀 여부 select 3개를 추가하고, 기존 `filteredExams` 조건에 해당 필터를 반영했다. 연도·회차 옵션은 추가 API 호출 없이 이미 로드된 `allExams` 배열에서 파생한다. 카드 목록에는 `isAiCustom`인 시험에 작은 "AI 커스텀" 배지를 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/app/user/exams/page.tsx | 수정 | filterYear/filterRound/filterAiCustom state, 파생 옵션, 필터 조건, select 3개, AI 커스텀 배지 추가 |
| frontend/src/types/index.ts | 수정 | Examination 인터페이스에 examYear?/examRound?/isAiCustom 추가 (관리자 프론트 히스토리 HIST-20260721-001과 동일 파일) |

### 수정 상세

#### `frontend/src/app/user/exams/page.tsx`
- 변경 전: `searchTitle`/`filterCategory` 2개 필터만 존재, `filteredExams`는 title·category·관심유형 조건만 검사
- 변경 후: `filterYear`(string, 기본 'ALL')/`filterRound`(string, 기본 'ALL')/`filterAiCustom`('ALL'|'ORIGINAL'|'AI_CUSTOM', 기본 'ALL') state 추가. `yearOptions`/`roundOptions`를 `allExams`에서 `Array.from(new Set(...))` 후 내림차순 정렬로 파생. `filteredExams` 콜백에 yearMatch/roundMatch/aiCustomMatch 조건 추가(examYear/examRound가 null인 레코드는 특정 값 선택 시 자연히 제외됨). 필터 바에 select 3개 추가, 각 변경 시 `resetPage()` 호출. "(필터 적용)" 표시 조건에 3개 필터도 포함. 카드 목록의 시험 제목 옆에 `exam.isAiCustom`이면 "AI 커스텀" 배지(indigo 톤, 기존 카드 스타일에 맞춤) 추가
- 이유: 년도·회차·AI 커스텀 여부로 시험을 필터링할 수 있어야 한다는 요구사항. 신규 API 없이 기존 로드된 데이터에서 옵션을 파생해 비용 절감

### 복원 방법
이 ID(HIST-20260721-001)만으로 복원 시 `frontend/src/app/user/exams/page.tsx`에서 filterYear/filterRound/filterAiCustom state, yearOptions/roundOptions 파생, filteredExams의 yearMatch/roundMatch/aiCustomMatch 조건, 필터 바 select 3개, "(필터 적용)" 조건 확장분, AI 커스텀 배지를 제거한다.

## HIST-20260718-003

- **날짜**: 2026-07-18
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 화면 키보드 단축키
- **수정 개요**: 시험 응시 화면(`exam/[id]/page.tsx`)에 Alt 조합 키보드 단축키(이전·다음 문항 이동, 시험 제출)를 추가하고, 버튼 title 속성과 데스크톱 전용 힌트 텍스트로 단축키 정보를 노출했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `frontend/src/app/exam/[id]/page.tsx` | 수정 | Alt+←/→/Enter 키보드 단축키 effect 추가, 관련 버튼 title·힌트 텍스트 추가 |

### 수정 상세

#### `frontend/src/app/exam/[id]/page.tsx`
- 변경 전: 이전/다음 문항 이동과 시험 제출은 오직 버튼 클릭으로만 가능했다. 관련 단축키·안내 문구가 없었다.
- 변경 후:
  - `submitFnRef` 갱신 effect(264~266줄) 바로 뒤에 새 `useEffect`를 추가해 `window`에 `keydown` 리스너를 등록했다. `e.altKey && e.key === 'ArrowLeft'`이면 `e.preventDefault()` 후 `setCurrent(c => Math.max(0, c - 1))`, `e.altKey && e.key === 'ArrowRight'`이면 `e.preventDefault()` 후 `setCurrent(c => Math.min(questions.length - 1, c + 1))`, `e.altKey && e.key === 'Enter'`이면 `submitFnRef.current?.(false)`(최신 클로저 참조로 stale closure 방지, 내부적으로 flagged 알림·confirm 창이 이미 있어 오제출 방지됨)를 호출한다.
  - 단축키 활성 가드: `loading`, `result`, `pendingResult`, `!exam` 중 하나라도 해당하거나 `leaveConfirm`/`flagAlert`/`noteTarget` 모달이 열려 있으면 `shortcutsActive`가 false가 되어 리스너를 아예 등록하지 않는다. effect cleanup에서 `removeEventListener`로 항상 해제한다.
  - "이전"/"다음" 버튼에 각각 `title="이전 문항 (Alt+←)"`/`title="다음 문항 (Alt+→)"`를 추가하고, 그 버튼 묶음 바로 아래에 데스크톱 전용(`hidden sm:block`) 힌트 `text-xs text-gray-400` 텍스트 "Alt+← 이전 · Alt+→ 다음 · Alt+Enter 제출"을 추가했다. 이 화면은 기존에 다크모드 클래스를 쓰지 않으므로 새로 도입하지 않았다.
  - 데스크톱 사이드바 "시험 제출" 버튼과 모바일 바텀시트 "시험 제출" 버튼 둘 다 `title="시험 제출 (Alt+Enter)"`를 추가했다.
- 이유: 사용자가 Alt 조합 키보드 단축키를 명시적으로 요청했다. 기존 버튼 클릭·타이머·모달·시험 제출 흐름(플래그 알림·confirm 오제출 방지 포함)은 전혀 변경하지 않고 순수 추가로만 구현했다.

### 복원 방법
이 ID(HIST-20260718-003)만으로 복원 시, `frontend/src/app/exam/[id]/page.tsx`에서 위에서 추가한 Alt 단축키 `useEffect` 블록 전체, "이전"/"다음" 버튼의 `title` 속성 2개, 버튼 묶음 아래 힌트 `<p>` 태그, 데스크톱·모바일 "시험 제출" 버튼의 `title` 속성 2개를 모두 제거한다.

---

## HIST-20260718-002

- **날짜**: 2026-07-18
- **수정 범위**: 사용자 프론트엔드 / 시험 결과 CODE 문항 표시
- **수정 개요**: 시험 완료 결과 화면(제출 직후 + 이력 재조회 공용)의 펼침 내용에서 CODE 유형 문항의 문제 코드(지문 코드)가 렌더링되지 않던 문제를 고쳤다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `frontend/src/components/ui/ExamResultDisplay.tsx` | 수정 | 펼침 내용의 문항 본문 뒤에 `item.code` 코드 블록 추가 |
| `frontend/src/components/ui/ExamResultDisplay.test.tsx` | 수정 | CodeBlock mock을 code 텍스트 렌더로 교체, 문제 코드 표시/미표시 회귀 테스트 추가 |

### 수정 상세

#### `frontend/src/components/ui/ExamResultDisplay.tsx`
- 변경 전: 백엔드 `QuestionResultResponse`와 프론트 `QuestionResult` 타입에는 `code`/`language` 필드가 이미 채워져 있었지만, 펼침 내용 렌더링에서 `item.content`, `item.schedulingData`, `item.sqlData`만 그리고 `item.code`를 렌더링하는 코드가 없어 CODE 유형 문항의 지문 코드가 결과 화면에서 보이지 않았다(468~472줄 근방, `내 답`의 CodeBlock은 사용자 답안이며 문제 코드가 아님).
- 변경 후: `<RichContent html={item.content} .../>` 직후 `<SchedulingProblemTable>`/`<SqlProblemView>` 이전에 `{item.code && (<CodeBlock code={item.code} language={item.language} size="xs" />)}`를 추가했다. `QuestionDetailModal.tsx`의 문제 코드 표시 컨벤션과 동일하게 `showHeader`를 지정하지 않아 기본값(헤더=언어 배지 표시)을 사용하며, 아래쪽 답안용 CodeBlock(`showHeader={false}`)과 시각적으로 구분된다. CODE 유형 여부로 별도 분기하지 않고 `item.code` 존재 여부만으로 조건부 렌더링해 다른 유형은 자연히 노출되지 않는다.
- 이유: 사용자가 채점 대상 코드가 무엇이었는지 결과 화면에서 확인할 수 없는 버그를 해결하기 위함. 데이터는 이미 정상 흐름이었고 순수 렌더링 누락이었다.

#### `frontend/src/components/ui/ExamResultDisplay.test.tsx`
- 변경 전: `jest.mock('@/components/ui/CodeBlock', ...)`가 `CodeBlock: () => null`로 항상 null을 렌더링해 코드 블록 표시 여부를 테스트로 검증할 수 없었다.
- 변경 후: mock을 `CodeBlock: ({ code }) => <div data-testid="problem-code">{code}</div>`로 교체하고, "CODE 유형 문항의 문제 코드를 펼침 내용에 표시한다"(아코디언 펼침 후 `problem-code` 텍스트 노출 확인)와 "문제 코드가 없으면 코드 블록을 렌더링하지 않는다"(펼침 후에도 `problem-code` 미노출 확인) 두 케이스를 추가했다.
- 이유: 렌더링 누락 회귀를 방지하기 위한 최소 테스트 커버리지 확보.

### 복원 방법
이 ID(HIST-20260718-002)만으로 복원 시, `ExamResultDisplay.tsx`에서 추가한 `{item.code && (<CodeBlock .../>)}` 블록을 제거하고, `ExamResultDisplay.test.tsx`의 `CodeBlock` mock을 `() => null`로 되돌리며 위 두 회귀 테스트 케이스를 삭제한다.

---

## HIST-20260718-001

- **날짜**: 2026-07-18
- **수정 범위**: 사용자 프론트엔드 / 시험 결과 복습 표시
- **수정 개요**: 시험 제출 직후와 과거 이력의 공용 결과 아코디언에서 문제은행 원본이 있는 문항을 복습 표시하거나 해제할 수 있게 했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `frontend/src/types/index.ts` | 수정 | 결과 문항의 nullable `questionBankId` 타입 추가 |
| `frontend/src/components/ui/ExamResultDisplay.tsx` | 수정 | 초기 북마크 조회, ID별 토글·오류 재시도, 앰버 별 버튼 UI |
| `frontend/src/components/ui/ExamResultDisplay.test.tsx` | 수정 | 초기 상태·토글·중복·실패·nullable·공유 상태 회귀 테스트 |
| `frontend/src/data/tableComments.ts` | 수정 | 이력 문제은행 ID 스냅샷 설명 추가 |

### 수정 상세

- 결과에 non-null `questionBankId`가 있을 때만 북마크 ID 목록을 조회하고, 결과 변경·언마운트 중 늦게 도착한 이전 목록 응답은 반영하지 않는다.
- 목록 로딩 또는 조회 실패로 상태가 확인되지 않은 동안 모든 복습 버튼을 비활성화한다. 조회 실패는 빈 별을 미등록으로 간주하지 않고 상단 `다시 시도`로만 복구한다.
- 문제은행 ID별 pending 집합을 결과 전환과 무관하게 완료까지 유지해 중복 요청을 차단한다. 토글 성공과 목록 조회의 경합은 ID별 변경 버전으로 조정하며, 새 결과에도 같은 ID가 있으면 서버의 최종 `bookmarked` 상태를 반영한다.
- 현재 결과 ID ref는 렌더 중이 아니라 브라우저·JSDOM의 layout effect(SSR은 일반 effect)에서 갱신해 커밋되지 않은 렌더의 ID가 비동기 응답 판단에 사용되지 않게 했다. 언마운트 시 mounted/visible ref를 커밋 cleanup에서 즉시 정리한다.
- 회귀 테스트는 언마운트 뒤 목록·토글 promise의 resolve/reject, 토글 성공 뒤 도착한 stale 목록, 현재 결과 밖 ID 필터링을 직접 검증한다. 결과 밖 ID의 다음 결과 전환 테스트는 두 번째 조회를 deferred로 두고 응답 전 로딩 상태에서도 활성 테마·채워진 별이 노출되지 않는지 확인한다.
- 복습 버튼과 아코디언 토글을 형제 버튼으로 구성해 복습 표시 클릭이 문항을 펼치지 않는다. 모바일에서도 상태 텍스트를 항상 표시하고 원본 ID가 없는 문항에는 버튼과 API 호출을 생략한다.

---

## HIST-20260717-007

- **날짜**: 2026-07-17
- **수정 범위**: 사용자 프론트엔드 / 시험 결과 문항 제목 미리보기
- **수정 개요**: 결과 아코디언의 접힌 헤더가 제출 시점 제목을 우선 표시하고 legacy 이력은 발문·본문으로 안전하게 폴백한다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `frontend/src/types/index.ts` | 수정 | `QuestionResult.title` nullable 선택 필드 추가 |
| `frontend/src/components/ui/ExamResultDisplay.tsx` | 수정 | 제목 → 발문 → 본문 → 기본 문구 4단계 미리보기 |
| `frontend/src/components/ui/ExamResultDisplay.test.tsx` | 추가 | 우선순위·trim·HTML 제거 회귀 테스트 |
| `frontend/src/data/tableComments.ts` | 수정 | 이력 제목 스냅샷 컬럼 설명 추가 |

### 수정 상세

- 제목은 trim 후 사용하고, 발문·본문 fallback은 `stripHtml`을 거쳐 HTML 태그 없이 표시한다.
- 펼친 상태의 기존 발문·본문 렌더링은 변경하지 않았다.

---

## HIST-20260717-006

- **날짜**: 2026-07-17
- **수정 범위**: 사용자 프론트엔드 / 풀이 스크래치패드 다중 트리
- **수정 개요**: 트리 시각화 탭에서 여러 이진트리를 독립적으로 추가·입력·삭제하고 기존 단일 트리 저장값을 안전하게 이관하도록 개선했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정 | 다중 트리 상태·영속화·마이그레이션 및 추가/삭제 UI |
| `frontend/src/components/ui/ScratchPadPanel.test.tsx` | 추가 | 초기값·독립 입력·삭제·최대 개수·legacy 이관 회귀 테스트 |

### 수정 상세

- `treeInputs: string[]`와 같은 인덱스의 안정 ID 배열을 저장해 트리별 입력과 React key를 보존한다.
- 구형 `treeInput`은 `treeInputs`가 없을 때만 첫 트리로 이관하며, 손상 원소·중복 ID·빈 배열은 최소 1개/최대 20개 규칙에 맞춰 정규화한다.
- 트리 추가 버튼과 항목별 삭제 버튼에 접근 가능한 이름을 제공하고, 마지막 트리 삭제 및 20개 초과 추가를 비활성화하면서 사유를 안내한다.
- 기존 `BinaryTreeTool`은 수정하지 않고 트리 항목마다 재사용한다.

---

## HIST-20260717-005

- **날짜**: 2026-07-17
- **수정 범위**: 사용자 프론트엔드 / SQL 결과 답안 복원 테스트 타입 보완
- **수정 개요**: Jest 런타임은 통과하지만 TypeScript가 전역 `jest` 값과 jest-dom 확장 matcher 타입을 찾지 못하던 테스트를 프로젝트 설정에 맞게 수정했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `frontend/src/components/ui/SqlResultAnswerInput.test.tsx` | 수정 | `@jest/globals` 명시 import 및 기본 Jest DOM null assertion 사용 |

### 수정 상세

- 전역 Jest 설정은 확장하지 않고 `expect`·`jest`를 명시적으로 가져왔다.
- jest-dom 전용 matcher를 기본 `toBeNull`/`not.toBeNull`로 교체해 tsc와 Jest 양쪽 타입 계약을 만족시켰다.

---

## HIST-20260717-004

- **날짜**: 2026-07-17
- **수정 범위**: 사용자 프론트엔드 / SQL 결과 답안 복원
- **수정 개요**: SQL 결과 입력 그리드가 저장된 value를 버리던 문제를 수정해 문항 전환·재마운트·외부 답안 변경 시 행렬을 안전하게 복원한다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `frontend/src/components/ui/SqlResultAnswerInput.tsx` | 수정 | value 역직렬화와 무루프 외부 상태 동기화 |
| `frontend/src/lib/sql.ts` | 수정 | SQL 답안 grid serialize/deserialize 공용 함수 추가 |
| `frontend/src/lib/sql.test.ts` | 수정 | round-trip·손상 값 폴백 테스트 |
| `frontend/src/components/ui/SqlResultAnswerInput.test.tsx` | 추가 | 문항 전환 재마운트 답안 복원 테스트 |

### 수정 상세

- 컬럼 수가 정확히 맞는 직렬화 값만 복원하고 빈 값·손상 값은 빈 1행으로 폴백한다.
- 부모 value를 반영할 때 `onChange`를 호출하지 않아 stale 상태와 무한 갱신 루프를 방지한다.

---

## HIST-20260717-003

- **날짜**: 2026-07-17
- **수정 범위**: 사용자 프론트엔드 / SCHEDULING·SQL 시험 응시·결과 표시
- **수정 개요**: 시험 화면에 구조화 스케줄링 표와 SQL 테이블을 렌더하고 SQL 기대 결과 문항에는 결과 입력 그리드를 제공한다. 결과 화면도 동일 구조를 재현한다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `frontend/src/app/exam/[id]/page.tsx` | 수정 | 구조화 문제 표시와 SQL 결과 입력 |
| `frontend/src/components/ui/ExamResultDisplay.tsx` | 수정 | 구조화 문제 결과 재현 |
| `frontend/src/services/examService.ts` 외 | 수정 | schedulingData/sqlData/sqlResultColumns 타입 전달 |

### 수정 상세

- 기존 공용 `SchedulingProblemTable`, `SqlProblemView`, `SqlResultAnswerInput`을 재사용했다.
- 이유: 문제은행과 시험 응시 화면 사이의 유형별 UX 및 답안 직렬화 계약을 일치시키기 위함.

---

## HIST-20260717-002

- **날짜**: 2026-07-17
- **수정 범위**: 사용자 프론트엔드 / 시험 응시·결과 — 발문 스냅샷 표시
- **수정 개요**: 시험 응시 화면과 제출 직후/과거 이력 공용 결과 화면에서 문항 본문 앞에 `instruction`을 `RichContent`로 렌더한다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|---|---|---|
| `frontend/src/app/exam/[id]/page.tsx` | 수정 | 응시 문항 발문 RichContent 표시, 세션 시작 후 상세 조회 순서 보장 |
| `frontend/src/components/ui/ExamResultDisplay.tsx` | 수정 | 결과 상세 발문 RichContent 표시 |
| `frontend/src/types/index.ts` | 수정 | Question/QuestionResult instruction 타입 추가 |

### 수정 상세

- 변경 전: QuestionBank에는 발문이 있어도 시험 응시와 결과 화면에는 본문만 표시됐다.
- 변경 후: 시험지 및 제출 시점 스냅샷의 발문을 본문과 분리해 안전한 공용 HTML 렌더러로 표시한다. 초기 실제 응시는 `최근 결과 확인 → startExam → 상세 조회`, 재응시는 `startExam(reset=true) → 상세 재조회` 순서를 보장해 세션 잠금 전 stale 문항을 읽지 않는다.
- 이유: 원본 문항의 풀이 지시를 응시와 과거 결과에서 동일하게 보존하기 위함.

### 복원 방법

이 ID(`UserExamination_Modified.md` 기준 HIST-20260717-002)로 복원 시 두 화면의 instruction 렌더와 관련 FE 타입을 제거한다.

---

## HIST-20260717-001

- **날짜**: 2026-07-17
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 풀이 스크래치패드 — 코드 트레이싱 배열 프리뷰 파싱 보정
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
- 이유: 시험 응시 화면의 공용 스크래치패드 프리뷰에서 구조를 포함한 배열 메모가 데이터 손실 없이 표시되고, 잘못 닫힌 입력은 안전하게 원문 보존되도록 하기 위함.

#### `frontend/src/lib/traceNotation.test.ts`
- 변경 전: `traceNotation` 전용 단위 테스트가 없어 배열 구분 경계와 malformed 폴백의 회귀를 자동 검증하지 못했다.
- 변경 후: 사용자 재현 입력이 3개 원자 셀로 유지되는지, 문자열 내부 쉼표·이스케이프와 중첩 중괄호·소괄호를 보존하는지, 빈 배열이 빈 1D 배열로 유지되는지, 불균형 그룹·바깥 대괄호 중복/누락 입력이 text로 폴백하는지, 기존 1D/2D 배열 동작이 유지되는지를 검증하는 Jest 테스트를 추가했다.
- 이유: 동일 결함 재발과 기존 배열 렌더 회귀를 방지하기 위함.

### 복원 방법

이 ID(`UserExamination_Modified.md` 기준 HIST-20260717-001)로 복원 시 `traceNotation.ts`의 상태 기반 `parseBracketGroup`을 기존 대괄호 깊이 전용 `findMatchingBracketEnd`·`splitTopLevel` 구현으로 되돌리고 `traceNotation.test.ts`를 제거한다.

---

## HIST-20260710-005

- **날짜**: 2026-07-10
- **수정 범위**: 사용자 프론트엔드 / 풀이 스크래치패드 — 계산기 진수 변환(2·8·16진수) 표시 확장
- **수정 개요**: HIST-20260710-004에서 추가한 스크래치패드 계산기의 비트 문맥 전용 `bin32`/`hex32` 보조 표시를 "정수 결과면 항상 2·8·16진수를 함께 보여주는" 진수 변환기로 확장했다. `safeMathCalc.BitwiseFormats`에 `octal` 필드를 추가하고, `evaluateExpression`의 표시 조건을 "비트 문맥 && 정수"에서 "0 이상의 안전한 정수(`Number.isSafeInteger`)는 항상 포함, 음수 정수는 비트 문맥일 때만 32비트 2의 보수로 포함"으로 변경했다(예: `172`, `86+86` 같은 순수 사칙연산 정수 결과도 이제 2·8·16진수를 함께 보여준다). 일반 산술의 음수 결과(`3-10=-7`)는 2의 보수 표기가 혼란을 줄 수 있어 계속 제외한다. 계산기 결과/기록 표시를 `bin32`/`hex32` → `bin`/`oct`/`hex`로 단순화하고, 계산기 탭에 사용법 안내 문구를 추가했다. eval/Function은 계속 사용하지 않는다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/safeMathCalc.ts` | 수정 | `BitwiseFormats`에 `octal` 필드 추가, `formatBitwise`가 8진 문자열도 생성(음수는 11자리 2의 보수 패딩), `evaluateExpression`의 진수 표시 조건을 "0 이상 안전한 정수는 항상 포함, 음수 정수는 비트 문맥일 때만 포함"으로 변경 + JSDoc 갱신 |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정 | 계산기 결과 표시·`formatCalcValue`(기록 포맷)에 `oct` 추가(`bin32`/`hex32` → `bin`/`oct`/`hex`로 라벨 단순화), 계산기 탭 상단에 진수 변환 사용법 안내 문구 추가 |
| `CLAUDE.md` | 수정 | `evaluateExpression` 설명을 "정수 결과 2·8·16진수 자동 표시" 조건(0 이상 항상 포함/음수는 비트 문맥에서만/안전 정수 범위)으로 갱신 |
| `AGENTS.md` | 수정 | 동일하게 `evaluateExpression` 설명 갱신 |

### 수정 상세

#### `frontend/src/lib/safeMathCalc.ts`
- 변경 전: `BitwiseFormats = { binary, hex }`. `evaluateExpression`은 `BIT_CONTEXT_PATTERN.test(trimmed) && Number.isInteger(value)`일 때만 bitwise를 반환(순수 사칙연산 정수 결과는 진수 표시 없음).
- 변경 후: `BitwiseFormats = { binary, octal, hex }`. `formatBitwise`가 8진 문자열도 함께 생성한다(음수는 `(value >>> 0).toString(8)`을 11자리로 패딩해 32비트 2의 보수 표현). `evaluateExpression`은 `Number.isSafeInteger(value) && (value >= 0 || BIT_CONTEXT_PATTERN.test(trimmed))`일 때 bitwise를 반환 — 0 이상 정수는 항상, 음수 정수는 비트 문맥일 때만 포함하고 안전하지 않은 정수(`MAX_SAFE_INTEGER` 초과)는 항상 제외한다.
- 이유: 사용자가 `172`처럼 일반 사칙연산 결과도 진수 변환으로 바로 확인하고 싶어 함. 단 음수의 2의 보수 표기는 비트 연산 맥락이 아니면 오해를 줄 수 있어 그대로 유지.

#### `frontend/src/components/ui/ScratchPadPanel.tsx`
- 변경 전: 계산기 결과는 비트 문맥일 때만 `bin32 0b… · hex32 0x…`로 표시, 기록도 동일 포맷. 계산기 탭에 사용법 안내 문구 없음(입력창 placeholder만 존재).
- 변경 후: 결과/기록 표시를 `bin 0b… · oct 0o… · hex 0x…`로 확장(값이 32비트 문맥이 아니어도 라벨은 동일하게 단순화, 비트 문맥 음수만 32비트 2의 보수 값이 채워짐). 계산기 탭 입력창 위에 `172` 또는 `0b1010` 입력 예시와 함께 "2·8·16진수 동시 표시" 안내 문구를 추가했다.
- 이유: 확장된 표시 조건을 실제 UI에 반영하고 사용자가 새 동작을 바로 알 수 있도록 안내.

### 검증
- 스모크 테스트(`npx tsc src/lib/safeMathCalc.ts --outDir <scratchpad>/smoke2 --module nodenext --target es2020 --moduleResolution nodenext` 트랜스파일 후 node 실행):
  - `172` → `{"value":172,"bitwise":{"binary":"0b10101100","octal":"0o254","hex":"0xAC"}}`
  - `86+86` → `{"value":172,"bitwise":{"binary":"0b10101100","octal":"0o254","hex":"0xAC"}}`
  - `10/4` → `{"value":2.5}` (진수 표시 없음)
  - `3-10` → `{"value":-7}` (진수 표시 없음, 비트 문맥 아님)
  - `~5` → `{"value":-6,"bitwise":{"binary":"0b11111111111111111111111111111010","octal":"0o37777777772","hex":"0xFFFFFFFA"}}`
  - `0xFF ^ 0x0F` → `{"value":240,"bitwise":{"binary":"0b11110000","octal":"0o360","hex":"0xF0"}}`
- `cd frontend; npx tsc --noEmit` 통과(오류 없음).

### 복원 방법
이 ID(HIST-20260710-005)만으로 복원 시: `safeMathCalc.ts`의 `BitwiseFormats`에서 `octal` 필드를 제거하고 `formatBitwise`의 8진 생성 로직을 삭제하며, `evaluateExpression`의 표시 조건을 HIST-20260710-004 시점의 `BIT_CONTEXT_PATTERN.test(trimmed) && Number.isInteger(value)`로 되돌린다. `ScratchPadPanel.tsx`에서 계산기 안내 문구를 제거하고 결과/기록 표시를 `bin32`/`hex32` 2종으로 되돌린다(`oct` 표시 삭제). `CLAUDE.md`/`AGENTS.md`의 `evaluateExpression` 설명도 HIST-20260710-004 시점 문구로 되돌린다.

## HIST-20260710-004

- **날짜**: 2026-07-10
- **수정 범위**: 사용자 프론트엔드 / 풀이 스크래치패드 — 코드 트레이싱·계산기 비트 계산 지원
- **수정 개요**: 풀이 스크래치패드의 공용 안전 계산 엔진 `safeMathCalc.evaluateExpression`을 산술 전용에서 산술+비트 수식 계산기로 확장했다. `0b`/`0o`/`0x` 숫자 리터럴과 `&`, `|`, `^`, `~`, `<<`, `>>`, `>>>`를 지원하며, 비트 연산은 JavaScript/Java 계열과 동일한 32비트 정수 기준으로 계산한다. 계산기 탭은 비트 문맥 결과에 decimal 값과 함께 `bin32`/`hex32`를 표시하고, 최근 계산 기록에도 2진/16진 보조값을 저장한다. 코드 트레이싱 탭은 기존 `avg = sum / len` 방식과 동일한 픽스포인트 수식 계산 경로에서 `mask = 0b1010 & 0b0110`, `mask << 1` 같은 비트 수식을 자동 계산할 수 있도록 `traceNotation`의 화이트리스트·식별자 매칭·숫자 리터럴 처리를 보정했다. eval/Function은 계속 사용하지 않는다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/safeMathCalc.ts` | 수정 | 2진/8진/16진 리터럴 토큰화, 비트 연산자 파싱(`& \| ^ ~ << >> >>>`), 32비트 정수 변환, 비트 문맥 결과용 `bitwise.binary`/`bitwise.hex` 반환 추가 |
| `frontend/src/lib/traceNotation.ts` | 수정 | `0b`/`0o`/`0x` 리터럴을 숫자로 인식, env 등록 시 진법 변환, 수식 화이트리스트와 연산자 가드에 비트 연산자 추가, 식별자 정규식을 단어 경계 기반으로 보정해 `0b1010`의 `b1010` 오인 방지 |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정 | 코드 트레이싱 안내·placeholder에 비트 계산 예시 추가, 계산기 placeholder 갱신, 비트 결과 표시(`bin32`/`hex32`)와 최근 계산 기록 포맷 확장 |
| `CLAUDE.md` | 수정 | Shared Utilities 표의 `evaluateExpression`, `parseTraceLines` 설명을 산술·비트 수식 지원 기준으로 갱신 |
| `AGENTS.md` | 수정 | Shared Utilities 표에 스크래치패드·안전 계산기·코드 트레이싱 파서/프리뷰 설명 추가 |

### 수정 상세

#### `frontend/src/lib/safeMathCalc.ts`
- 변경 전: 10진 숫자와 `+ - * / % ** ( )`만 허용하는 산술 계산기.
- 변경 후: 자체 토큰화 단계에서 `0b1010`, `0o12`, `0xA`를 숫자 토큰으로 처리한다. 파서 우선순위를 `bitOr → bitXor → bitAnd → shift → additive → term → unary → power → primary`로 확장해 일반 언어의 비트 연산 우선순위에 맞췄다. `&`, `|`, `^`, `~`, `<<`, `>>`는 signed 32-bit, `>>>`는 unsigned right shift 결과로 계산한다. 비트 리터럴/연산자가 포함된 정수 결과는 `{ value, bitwise: { binary, hex } }`를 반환한다.
- 이유: 계산기와 코드 트레이싱이 같은 안전 계산 엔진을 쓰므로, 엔진 한 곳을 확장해야 두 영역의 동작이 일관된다.

#### `frontend/src/lib/traceNotation.ts`
- 변경 전: 자동 수식 계산의 숫자 리터럴은 10진 정수/실수만 env에 등록했고, 수식 화이트리스트는 사칙연산자 중심이었다.
- 변경 후: `isNumericLiteral`이 `0b`/`0o`/`0x`를 숫자로 인정하고 `parseNumericLiteral`로 env에는 실제 number 값을 저장한다. 수식 후보 화이트리스트와 연산자 가드는 비트 연산자를 포함한다. `IDENTIFIER_PATTERN`은 `\b[A-Za-z_]\w*\b`로 바꿔 `0b1010` 내부의 `b1010`을 변수명으로 잘못 치환하지 않는다.
- 이유: `mask = 0b1010` 같은 리터럴 정의가 이후 `mask & 3`, `mask << 1`에서 정상 참조되도록 하기 위함.

#### `frontend/src/components/ui/ScratchPadPanel.tsx`
- 변경 전: 계산기 결과는 decimal 값만 표시·기록했고, 예시는 사칙연산 중심이었다.
- 변경 후: 계산기 입력 예시를 `(0b1010 & 0b0110) << 1`로 갱신하고, 비트 문맥 결과는 `= 4` 아래 `bin32 0b100 · hex32 0x4` 형태로 표시한다. `formatCalcValue`가 최근 계산 기록에도 같은 보조 표시를 남긴다. 코드 트레이싱 textarea 안내/placeholder에는 `mask = 0b1010 & 0b0110`, `mask << 1` 예시를 추가했다.

### 검증
- `cd frontend; npx.cmd tsc --noEmit` 통과.
- 별도 `node -e` 기반 계산 엔진 스모크 테스트는 현재 PowerShell 샌드박스에서 `node`/`C:\Program Files\nodejs\node.exe` 실행 경로가 인식되지 않아 수행하지 못했다. 타입체크는 통과했고, 런타임 계산은 `safeMathCalc`의 기존 eval 없는 파서 경로 안에서만 확장됐다.

### 복원 방법
이 ID(HIST-20260710-004)만으로 복원 시: `safeMathCalc.ts`에서 `BitwiseFormats`, 진법 리터럴 토큰화, 비트 연산 파서 단계(`parseBitwiseOr`/`parseBitwiseXor`/`parseBitwiseAnd`/`parseShift`), 단항 `~`, `bitwise` 반환을 제거하고 기존 사칙연산 파서로 되돌린다. `traceNotation.ts`의 `BINARY_PATTERN`/`OCTAL_PATTERN`/`HEX_PATTERN`/`parseNumericLiteral`, 비트 연산자 화이트리스트·가드, 단어 경계 식별자 정규식 변경을 되돌린다. `ScratchPadPanel.tsx`의 `formatCalcValue`, 비트 예시 문구, 계산기 placeholder, `bin32`/`hex32` 렌더를 제거하고 decimal 단일 표시로 복원한다. `CLAUDE.md`와 `AGENTS.md`의 Shared Utilities 설명도 사칙연산 기준으로 되돌린다.

## HIST-20260710-003

- **날짜**: 2026-07-10
- **수정 범위**: 사용자 프론트엔드 / 풀이 스크래치패드 — 스케줄링 탭 간트 셀 색상이 다크모드에서 보이지 않는 버그 수정
- **수정 개요**: 사용자 신고 "같은 이름을 적은 칸이 같은 색으로 묶여 보이지 않는다" 원인 분석 결과, `globals.css:121`의 다크모드 전역 폼 규칙 `.dark input:not([type='checkbox']):not([type='radio']):not([type='range']):not([type='submit']):not([type='button'])`이 `:not([attr])` 다중 선택자로 특이도가 높아(≈0-6-1) 간트 셀의 Tailwind 다크 유틸리티(`dark:bg-indigo-500/20` 등, ≈0-2-0)를 덮어써 **다크모드에서 모든 셀 배경이 전역 `#374151` 회색으로 강제**되고 있었다(라이트모드는 정상). 컴파일된 CSS에 팔레트 클래스가 존재함을 확인했으므로 빌드/JIT 문제가 아닌 순수 CSS 특이도 문제. `GANTT_COLOR_PALETTE`의 다크 변형(bg/text/border)에 Tailwind `!`(important) 수식을 적용해 전역 규칙을 이기도록 수정했다. 추가로 `hashLabelToColorClass`가 대소문자를 구분해 `P1`/`p1`이 다른 색이 되던 것을 `toLowerCase()` 정규화로 같은 색으로 묶이게 보정했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/SchedulingSolveTool.tsx` | 수정 | `GANTT_COLOR_PALETTE` 다크 변형 10종에 `dark:!bg-*`/`dark:!text-*`/`dark:!border-*` important 적용(+사유 주석), `hashLabelToColorClass` 소문자 정규화 |

### 검증
- `npx tsc --noEmit` 통과. dev 서버 컴파일 CSS에서 `background-color: rgb(99 102 241 / 0.2) !important` 생성 확인.

### 복원 방법
이 ID(HIST-20260710-003)만으로 복원 시 팔레트의 `!` 수식을 제거하고 해시의 `.toLowerCase()`를 삭제한다. 단, 되돌리면 다크모드에서 색상이 다시 보이지 않는다.

## HIST-20260710-002

- **날짜**: 2026-07-10
- **수정 범위**: 사용자 프론트엔드 / 풀이 스크래치패드 — 손입력 간트 차트 CPU 스케줄링 풀이 도구 "스케줄링" 탭 신규 추가
- **수정 개요**: 풀이 화면 공용 `ScratchPadPanel.tsx`(시험 응시 `exam/[id]` · 데일리 퀴즈 `user/quiz/[categoryId]` 공용)에 기존 페이지 부재 도구와 동일한 철학(자동 계산 시뮬레이터가 아닌 골격 생성 + 손입력)의 "스케줄링" 탭을 신규 추가했다. 신규 컴포넌트 `SchedulingSolveTool.tsx`는 프로세스 표(이름/도착시간/실행시간/우선순위, 최대 10행)와 총 시간(0~60, 실행시간 합 제안 버튼 제공) 입력으로 간트 차트 타임 슬롯 골격만 생성하고, 슬롯 값(프로세스명)·완료/반환/대기시간은 전부 사용자가 손으로 입력한다. FIFO/SJF/RR/Priority 등 알고리즘 자동 계산·채점은 하지 않으며, 유일한 자동 계산은 결과 표 하단의 반환/대기시간 평균(입력된 숫자만 대상 산술 평균, 소수 둘째 자리)이다. 간트 셀은 입력 텍스트를 해시해 팔레트 색상으로 시각 구분하되(표시 보조), 자동 계산이 아니다. `ScratchPadData`에 `scheduling: SchedulingSolveData` 필드를 추가했고, 구버전 저장분(필드 없음)은 `loadData`의 타입가드(`isSchedulingSolveData`)에서 `EMPTY_SCHEDULING_SOLVE_DATA`로 폴백해 하위호환을 유지한다. 문항 등록/표시용 `SchedulingProblemEditor`/`SchedulingProblemTable`(관리자 SCHEDULING 유형 구조화 문항)과는 목적이 다른 별개 컴포넌트다. FE 전용이며 BE/DB 연동 없음.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/SchedulingSolveTool.tsx` | 추가 | 손입력 간트 차트 스케줄링 풀이 도구(`SchedulingSolveData`, `EMPTY_SCHEDULING_SOLVE_DATA`, `isSchedulingSolveData`, `SchedulingSolveTool`) — 프로세스 표 추가/삭제, 총 시간 입력(실행시간 합 제안), 간트 차트 손입력 그리드(색상 해시 표시), 결과 손입력 표(완료/반환/대기시간, 평균 자동 계산) |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정(공용) | `ScratchPadData`에 `scheduling` 필드 추가, `TabKey`에 `'scheduling'` 추가, 탭 목록(페이지 부재 뒤)·렌더 분기에 "스케줄링" 탭 편입, `loadData`에 `isSchedulingSolveData` 타입가드 하위호환 처리, 헤더 Javadoc 5탭→6탭 갱신 |
| `CLAUDE.md` | 수정 | Shared Utilities 표에 `SchedulingSolveTool` 행 추가, `ScratchPadPanel` 설명에 스케줄링 탭 반영 |

### 수정 상세

#### `frontend/src/components/ui/SchedulingSolveTool.tsx`
- 변경 전: 파일 없음(신규)
- 변경 후: `SchedulingProcessDraft`/`SchedulingResultDraft`/`SchedulingSolveData` 타입 정의. `resizeGantt`/`resizeResults`가 총 시간·프로세스 수 변경 시 기존 손입력 값을 최대한 보존하며 리사이즈(`PageReplacementTool`의 `resizeGrid`와 동일 철학). `hashLabelToColorClass`가 셀 텍스트를 해시해 10색 팔레트 중 하나로 배경색 표시(표시 보조, 자동 계산 아님). `average`가 결과 표의 반환/대기시간 숫자 입력만 골라 소수 둘째 자리 평균 산출(안전 계산기 수준 산술 보조로 허용된 유일한 자동 계산). 프로세스 최대 10행, 총 시간 최대 60(localStorage 용량·렌더 보호).
- 이유: 기존 페이지 부재 도구와 동일한 "골격 생성 + 손입력" 철학의 스케줄링 풀이 보조 도구 신규 제공

#### `frontend/src/components/ui/ScratchPadPanel.tsx`
- 변경 전: `ScratchPadData`에 `scheduling` 필드 없음, `TabKey`가 `'note' | 'trace' | 'pagereplace' | 'tree' | 'calc'`(5탭), `loadData`가 `scheduling` 필드를 검증하지 않음
- 변경 후: `ScratchPadData.scheduling: SchedulingSolveData` 추가, `EMPTY_DATA.scheduling = EMPTY_SCHEDULING_SOLVE_DATA`, `TabKey`에 `'scheduling'` 추가(탭 배열에서 '페이지 부재' 다음), `loadData`가 `isSchedulingSolveData(p.scheduling)`로 검증 후 없거나 손상 시 `EMPTY_SCHEDULING_SOLVE_DATA`로 폴백, `tab === 'scheduling'`일 때 `<SchedulingSolveTool value={data.scheduling} onChange=... />` 렌더
- 이유: 기존 5탭 구조에 신규 손입력 스케줄링 도구를 하위호환 유지하며 편입

#### `CLAUDE.md`
- 변경 전: Shared Utilities 표에 `SchedulingSolveTool` 행 없음, `ScratchPadPanel` 설명이 "자유메모·CODE 트레이싱·페이지 부재 풀이 도구·트리 시각화·안전 계산기"(5탭)
- 변경 후: `SchedulingSolveTool` 행 추가, `ScratchPadPanel` 설명에 "스케줄링(간트 차트) 풀이 도구" 반영(6탭)
- 이유: 공용 컴포넌트 표 최신화

### 복원 방법
이 ID(HIST-20260710-002)만으로 복원 시: (1) `frontend/src/components/ui/SchedulingSolveTool.tsx` 파일을 삭제한다. (2) `frontend/src/components/ui/ScratchPadPanel.tsx`에서 `SchedulingSolveTool` import, `ScratchPadData.scheduling` 필드, `EMPTY_DATA.scheduling`, `TabKey`의 `'scheduling'`, `loadData`의 `scheduling` 검증/폴백 로직, 탭 배열의 `{ key: 'scheduling', ... }`, `tab === 'scheduling'` 렌더 분기를 모두 제거하고 헤더 Javadoc을 5탭 설명으로 되돌린다. (3) `CLAUDE.md`의 `SchedulingSolveTool` 행을 삭제하고 `ScratchPadPanel` 설명에서 스케줄링 언급을 제거한다.

## HIST-20260710-001

- **날짜**: 2026-07-10
- **수정 범위**: 사용자 프론트엔드 / 시험 응시(`exam/[id]`) — 보기 있는 문항 답안 입력 안내 문구 갱신
- **수정 개요**: 백엔드 `AnswerGrader`가 보기(options) 있는 문항 채점을 "빈칸 순서 비교"(콤마 구분 다중 빈칸 지원, 상세는 `docs/history/back/adm/QuestionBank_Modified.md`의 HIST-20260710-001)로 재작성함에 따라, 답안 입력 input의 placeholder를 `'정답 보기 번호 입력'`에서 `'정답 보기 번호 입력 (빈칸이 여러 개면 순서대로 콤마 구분)'`으로 갱신했다. UI 구조(입력 필드 하나, `CodeAnswerInput` 분기 등)는 변경하지 않았다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/exam/[id]/page.tsx` | 수정 | 답안 input의 `placeholder={optionsAvailable ? '...' : '...'}` 중 보기 있음 분기 문구 갱신 |

### 수정 상세

#### `frontend/src/app/exam/[id]/page.tsx`
- 변경 전: `placeholder={optionsAvailable ? '정답 보기 번호 입력' : '답을 입력하세요'}`
- 변경 후: `placeholder={optionsAvailable ? '정답 보기 번호 입력 (빈칸이 여러 개면 순서대로 콤마 구분)' : '답을 입력하세요'}`
- 이유: 다중 빈칸 채점 지원에 맞춰 입력 방법 안내를 명확히 하기 위함.

### 복원 방법
이 ID(HIST-20260710-001)만으로 복원 시, `frontend/src/app/exam/[id]/page.tsx`의 해당 placeholder를 `'정답 보기 번호 입력'`으로 되돌린다.

## HIST-20260707-003

- **날짜**: 2026-07-07
- **수정 범위**: 사용자 프론트엔드 / 풀이 스크래치패드 — 이진트리 시각화 "트리" 탭 신규 추가
- **수정 개요**: 풀이 화면 공용 `ScratchPadPanel.tsx`(시험 응시 `exam/[id]` · 데일리 퀴즈 `user/quiz/[categoryId]` 공용)에 자유메모/코드 트레이싱/페이지 부재와 동일하게 항상 노출되는 "트리" 탭을 신규 추가했다. 신규 컴포넌트 `BinaryTreeTool.tsx`는 레벨오더 배열 표기(예: `[1, 2, 3, null, 4, 5]`)를 입력받아 LeetCode 표준 BFS 큐 역직렬화 규칙으로 이진트리를 복원하고, in-order 순회로 x 좌표(순차 증가)·깊이로 y 좌표를 배정해 SVG로 자동 렌더한다. 순수 시각화 도구로 채점·코드 실행이 없으며 eval/Function/dangerouslySetInnerHTML을 사용하지 않는다. 노드 수는 200개로 상한을 두어 과도한 렌더를 방지하고, 빈 입력·파싱 불가 시에는 throw 없이 힌트/에러 텍스트만 표시한다. `ScratchPadData`에 `treeInput: string` 필드를 추가했고, 구버전 저장분(필드 없음)은 `loadData`의 문자열 타입가드에서 빈 문자열로 폴백해 하위호환을 유지한다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/BinaryTreeTool.tsx` | 추가 | 레벨오더 배열 표기 → 이진트리 SVG 시각화 컴포넌트(`parseLevelOrderTree`, `computeLayout`, `MAX_TREE_NODES=200`) |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정(공용) | `ScratchPadData`에 `treeInput` 필드 추가, `TabKey`에 `'tree'` 추가, 탭 목록·렌더 분기에 "트리" 탭 편입, `loadData`에 문자열 타입가드 하위호환 처리 |
| `CLAUDE.md` | 수정 | Shared Utilities 표에 `BinaryTreeTool` 행 추가, `ScratchPadPanel` 설명에 트리 탭 반영 |

### 수정 상세

#### `frontend/src/components/ui/BinaryTreeTool.tsx`
- 변경 전: 파일 없음(신규)
- 변경 후: `TreeNode` 타입, `parseLevelOrderTree(input)`(토큰화→BFS 큐 역직렬화, 대괄호/공백/콤마 혼용 허용, `null` 대소문자 무관, 노드 200개 초과 시 에러 메시지 반환, throw 없음), `computeLayout(root)`(in-order x·깊이 y 좌표 계산, 노드/간선 좌표 산출), `BinaryTreeTool({ value, onChange })` 컴포넌트(입력란 + SVG 렌더, 다크모드 대응, 빈/에러 시 힌트 텍스트)
- 이유: 트리 구조 문제를 손으로 그리지 않고 레벨오더 배열만 입력하면 즉시 시각화해 풀이를 돕기 위함(순수 시각화, 채점 없음)

#### `frontend/src/components/ui/ScratchPadPanel.tsx`
- 변경 전: `ScratchPadData`에 `treeInput` 없음, `TabKey = 'note' | 'trace' | 'pagereplace' | 'calc'`, tabs 배열에 트리 탭 없음, 렌더 분기에 `tab === 'tree'` 없음, `loadData` 반환값에 `treeInput` 미포함
- 변경 후: `ScratchPadData.treeInput: string` 추가(+주석), `EMPTY_DATA.treeInput = ''`, `TabKey`에 `'tree'` 추가, `loadData`에서 `typeof p.treeInput === 'string' ? p.treeInput : ''`로 하위호환 처리 후 두 반환 경로 모두에 포함, tabs 배열에 `{ key: 'tree', label: '트리' }`를 페이지 부재와 계산기 사이에 항상 노출로 추가, 본문 렌더에 `<BinaryTreeTool value={data.treeInput} onChange={...} />` 분기 추가, 컴포넌트 상단 JSDoc을 4탭→5탭으로 갱신
- 이유: 신규 트리 탭을 기존 debounce 저장·storageKey 전환 flush 경로에 자연스럽게 편입시키기 위함(다른 탭과 동일한 데이터 오너십 패턴 재사용)

#### `CLAUDE.md`
- 변경 전: Shared Utilities 표에 `BinaryTreeTool` 행 없음, `ScratchPadPanel` 설명에 트리 탭 언급 없음
- 변경 후: `BinaryTreeTool` 행 추가(`parseLevelOrderTree`, `MAX_TREE_NODES` 포함), `ScratchPadPanel` 설명에 "트리 시각화" 반영
- 이유: 신규 공용 컴포넌트 위치·역할을 즉시 문서화해 중복 구현 방지

### 복원 방법
이 ID(HIST-20260707-003)만으로 복원 시: `frontend/src/components/ui/BinaryTreeTool.tsx`를 삭제하고, `ScratchPadPanel.tsx`에서 `treeInput` 필드·`'tree'` TabKey·tabs 배열의 트리 항목·렌더 분기(`tab === 'tree'`)·import문을 모두 제거하며, `CLAUDE.md`의 `BinaryTreeTool` 행과 `ScratchPadPanel` 설명 중 트리 언급을 되돌린다.

## HIST-20260707-002

- **날짜**: 2026-07-07
- **수정 범위**: 사용자 프론트엔드 / 풀이 스크래치패드 — 데스크톱 드로어 position:fixed 무력화 버그 수정
- **수정 개요**: HIST-20260707-001에서 리사이즈 기능 추가 시 데스크톱 드로어 div에 남겨둔 `relative` 클래스가 `fixed`와 동시에 적용되어, 브라우저 검증 결과 실제 computed position이 `relative`로 덮이며 드로어가 우측 고정이 아니라 페이지 좌측 in-flow 요소로 렌더되는 버그가 확인되었다(`getBoundingClientRect left:24, position:relative`). className에서 `relative` 토큰만 제거해 `fixed`가 정상 적용되도록 수정했다. `position: fixed`는 이미 내부 리사이즈 핸들(`absolute left-0 top-0 h-full w-1.5 ...`)의 containing block 역할을 하므로 `relative`는 애초에 불필요했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정(공용) | 데스크톱 드로어 className에서 `relative` 토큰 제거 |

### 수정 상세

#### `frontend/src/components/ui/ScratchPadPanel.tsx`
- 변경 전: `className="hidden lg:flex fixed right-0 top-14 h-[calc(100vh-3.5rem)] z-30 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl flex-col relative"`
- 변경 후: `className="hidden lg:flex fixed right-0 top-14 h-[calc(100vh-3.5rem)] z-30 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl flex-col"`
- 이유: `fixed`와 `relative`가 동시에 지정되어 `relative`가 우선 적용되며 드로어가 우측 고정(fixed)이 아닌 좌측 in-flow 요소로 렌더되는 버그를 브라우저 검증(computed position: relative, left: 24)으로 발견해 수정.

### 복원 방법
이 ID(HIST-20260707-002)만으로 복원 시, 데스크톱 드로어 div의 className 끝에 `relative`를 다시 추가한다(`... shadow-xl flex-col relative`).

## HIST-20260707-001

- **날짜**: 2026-07-07
- **수정 범위**: 사용자 프론트엔드 / 풀이 스크래치패드 — 데스크톱 드로어 폭 리사이즈 + z-index 수정
- **수정 개요**: 시험·퀴즈 풀이 화면 공용 `ScratchPadPanel.tsx`의 데스크톱(lg↑) 우측 드로어에 왼쪽 가장자리 드래그 리사이즈를 추가해 고정 `w-80`(320px)을 300~720px(뷰포트의 90% 상한) 범위에서 자유롭게 넓힐 수 있게 했다. 최종 폭은 `localStorage`(`tpmp:scratchpad:panel-width`)에 저장되어 다음 오픈 시에도 유지된다. 동시에 드로어의 `z-40`이 레이아웃 헤더의 로그아웃/네비 드롭다운(동일 `z-40`)을 DOM 순서상 덮어 클릭이 막히던 버그를 `z-30`으로 낮춰 해결했다. 이 컴포넌트는 시험 응시(`exam/[id]`)·데일리 퀴즈(`user/quiz/[categoryId]`) 등 CODE/일반 문항 풀이 화면 전반에서 공용으로 쓰이므로 한 번의 수정으로 두 화면 모두 반영된다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정(공용) | 데스크톱 드로어 폭 드래그 리사이즈(localStorage 영속) 추가 + 드로어 `z-40`→`z-30` 수정 |

### 수정 상세

#### `frontend/src/components/ui/ScratchPadPanel.tsx`
- 변경 전:
  - 데스크톱 드로어가 `w-80`(고정 320px)이었고 리사이즈 불가능했음.
  - 드로어 `className`에 `z-40`이 적용되어 있어, 레이아웃 헤더(`UserLayoutShell`, 동일 `z-40`)의 로그아웃/네비 드롭다운이 드로어에 가려 클릭되지 않는 문제가 있었음.
- 변경 후:
  - `PANEL_WIDTH_STORAGE_KEY`(`tpmp:scratchpad:panel-width`)·`DEFAULT_PANEL_WIDTH`(320)·`MIN_PANEL_WIDTH`(300) 상수와 `clampPanelWidth`·`computeMaxPanelWidth`(`Math.min(720, window.innerWidth * 0.9)`)·`loadPanelWidth`(SSR/파싱 오류 시 기본값 폴백)·`savePanelWidth` 헬퍼 추가.
  - `panelWidth` state(초기값 `loadPanelWidth()`)와 드래그 시작 좌표/폭/최대치를 담는 `resizeRef` 추가.
  - `handleResizeMouseMove`(`newWidth = clamp(startWidth + (startX - e.clientX), MIN, max)`, 왼쪽으로 끌수록 폭 증가) · `handleResizeMouseUp`(리스너 해제 + body `userSelect`/`cursor` 원복 + `savePanelWidth` 저장) · `handleResizeMouseDown`(시작 좌표/폭/최대치 기록 + body 스타일 적용 + document 리스너 등록) 3개 핸들러 추가.
  - 언마운트 시 드래그 도중이었어도 리스너·body 스타일이 남지 않도록 정리하는 `useEffect` cleanup 추가.
  - 드로어 div에 `relative` 추가 + `w-80` 제거하고 `style={{ width: panelWidth }}` 적용, `z-40` → `z-30` 변경. 드로어 왼쪽 가장자리에 `absolute left-0 top-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-indigo-400 dark:hover:bg-indigo-500` 리사이즈 핸들 div(`onMouseDown={handleResizeMouseDown}`) 추가.
- 이유: (1) 320px 고정 폭이 코드 트레이싱·페이지 부재 도구 등 넓은 콘텐츠를 다루기엔 좁다는 사용성 개선 요청. (2) 드로어와 헤더의 z-index 동률로 인해 로그아웃 드롭다운이 눌리지 않는 버그 수정.

### 복원 방법
이 ID(HIST-20260707-001)만으로 복원 시, `ScratchPadPanel.tsx`에서 `PANEL_WIDTH_STORAGE_KEY`/`DEFAULT_PANEL_WIDTH`/`MIN_PANEL_WIDTH`/`clampPanelWidth`/`computeMaxPanelWidth`/`loadPanelWidth`/`savePanelWidth`와 `panelWidth` state·`resizeRef`·`handleResizeMouseMove`/`handleResizeMouseUp`/`handleResizeMouseDown`·관련 cleanup `useEffect`를 모두 제거하고, 데스크톱 드로어 div를 `className="hidden lg:flex fixed right-0 top-14 w-80 h-[calc(100vh-3.5rem)] z-40 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl flex-col"`(style 없음, 리사이즈 핸들 div 제거)로 되돌린다.

## HIST-20260706-008

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 프론트엔드 / 시험 결과·응시 — 다크모드 가시성 보정 (`dark:` 클래스 부재 지점 보완)
- **수정 개요**: 시험 결과 공용 컴포넌트 `ExamResultDisplay.tsx`(집계 카드·필터 탭·아코디언 목록·객관식/CODE/단답 답안 표시·해설 박스·하단 sticky 액션 바 전반)와 CODE 유형 답안 입력 컴포넌트 `CodeAnswerInput.tsx`(textarea 배경·글자색·테두리·placeholder)에 `dark:` variant를 추가했다. 두 컴포넌트는 시험 제출 직후(`exam/[id]`), 시험 이력 재조회(`user/exam-history/[historyId]`), 데일리 퀴즈(`user/quiz/[categoryId]`) 화면에서 공용으로 쓰이므로 한 번의 수정으로 세 화면 모두 반영됨. 퀴즈 화면 자체(`page.tsx`)의 라운드 완료 카드·결과 피드백 박스 보정은 [front/usr/DailyQuiz_Modified.md HIST-20260706-008] 참조.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/ExamResultDisplay.tsx` | 수정(공용) | 페이지 배경·카드·필터탭·아코디언·정답/오답 배지·객관식 선택지·CODE/단답 내답·정답·해설 박스·sticky 액션 바에 `dark:` 클래스 추가 |
| `frontend/src/components/ui/CodeAnswerInput.tsx` | 수정(공용) | textarea `dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:placeholder-gray-500 dark:disabled:bg-gray-900`, 안내 문구 `dark:text-gray-500` 추가 |

### 수정 상세

#### `frontend/src/components/ui/ExamResultDisplay.tsx`
- 변경 전: 컴포넌트 전체에 `dark:` 클래스가 전혀 없어, `html.dark` 상태에서도 `bg-white`/`bg-gray-50` 등 라이트 배경이 고정 렌더되고 `text-gray-700`/`text-green-700`/`text-red-600` 등 텍스트 대비가 다크 배경과 충돌할 수 있었음.
- 변경 후:
  - 최상위 `min-h-screen bg-gray-50` → `dark:bg-gray-900`
  - 집계 카드·아코디언 아이템·빈 상태 박스: `bg-white` → `dark:bg-gray-800`, `border-gray-200` → `dark:border-gray-700`
  - 필터 탭 비활성 버튼: `dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600`
  - 정답/오답 배지: `dark:bg-green-900/50 dark:text-green-300` / `dark:bg-red-900/50 dark:text-red-300`
  - 문항 본문·해설 `RichContent`: `text-gray-800` → `dark:text-gray-200`, `text-gray-700` → `dark:text-gray-200`
  - 객관식 선택지 3색(정답/내답/기본) 각각 `dark:bg-*-900/30 dark:border-*-700 dark:text-*-300` 계열 보정
  - CODE·단답 내 답/정답 텍스트: `text-green-600/700` → `dark:text-green-300/400`, `text-red-500/600` → `dark:text-red-300/400`
  - 하단 sticky 액션 바: `bg-gray-50/95` → `dark:bg-gray-900/95`, `다시 풀기` 버튼 `dark:bg-gray-800 dark:text-indigo-300 dark:border-indigo-700`
- 이유: 시험 제출 직후·이력 조회·퀴즈 결과 3개 화면 공용 컴포넌트라 다크모드 대비 부재가 가장 넓게 영향을 미쳤음.

#### `frontend/src/components/ui/CodeAnswerInput.tsx`
- 변경 전: textarea에 배경·글자색이 지정되지 않아 브라우저 기본(라이트) 배경 위에 다크모드 전역 글자색이 겹쳐 보이거나 반대로 안 보이는 문제, 테두리도 `border-gray-300` 고정.
- 변경 후: `dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:placeholder-gray-500 dark:disabled:bg-gray-900`, 상단 안내 문구 `text-gray-400` → `dark:text-gray-500`. CodeBlock(정답 표시용, Darcula 다크 고정)은 이번 변경 대상이 아님.
- 이유: CODE 유형 문항을 다크모드에서 풀 때 입력한 코드 답안 텍스트가 보이지 않던 문제 해소.

### 복원 방법
이 ID(HIST-20260706-008)만으로 복원 시: 위 2개 파일에서 이번에 추가된 `dark:` 클래스 문자열만 제거(라이트 모드 클래스·마크업 구조는 그대로 유지). 두 파일은 `DailyQuiz_Modified.md` HIST-20260706-008과 공용이므로 함께 되돌린다.

## HIST-20260706-007

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 — 풀이 스크래치패드에 "페이지 부재(페이지 교체)" 풀이 도구 탭 신설(항상 노출, 채점·자동계산 없음)
- **수정 개요**: 신규 컴포넌트 `PageReplacementTool.tsx`를 추가해 계산기처럼 항상 노출되는 4번째 탭 "페이지 부재"를 `ScratchPadPanel`에 편입했다. 사용자가 참조열(공백/콤마 혼용 구분, 예 `7 0 1 2 0 3 0 4`)과 프레임 수(1~8, `clampFrameCount`로 안전 정규화)를 입력하면 열=스텝(참조 페이지 헤더 표시)·행=프레임 1..N + "부재(F)" 토글 행으로 표 골격만 자동 생성된다. 각 프레임 셀은 짧은 텍스트를 직접 입력하는 모노스페이스 input이고, 부재 행은 스텝별 클릭 토글(불리언)이다. FIFO/LRU/Optimal 등 알고리즘 자동 계산·정답 채점은 전혀 하지 않으며, 사용자가 토글한 부재 개수만 실시간 집계해 "부재 횟수: N / 스텝수"로 보여준다(이는 채점이 아니라 본인 입력의 단순 카운트). 참조열/프레임 수를 바꾸면 `resizeGrid` 헬퍼가 기존 `cells`/`faults`를 유효 인덱스 범위 내에서 최대한 보존하며 안전하게 리사이즈한다(초과분은 잘라내고 부족분은 빈 값/false로 확장, 어떤 입력에도 throw 없음). "그리드 초기화" 버튼은 참조열/프레임 수는 유지한 채 `cells`/`faults`만 클리어한다(문제 설정을 다시 입력하지 않고 재도전 가능하도록). 표는 참조열이 길어질 수 있어 `overflow-x-auto`로 가로 스크롤 반응형 처리했고 다크모드(`dark:`)를 전 요소에 적용했다. `ScratchPadData`에 `pageReplacement: PageReplacementData` 필드를 추가했고, `loadData`가 `isPageReplacementData` 타입가드로 검증해 없거나 손상된 구버전 저장분은 `EMPTY_PAGE_REPLACEMENT_DATA`로 안전 폴백한다(storageKey 불변, 필드 추가만이라 기존 자유메모·트레이싱·계산기 저장분과 호환). 저장은 기존 `updateData`/디바운스(500ms)/storageKey 전환 flush 경로에 그대로 편입되며 새 저장 경로를 추가하지 않았다. eval/Function/dangerouslySetInnerHTML 미사용. 퀴즈 화면(`DailyQuiz_Modified.md` HIST-20260706-007)과 공용 컴포넌트.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/PageReplacementTool.tsx` | 추가 | 페이지 부재 풀이 도구 컴포넌트(`PageReplacementData` 타입, `parseRefTokens`, `isPageReplacementData`, `resizeGrid` 내부 헬퍼, `PageReplacementTool` 컴포넌트) |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정 | `ScratchPadData`에 `pageReplacement: PageReplacementData` 필드 추가, `EMPTY_DATA`/`loadData`에 폴백 반영, `TabKey`에 `'pagereplace'` 추가, 탭 배열에 "페이지 부재" 탭(항상 노출) 추가, 본문에 `<PageReplacementTool value={data.pageReplacement} onChange=... />` 렌더 분기 추가 |
| `CLAUDE.md` | 수정 | Shared Utilities 표에 `PageReplacementTool` 행 추가, `ScratchPadPanel` 설명에 페이지 부재 탭 반영 |

### 수정 상세

#### `frontend/src/components/ui/PageReplacementTool.tsx` (신규)
- 변경 전: 파일 없음
- 변경 후: `PageReplacementData` 타입(`refString`/`frameCount`/`cells: string[][]`/`faults: boolean[]`), `EMPTY_PAGE_REPLACEMENT_DATA` 상수, `parseRefTokens`(공백/콤마 혼용 파싱), `clampFrameCount`(1~8 정규화, NaN/음수/소수 안전 처리), `resizeGrid`(차원 변경 시 기존 값 보존 리사이즈, throw 없음), `isPageReplacementData` 타입가드, `PageReplacementTool` 컴포넌트(참조열/프레임 수 입력 + 표 골격 + 부재 토글 행 + 부재 카운트 + 초기화 버튼) 신설
- 이유: 채점 없는 순수 손입력 보조 표를 별도 컴포넌트로 분리해 `ScratchPadPanel`의 책임을 유지(코드 트레이싱이 `TracePreview`/`traceNotation.ts`로 분리된 기존 패턴과 동일)

#### `frontend/src/components/ui/ScratchPadPanel.tsx`
- 변경 전: `ScratchPadData`는 `note`/`trace`/`calcHistory`/`traceBlocks?`만 보유. `TabKey`는 `'note' | 'trace' | 'calc'`. 탭 배열은 자유메모·(조건부)코드트레이싱·계산기 3개
- 변경 후: `ScratchPadData`에 `pageReplacement: PageReplacementData` 추가. `EMPTY_DATA`에 `pageReplacement: EMPTY_PAGE_REPLACEMENT_DATA` 포함. `loadData`가 `isPageReplacementData(p.pageReplacement)`로 검증해 유효하면 그대로, 아니면 `EMPTY_PAGE_REPLACEMENT_DATA`로 폴백 후 반환 객체에 포함(기존 note/trace/calcHistory 반환 로직은 변경 없음). `TabKey`에 `'pagereplace'` 추가, 탭 배열에 `{ key: 'pagereplace', label: '페이지 부재' }`를 계산기처럼 항상 노출로 추가(코드트레이싱과 계산기 사이). 본문에 `tab === 'pagereplace'` 분기로 `<PageReplacementTool value={data.pageReplacement} onChange={next => updateData(prev => ({ ...prev, pageReplacement: next }))} />` 렌더 추가
- 이유: 요구사항대로 "계산기처럼 항상 노출되는 탭"으로 페이지 부재 도구를 편입하되, 상태 소유·저장(debounce/flush)은 기존 패널 인프라를 그대로 재사용

#### `CLAUDE.md`
- 변경 전: Shared Utilities 표에 `PageReplacementTool` 행 없음, `ScratchPadPanel` 설명에 "자유메모·CODE 트레이싱·안전 계산기"만 언급
- 변경 후: `PageReplacementTool` 행 추가, `ScratchPadPanel` 설명에 "페이지 부재 풀이 도구" 반영
- 이유: 신규 공용 컴포넌트를 팀 컨벤션 문서에 즉시 반영

### 복원 방법
이 ID(HIST-20260706-007)만으로 복원 시: `frontend/src/components/ui/PageReplacementTool.tsx` 파일을 삭제한다. `ScratchPadPanel.tsx`에서 `PageReplacementTool`/`EMPTY_PAGE_REPLACEMENT_DATA`/`isPageReplacementData`/`PageReplacementData` import를 제거하고, `ScratchPadData`에서 `pageReplacement` 필드를 제거하고, `EMPTY_DATA`를 `{ note: '', trace: '', calcHistory: [] }`로 되돌리고, `loadData`의 `pageReplacement` 관련 라인을 제거해 반환문을 이전 형태(`{ note: p.note, trace: ..., calcHistory: p.calcHistory }`)로 되돌리고, `TabKey`에서 `'pagereplace'`를 제거하고, 탭 배열에서 페이지 부재 탭 항목을 제거하고, 본문에서 `tab === 'pagereplace'` 렌더 분기를 제거한다. `CLAUDE.md`는 `PageReplacementTool` 행을 삭제하고 `ScratchPadPanel` 설명 문구를 이 변경 전으로 되돌린다. 퀴즈 화면(`DailyQuiz_Modified.md` HIST-20260706-007)도 동일 공용 파일을 사용하므로 함께 되돌리지 않는 한 그 파일 자체는 삭제하지 말 것.

## HIST-20260706-006

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 — 풀이 스크래치패드 코드 트레이싱 프리뷰에서 `=` 없이 수식만 적은 줄(이름 없는 수식)도 자동 계산
- **수정 개요**: 기존 `parseTraceLines`는 `이름 = 값` 대입 표기만 계산 대상으로 삼아 `av / len`처럼 이름 없이 수식만 적은 줄은 자유 텍스트로 남았다. `classifyLine`이 `ASSIGN_PATTERN`에 매칭되지 않는 줄을 만나면, (1) `FORMULA_CHAR_PATTERN`(숫자·식별자·사칙연산자·괄호·공백 화이트리스트) 통과 여부와 (2) 사칙연산자(`+ - * / % **`)를 최소 1개 포함하는지를 함께 확인해 수식 후보(`ExprCandidateInfo`)로 1차 분류하도록 확장했다. 연산자 포함 조건은 `note`·`av` 같은 단어 하나/단일 식별자, `이건 메모` 같은 한글 문장이 수식으로 오인되지 않도록 하는 핵심 가드다. 수식 후보는 named 변수 픽스포인트(리터럴 선수집 + 순서 무관 다중 패스)가 모두 끝난 뒤 최종 `resolvedEnv`로 `tryEvaluateFormula`를 통해 단 한 번만 평가한다 — 참조 식별자가 하나라도 최종 env에 없으면 계산하지 않고 원본 줄 그대로 텍스트로 폴백한다. 계산에 성공하면 새 `ExprLine`(`kind: 'expr'`)으로 렌더되며, 이름이 없으므로 env에 등록되지 않아 다른 줄의 계산에 영향을 주지 않는다. `TracePreview`에 이름 칩 없이 `수식(연한색) = 결과(굵게) + 타입 배지`만 표시하는 `ExprRow`를 추가했다. 계산은 전량 기존 `safeMathCalc.evaluateExpression`(eval/Function 미사용)에 위임하며 새 실행 경로를 추가하지 않았다. 퀴즈 화면(`DailyQuiz_Modified.md` HIST-20260706-006)과 공용 컴포넌트.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/traceNotation.ts` | 수정 | `ExprLine` 타입 추가(`TraceLine` 유니온에 합류), `ExprCandidateInfo`/`HAS_OPERATOR_PATTERN` 추가, `classifyLine`이 `=` 없는 줄 중 수식 후보를 `exprCandidate`로 분류하도록 확장, `parseTraceLines` 최종 매핑에서 named 변수 픽스포인트 종료 후 `exprCandidate`를 1회 평가해 `ExprLine` 또는 `TextLine`으로 확정 |
| `frontend/src/components/ui/TracePreview.tsx` | 수정 | `ExprRow` 컴포넌트 추가(이름 칩 없이 수식=결과+타입배지), `switch(line.kind)`에 `'expr'` 케이스 추가 |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정 | 코드 트레이싱 안내 문구에 `av / len`(이름 없이 수식만 적어도 자동 계산) 예시 추가 |
| `CLAUDE.md` | 수정 | Shared Utilities 표의 `parseTraceLines`·`TracePreview` 행 설명에 이름 없는 수식 계산 반영 |

### 수정 상세

#### `frontend/src/lib/traceNotation.ts`
- 변경 전: `ClassifiedLine`은 `Array1DLine | Array2DLine | TextLine | ScalarAssignInfo`만 존재. `classifyLine`은 `ASSIGN_PATTERN`(`=` 필수)에 매칭되지 않으면 무조건 `{ kind: 'text', text: rawLine }`으로 폴백. `TraceLine` 유니온에 `expr` 종류 없음
- 변경 후: `TraceLine`에 `ExprLine`(`kind:'expr'`, `expr`/`value`/`typeLabel`/`typeSource`) 추가. `classifyLine`이 `ASSIGN_PATTERN` 불일치 시 `FORMULA_CHAR_PATTERN.test(line) && HAS_OPERATOR_PATTERN.test(line)`(연산자 `[+\-*/%]` 최소 1개)를 만족하면 `{ kind: 'exprCandidate', expr: line, raw: rawLine }`로 분류, 아니면 기존처럼 text. `parseTraceLines` 최종 `classified.map`에서 `exprCandidate`를 named 변수 픽스포인트 완료 후의 `resolvedEnv`로 `tryEvaluateFormula(c.expr, resolvedEnv)` 1회 평가 — 성공 시 `ExprLine` 반환(env에는 등록 안 함), 실패 시 `{ kind: 'text', text: c.raw }`로 폴백
- 이유: 사용자가 이름을 붙이지 않고 즉석에서 수식만 입력해도(`av / len`) 계산 결과를 바로 보고 싶어함. 연산자 필수 조건이 없으면 자유 메모(`note`, `이건 메모`)나 단일 변수명(`av`)이 수식으로 오인되어 사라질 위험이 있어 엄격히 가드

#### `frontend/src/components/ui/TracePreview.tsx`
- 변경 전: `switch(line.kind)`가 `var`/`array1d`/`array2d`/`text`만 처리
- 변경 후: `ExprRow({ expr, value, typeLabel, typeSource })` 추가(이름 칩 없이 `수식(연한색 텍스트) = 결과(굵게)` + `TypeBadge`), `switch`에 `case 'expr'` 추가
- 이유: 이름 없는 계산 결과를 기존 변수 행과 시각적으로 구분(이름 칩 없음)하면서도 동일한 카드 스타일로 표시

#### `frontend/src/components/ui/ScratchPadPanel.tsx`
- 변경 전: 안내 문구가 `avg = sum / len`(정의 순서 무관 숫자 변수 참조·리터럴 수식 자동 계산, 예: `10 / 4`)까지만 안내
- 변경 후: `av / len`(이름 없이 수식만 적어도 자동 계산, 예: `10 / 4`) 예시 추가
- 이유: 새로 지원되는 표기법을 사용자에게 안내

### 복원 방법
이 ID(HIST-20260706-006)만으로 복원 시: `traceNotation.ts`에서 `ExprLine`을 `TraceLine` 유니온에서 제거하고, `ExprCandidateInfo`/`HAS_OPERATOR_PATTERN`을 삭제하며, `classifyLine`의 `ASSIGN_PATTERN` 불일치 분기를 `return { kind: 'text', text: rawLine };`로만 되돌린다. `parseTraceLines` 최종 매핑에서 `exprCandidate` 분기를 제거한다. `TracePreview.tsx`에서 `ExprRow`와 `case 'expr'`를 제거한다. `ScratchPadPanel.tsx` 안내 문구에서 `av / len` 예시 문구를 제거한다. `CLAUDE.md`는 `parseTraceLines`·`TracePreview` 행을 이 변경 전 문구로 되돌린다. 퀴즈 화면(`DailyQuiz_Modified.md` HIST-20260706-006)도 동일 공용 파일을 사용 중이므로 함께 되돌리지 않는 한 파일 자체를 삭제하지 말 것.

## HIST-20260706-005

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 — 풀이 스크래치패드 코드 트레이싱 프리뷰 변수 참조 수식 계산을 두 방향으로 확장(리터럴 수식 계산, 순서 무관 변수 참조)
- **수정 개요**: 기존 `parseTraceLines`는 위→아래 단일 패스로만 계산해 (1) `av = 10 / 4`처럼 식별자가 하나도 없는 순수 리터럴 수식은 계산하지 않았고 (2) 참조하는 변수가 아래 줄에 정의돼 있으면(순서 무관) 계산하지 못했다. 이번 변경으로 `classifyLine`(env 비의존 1차 분류: 배열/텍스트는 즉시 확정, 스칼라 대입은 이름/rhs/타입만 보존)과 픽스포인트 다중 패스 해석으로 재구성했다. 1차로 모든 `이름 = <숫자 리터럴>` 정의를 env에 먼저 채우고(같은 이름이 여러 번이면 텍스트상 마지막 정의가 최종값 — 재대입 시 이전처럼 마지막 값 사용), 2차 이후 패스마다 리터럴이 아닌 수식 후보 라인 중 참조 식별자가 전부 env에 있는 라인을 계산해 env에 추가하는 것을 더 해결되는 라인이 없을 때까지 반복(반복 상한은 라인 수+1로 순환 참조 무한루프 방지). `tryEvaluateFormula`는 식별자가 없으면 즉시 리터럴 수식으로 계산을 시도하되, 날짜(`2024-01-01`)·전화번호(`010-1234-5678`)·버전(`1.2.3`)처럼 공백 없이 숫자와 `-`/`.`만 압축 나열된 형태(`^\d+([-.]\d+)+$`)는 뺄셈으로 오계산되지 않도록 가드로 제외해 문자열로 폴백한다(공백 있는 뺄셈 `10 - 3`이나 `/`를 쓴 `16/9`는 가드에 안 걸리고 정상 계산). 계산·저장 로직은 전량 기존 `safeMathCalc.evaluateExpression`(eval/Function 미사용)에 위임하며 새 실행 경로를 추가하지 않았다. 퀴즈 화면(`DailyQuiz_Modified.md` HIST-20260706-005)과 공용 컴포넌트.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/traceNotation.ts` | 수정 | `classifyLine`(신규, env 비의존 1차 분류) 추가로 기존 `parseSingleLine` 대체, `ScalarAssignInfo`/`ClassifiedLine`/`FormulaEvalSuccess` 타입 추가, `DATE_LIKE_GUARD_PATTERN` 상수 추가, `tryEvaluateFormula`가 식별자 0개(순수 리터럴 수식)도 처리하도록 확장(가드 적용), `parseTraceLines`를 리터럴 선(先)수집 + 수식 픽스포인트 다중 패스 해석으로 재작성(순서 무관 지원) |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정 | 코드 트레이싱 탭 안내 문구를 "정의 순서 무관 숫자 변수 참조·리터럴 수식 자동 계산" 예시(`10 / 4`)로 갱신 |
| `CLAUDE.md` | 수정 | Shared Utilities 표의 `parseTraceLines` 행 설명에 리터럴 수식 계산·순서 무관 변수 참조·날짜형 가드 반영 |

### 수정 상세

#### `frontend/src/lib/traceNotation.ts`
- 변경 전: `parseSingleLine(rawLine, env: Map<string, number>)`이 위→아래 단일 패스로 호출되며, 스칼라 rhs가 "이미 알려진(env에 있는) 숫자 변수를 최소 1개 참조"하는 경우에만 `tryEvaluateFormula`로 계산 시도. 식별자가 0개인 순수 리터럴 수식(`10/4`)이나 아래 줄에 정의된 변수를 참조하는 수식은 계산 없이 문자열로 폴백
- 변경 후: `classifyLine(rawLine)`이 env 없이 각 줄을 1차 분류(배열/텍스트는 확정, 스칼라 대입은 `{name, rhs, explicitType, typeSource}`만 보존). `parseTraceLines`가 (1) 모든 스칼라 대입 중 숫자 리터럴만 먼저 `literalEnv`에 수집(동일 이름은 텍스트상 마지막 정의로 덮어씀, `literalLastIndex`로 위치 기록) (2) 리터럴이 아닌 수식 후보 라인만 골라 픽스포인트 루프(`while(changed && pass < maxPasses)`)로 반복 해석 — 매 패스마다 미해결 라인 중 `tryEvaluateFormula(rhs, resolvedEnv)`가 성공하면 `computedValues`에 기록하고, 같은 이름의 리터럴 정의가 이 수식 라인보다 텍스트상 뒤에 있지 않은 경우에만 `resolvedEnv`에 반영(리터럴 마지막 정의 우선 규칙 보호) (3) 더 이상 새로 해결되는 라인이 없으면 종료, 원래 줄 순서대로 최종 `TraceLine[]` 조립. `tryEvaluateFormula`는 식별자가 0개면 `DATE_LIKE_GUARD_PATTERN`(`/^\d+([-.]\d+)+$/`) 통과 시에만 그대로 `evaluateExpression`에 위임하고, 식별자가 있으면 기존과 동일하게 전부 env에 있는지 확인 후 치환·계산
- 이유: 사용자가 리터럴 수식(`av = 10 / 4`)이나 변수 정의 순서에 상관없이(`avg = av/len` 앞에 `av`, `len`이 나중에 나와도) 자동 계산 결과를 보고 싶어함. 날짜·전화번호·버전 같은 값이 하이픈/점을 사칙연산자로 오인해 잘못 계산되는 것을 막기 위해 압축 나열 패턴 가드를 별도로 도입

#### `frontend/src/components/ui/ScratchPadPanel.tsx`
- 변경 전: 안내 문구가 `avg = sum / len`(앞서 정의한 숫자 변수 참조 시 자동 계산)으로 순서 종속성을 전제로 안내
- 변경 후: `avg = sum / len`(정의 순서 무관 숫자 변수 참조·리터럴 수식 자동 계산, 예: `10 / 4`)로 갱신
- 이유: 확장된 동작(순서 무관, 리터럴 수식)을 안내 문구에 정확히 반영

### 복원 방법
이 ID(HIST-20260706-005)만으로 복원 시: `traceNotation.ts`에서 `classifyLine`/`ScalarAssignInfo`/`ClassifiedLine`/`FormulaEvalSuccess`/`DATE_LIKE_GUARD_PATTERN`을 제거하고 `parseSingleLine(rawLine, env)`(위→아래 단일 패스, `tryEvaluateFormula`는 식별자 1개 이상 참조 시에만 계산 시도)로 되돌리며 `parseTraceLines`를 `const env = new Map(); .map(line => parseSingleLine(line, env))` 형태로 되돌린다. `ScratchPadPanel.tsx`의 안내 문구를 `avg = sum / len`(앞서 정의한 숫자 변수 참조 시 자동 계산)으로 되돌린다. `CLAUDE.md`는 `parseTraceLines` 행을 위 "변경 전" 문구로 되돌린다. 퀴즈 화면(`DailyQuiz_Modified.md` HIST-20260706-005)도 동일 공용 파일을 사용 중이므로 함께 되돌리지 않는 한 파일 자체를 삭제하지 말 것.

## HIST-20260706-004

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 — 풀이 스크래치패드 코드 트레이싱 프리뷰에 변수 참조 수식 자동 계산 추가
- **수정 개요**: `parseTraceLines`가 위→아래 순회하며 스칼라 숫자 변수를 `Map<string, number>` 환경에 누적하고, 리터럴이 아닌 rhs가 숫자/식별자/사칙연산자(`+ - * / % **`)/괄호/공백만으로 구성되며 최소 1개의 이미 알려진 숫자 변수를 참조하면 식별자를 숫자로 치환한 뒤 기존 `safeMathCalc.evaluateExpression`(안전 화이트리스트 계산기, eval/Function 미사용)로 계산한다. 계산 성공 시 결과를 `VarLine.sourceExpr`(원본 수식)+`value`(결과)로 노출하고 환경에도 등록해 다음 줄에서 재참조 가능(`avg = sum/len` → `total = avg*2`). 식별자 미정의·계산기 오류(0으로 나눔 등)·비수식(콜론 포함 등)이면 새 계산을 시도하지 않고 기존과 동일하게 문자열 var로 폴백해 회귀 없음. 프리뷰(`TracePreview`)는 계산된 라인을 `이름 = 수식 = 결과` 형태로 렌더. 퀴즈 화면(`DailyQuiz_Modified.md` HIST-20260706-004)과 공용 컴포넌트.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/traceNotation.ts` | 수정 | `VarLine`에 `sourceExpr?: string` 필드 추가, `FORMULA_CHAR_PATTERN`/`IDENTIFIER_PATTERN`/`formatComputedNumber`/`tryEvaluateFormula` 신규 함수 추가, `parseSingleLine`이 `env: Map<string, number>`를 받아 리터럴 숫자 등록 → 수식 계산 시도 → 실패 시 문자열 폴백 순서로 처리, `parseTraceLines`가 env를 생성해 순회 중 전달 |
| `frontend/src/components/ui/TracePreview.tsx` | 수정 | `VarRow`에 `sourceExpr?` prop 추가 — 존재하면 `이름 = 수식 = 결과`로 렌더(결과는 굵게), 없으면 기존과 동일 |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정 | 코드 트레이싱 탭 안내 문구·textarea placeholder에 `avg = sum / len`(변수 참조 자동 계산) 예시 추가 |
| `CLAUDE.md` | 수정 | Shared Utilities 표의 `parseTraceLines`/`TracePreview` 행 설명에 변수 참조 사칙연산 자동 계산 내용 반영 |

### 수정 상세

#### `frontend/src/lib/traceNotation.ts`
- 변경 전: `VarLine`에 `sourceExpr` 없음. `parseSingleLine(rawLine: string)`은 env 없이 스칼라 rhs를 항상 `{kind:'var', value: rhs, typeLabel: explicitType ?? inferScalarType(rhs)}`로만 반환(계산 없음). `parseTraceLines`는 `.map(parseSingleLine)`
- 변경 후: `VarLine`에 `sourceExpr?: string` 추가(계산 성공한 원본 수식 문자열). 스칼라 rhs 처리 순서를 (1) `isNumericLiteral(rhs)`면 `env.set(name, Number(rhs))` 후 기존과 동일한 리터럴 반환 (2) 아니면 `tryEvaluateFormula(rhs, env)` 시도 — 성공 시 `env.set(name, computed.value)` 후 `{value: computed.formatted, typeLabel: explicitType ?? 'number', sourceExpr: rhs}` 반환 (3) 실패 시 기존과 동일한 문자열 폴백으로 재구성. `tryEvaluateFormula`는 `FORMULA_CHAR_PATTERN`(`/^[A-Za-z0-9_.+\-*/%().\s]+$/`)으로 1차 필터 후 `IDENTIFIER_PATTERN`(`/[A-Za-z_]\w*/g`)으로 식별자를 추출해 전부 env에 있는지 확인, 하나라도 없으면 null. 전부 있으면 식별자를 `env.get(id)` 숫자 문자열로 치환해 `evaluateExpression`(기존 `safeMathCalc.ts`, 수정 없음)에 위임하고 error/비유한값이면 null. `formatComputedNumber`는 정수면 그대로, 실수면 `toPrecision(6)` 반올림 후 `Number()`→`String()`으로 말미 0 제거. `parseTraceLines`는 `const env = new Map<string, number>()`를 만들어 `.map(line => parseSingleLine(line, env))`로 순서대로 전달(배열 순회 순서 보장 이용)
- 이유: 사용자가 트레이싱 중 `avg = sum / len`처럼 이미 입력한 숫자 변수로 파생값을 자동 계산해 보고 싶어함. eval/new Function을 새로 도입하지 않기 위해 식별자 치환 후 기존 안전 계산기(`evaluateExpression`)에 전량 위임하는 방식을 택함 — 계산 로직 자체는 한 곳(safeMathCalc.ts)에만 존재

#### `frontend/src/components/ui/TracePreview.tsx`
- 변경 전: `VarRow({name, value, typeLabel, typeSource})`가 `이름 [배지] = 값` 한 줄만 렌더
- 변경 후: `VarRow`에 `sourceExpr?: string` prop 추가. `sourceExpr`가 있으면 `이름 [배지] = 수식(연한 색) = 결과(굵게)` 형태로 렌더, 없으면 기존과 동일. `TracePreview`의 `case 'var'`에서 `sourceExpr={line.sourceExpr}` 전달
- 이유: 계산된 값만 보여주면 어떤 수식에서 유도됐는지 알 수 없어 원본 수식과 결과를 함께 노출

#### `frontend/src/components/ui/ScratchPadPanel.tsx`
- 변경 전: 안내 문구·placeholder에 변수 참조 수식 예시 없음(`i = 3`, `x: long = 3`, `arr = [...]`, `grid = [[...]]`만 존재)
- 변경 후: 안내 문구에 `avg = sum / len`(앞서 정의한 숫자 변수 참조 시 자동 계산) 추가, placeholder에 `sum = 10\nlen = 4\navg = sum / len` 예시 줄 추가
- 이유: 새 기능의 존재를 사용자가 바로 발견할 수 있게 안내

#### `CLAUDE.md`
- 변경 전: `parseTraceLines`/`TracePreview` 행 설명에 수식 자동 계산 관련 언급 없음
- 변경 후: `parseTraceLines` 행에 "위→아래 순회 중 숫자 변수 환경(Map)을 누적해 변수 참조 사칙연산 자동 계산을 지원(evaluateExpression 재사용, 미정의 참조·계산 오류는 문자열로 안전 폴백)" 문구 추가, `TracePreview` 행에 "자동 계산된 변수는 이름 = 수식 = 결과 형태로 원본 수식도 함께 표시" 문구 추가
- 이유: 공용 유틸리티 표 최신화

### 복원 방법
이 ID(HIST-20260706-004)만으로 복원 시: `traceNotation.ts`에서 `VarLine.sourceExpr` 필드, `FORMULA_CHAR_PATTERN`/`IDENTIFIER_PATTERN`/`formatComputedNumber`/`tryEvaluateFormula` 함수를 제거하고 `parseSingleLine`을 `env` 매개변수 없이 스칼라 rhs를 항상 `inferScalarType` 기반 문자열 var로 반환하도록 되돌리며 `parseTraceLines`를 `.map(parseSingleLine)`(env 생성 없이)로 되돌린다. `TracePreview.tsx`에서 `VarRow`의 `sourceExpr` prop과 조건부 렌더를 제거해 `이름 = 값` 단일 렌더로 되돌린다. `ScratchPadPanel.tsx`의 안내 문구·placeholder에서 `avg = sum / len` 예시를 제거한다. `CLAUDE.md`는 두 행을 위 "변경 전" 문구로 되돌린다. 퀴즈 화면(`DailyQuiz_Modified.md` HIST-20260706-004)도 동일 공용 파일을 사용 중이므로 함께 되돌리지 않는 한 파일 자체를 삭제하지 말 것.

## HIST-20260706-003

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 — 풀이 스크래치패드 코드 트레이싱 프리뷰에 타입 배지(자동추론 + 표기법 오버라이드) 추가
- **수정 개요**: HIST-20260706-002에서 도입한 `name = value` 표기법에 `name: type = value` 형태의 선택적 타입 명시 문법을 추가하고, 타입을 생략하면 값에서 자동 추론(`number`/`boolean`/`null`/`undefined`/`string`, 배열은 `number[]`/`string[]`/`number[][]`/`string[][]`/`array`)한다. 프리뷰(`TracePreview`)에는 이름 옆에 타입 배지를 렌더해 explicit(명시)과 inferred(자동추론)를 시각적으로 구분한다. 값 내부의 콜론(`t = 12:30`, `url = http://x`)은 타입으로 오인되지 않도록 정규식을 이름 뒤 콜론만 매칭하게 설계·검증함. 코드 실행/eval/Function/JSON.parse 여전히 미사용. 퀴즈 화면(`DailyQuiz_Modified.md` HIST-20260706-003)과 공용 컴포넌트.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/traceNotation.ts` | 수정 | `ASSIGN_PATTERN`을 명시 타입 캡처 그룹 포함 형태로 교체, `TypeSource`('explicit'/'inferred') 타입 추가, `VarLine`/`Array1DLine`/`Array2DLine`에 `typeLabel`/`typeSource` 필드 추가, `inferScalarType`/`inferArray1DType`/`inferArray2DType` 자동 추론 함수 신규 작성 |
| `frontend/src/components/ui/TracePreview.tsx` | 수정 | `TypeBadge` 서브 컴포넌트 신규 추가(explicit=채운 배경, inferred=점선 테두리+이탤릭), `VarRow`/`Array1DRow`/`Array2DGrid`가 `typeLabel`/`typeSource` prop을 받아 배지 렌더. `FreeTextRow`(text)는 배지 없음 |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정 | 코드 트레이싱 탭 안내 문구·textarea placeholder에 `x: long = 3` 타입 명시 예시 추가 |
| `CLAUDE.md` | 수정 | Shared Utilities 표의 `parseTraceLines`/`TracePreview` 행 설명에 타입 배지 지원 내용 반영 |

### 수정 상세

#### `frontend/src/lib/traceNotation.ts`
- 변경 전: `const ASSIGN_PATTERN = /^([A-Za-z_]\w*)\s*=\s*(.+)$/;`(name, rhs 2그룹만 캡처). `VarLine`/`Array1DLine`/`Array2DLine`에 타입 관련 필드 없음. `parseSingleLine`은 `{kind:'var', name, value: rhs}` 등 타입 정보 없이 반환
- 변경 후: `const ASSIGN_PATTERN = /^([A-Za-z_]\w*)\s*(?::\s*([^=]+?))?\s*=\s*(.+)$/;`(name, 선택적 명시타입, rhs 3그룹). `export type TypeSource = 'explicit' | 'inferred';` 추가. 세 인터페이스에 `typeLabel: string; typeSource: TypeSource;` 필드 추가(`TextLine`은 변경 없음). `isNumericLiteral(value)`(정수 `/^-?\d+$/` 또는 실수 `/^-?\d*\.\d+$/`), `inferScalarType(value)`(숫자→`number`, `true`/`false`→`boolean`, `null`→`null`, `undefined`→`undefined`, 그 외→`string`), `inferArray1DType(cells)`(전체 숫자→`number[]`, 아니면 `string[]`, 빈 배열→`array`), `inferArray2DType(grid)`(모든 셀 기준 동일 로직, `number[][]`/`string[][]`/`array`) 신규 함수 추가. `parseSingleLine`은 `match[2]?.trim() || undefined`로 명시 타입을 추출해 있으면 `typeSource:'explicit'`로 그대로 사용하고, 없으면 추론 함수 결과로 `typeSource:'inferred'` 채움. 파일 상단 JSDoc에 `name: type = value` 표기법 설명과 "값 내부 콜론은 안전하다"는 설명 추가
- 이유: 사용자가 트레이싱 중 변수의 자료형(`long`, `char`, `Node` 등 언어 불문 자유 문자열)을 함께 기록하고 싶어했고, 타입을 매번 명시하지 않아도 값으로부터 자동 추론되면 입력 부담이 줄어듦. `name:` 바로 뒤 콜론만 캡처하도록 정규식을 설계해 `t = 12:30`, `url = http://x`처럼 값 안에 콜론이 있는 경우 타입으로 오인되지 않게 함(임시 스크립트로 케이스 검증 완료)

#### `frontend/src/components/ui/TracePreview.tsx`
- 변경 전: `VarRow({name, value})`, `Array1DRow({name, cells})`, `Array2DGrid({name, grid})`가 타입 배지 없이 이름만 강조 렌더
- 변경 후: `TypeBadge({typeLabel, typeSource})` 신규 — explicit은 `bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200` 채운 배지, inferred는 `border border-dashed border-gray-300 dark:border-gray-600 italic text-gray-400 dark:text-gray-500` 점선 배지, `title`에 "명시 타입"/"자동 추론" 문구로 마우스오버 구분. 세 Row 컴포넌트가 `typeLabel`/`typeSource` prop을 받아 이름 옆에 `<TypeBadge>` 렌더. `TracePreview`의 switch에서 `line.typeLabel`/`line.typeSource`를 각 Row로 전달
- 이유: explicit(사용자 확신)과 inferred(파서 추측)를 한눈에 구분해 추론 오류를 사용자가 즉시 알아챌 수 있게 함

#### `frontend/src/components/ui/ScratchPadPanel.tsx`
- 변경 전: 안내 문구가 `i = 3` · `arr = [1, 2, 3]` · `grid = [[1,2],[3,4]]` 3개 예시만 나열, placeholder도 타입 명시 예시 없음
- 변경 후: 안내 문구에 `x: long = 3`(타입 명시) 예시 추가, textarea placeholder 첫 줄 다음에 `x: long = 3\n` 추가
- 이유: 새 표기법의 존재를 사용자가 바로 발견할 수 있게 안내

#### `CLAUDE.md`
- 변경 전: `parseTraceLines`/`TracePreview` 행 설명에 타입 배지 관련 언급 없음
- 변경 후: `parseTraceLines` 행에 `name: type = value` 표기법과 "값 기반 타입 자동추론 + `: type` 명시 오버라이드(typeLabel/typeSource)" 문구 추가, `TracePreview` 행에 "+ 타입 배지(explicit/inferred 시각 구분)" 문구 추가
- 이유: 공용 유틸리티 표 최신화

### 복원 방법
이 ID(HIST-20260706-003)만으로 복원 시: `traceNotation.ts`의 `ASSIGN_PATTERN`을 `/^([A-Za-z_]\w*)\s*=\s*(.+)$/`로 되돌리고 `TypeSource`/`typeLabel`/`typeSource` 필드 및 `inferScalarType`/`inferArray1DType`/`inferArray2DType` 함수를 제거하며 `parseSingleLine`을 타입 필드 없이 `{kind, name, value|cells|grid}`만 반환하도록 되돌린다. `TracePreview.tsx`에서 `TypeBadge` 컴포넌트와 각 Row의 `typeLabel`/`typeSource` prop·렌더를 제거한다. `ScratchPadPanel.tsx`의 안내 문구·placeholder에서 `x: long = 3` 예시를 제거한다. `CLAUDE.md`는 두 행을 위 "변경 전" 문구로 되돌린다. 퀴즈 화면(`DailyQuiz_Modified.md` HIST-20260706-003)도 동일 공용 파일을 사용 중이므로 함께 되돌리지 않는 한 파일 자체를 삭제하지 말 것.

## HIST-20260706-002

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 — 풀이 스크래치패드 코드 트레이싱 탭 "타이핑→자동 렌더"로 교체
- **수정 개요**: 직전 HIST-20260706-001에서 도입한 클릭식 블록 위젯(변수 워치 표·1D/2D 배열 그리드·반복 스텝 표, `TraceBlocks.tsx`의 `TraceBlockEditor`)을 제거하고, textarea에 `이름 = 값` 표기법으로 타이핑하면 실시간으로 변수/1D 배열/2D 배열/자유 텍스트를 자동 렌더하는 방식으로 전면 교체. 행·열을 손으로 관리해야 하는 부담과 변수=값 가시성 저하 피드백에 따른 개선. 코드 실행/eval/Function/JSON.parse(실행성 파싱) 전혀 사용하지 않음. 기존 로컬 저장분(`traceBlocks`)은 최초 로드 시 표기법 텍스트로 1회 이관되어 데이터 손실 없음. 퀴즈 화면(`DailyQuiz_Modified.md` HIST-20260706-002)과 공용 컴포넌트.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/traceNotation.ts` | 추가(신규, 공용) | `parseTraceLines(text)`(표기법 순수 파서, `TraceLine` 판별 유니온 반환) + 레거시 이관용 `sanitizeLegacyTraceBlocks(raw)`·`legacyTraceBlocksToNotation(blocks)`. eval/Function/JSON.parse 미사용, 실패 시 항상 `{kind:'text'}`로 폴백(throw 없음) |
| `frontend/src/components/ui/TracePreview.tsx` | 추가(신규, 공용) | `<TracePreview lines />` — `TraceLine[]`을 변수 행(칩)·1D 배열(인덱스 라벨 박스)·2D 배열(행/열 인덱스 헤더 격자)·자유 텍스트(흐린 텍스트)로 렌더하는 읽기 전용 프리뷰. 클릭 편집 UI 없음 |
| `frontend/src/components/ui/TraceBlocks.tsx` | 삭제 | 클릭식 블록 에디터(`TraceBlockEditor`, `createVarsBlock` 등 팩토리, `BlockContainer`/`VarsBlockBody`/`Array1DBlockBody`/`Array2DBlockBody`/`IterBlockBody`) 전체 제거. 미사용 export 잔재 없음 |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정 | `ScratchPadData.traceBlocks`를 `@deprecated` 주석과 함께 `unknown` 타입으로 축소(더 이상 생성·저장 안 함, 구 payload 안전 파싱만 담당). `loadData`가 구버전 `traceBlocks`를 만나면 `sanitizeLegacyTraceBlocks`+`legacyTraceBlocksToNotation`으로 표기법 텍스트를 생성해 `trace` 끝에 합친 뒤 반환(이후 저장 시 `traceBlocks` 필드 자체가 빠짐). `useMemo(() => parseTraceLines(data.trace), [data.trace])`로 프리뷰용 `traceLines` 계산. 코드 트레이싱 탭 JSX를 "표기법 textarea + `<TracePreview>` 자동 렌더" 2단 구성으로 교체(구조화 블록 에디터 렌더 제거) |
| `CLAUDE.md` | 수정 | Shared Utilities 표에서 `TraceBlockEditor`/`sanitizeTraceBlocks`/`TraceBlock`(TraceBlocks.tsx) 행을 `parseTraceLines`/`TraceLine`(traceNotation.ts)·`TracePreview`(TracePreview.tsx) 행으로 교체, `ScratchPadPanel` 설명 문구를 "타이핑→자동 렌더 표기법 방식"으로 갱신 |

### 수정 상세

#### `frontend/src/lib/traceNotation.ts`
- 변경 전: 파일 없음(신규)
- 변경 후: `TraceLine = VarLine | Array1DLine | Array2DLine | TextLine` 판별 유니온. `parseTraceLines(text)`는 줄 단위로 `^([A-Za-z_]\w*)\s*=\s*(.+)$` 매칭 → rhs가 `[`로 시작하면 자체 관용 브래킷 파서(`findMatchingBracketEnd`/`splitTopLevel`/`parseBracketGroup`)로 중첩 깊이를 추적해 최상위 콤마 기준 분리(원소는 표시용 문자열 그대로, 코드 실행 없음). 원소가 모두 `[`로 시작하면 2D, 아니면 1D. 괄호 불일치 등 파싱 실패·매칭 안 되는 줄은 예외 없이 `{kind:'text'}`로 폴백. 빈 줄은 `parseTraceLines`에서 필터링. 레거시 이관용 `sanitizeLegacyTraceBlocks`(구 `vars`/`array1d`/`array2d`/`iter` 블록 항목 단위 안전 파싱)·`legacyTraceBlocksToNotation`(vars→`name = value` 줄들, array1d→`name = [a, b, c]`, array2d→`name = [[...],[...]]`, iter→`# ` 접두 주석 줄들로 직렬화)도 포함
- 이유: 클릭식 위젯의 행·열 관리 부담을 없애고 타이핑만으로 즉시 시각화되게 하면서, 코드 실행 없이 순수 문자열 파싱만으로 안전하게 구현

#### `frontend/src/components/ui/TracePreview.tsx`
- 변경 전: 파일 없음(신규)
- 변경 후: `<TracePreview lines={TraceLine[]} />` — `var`는 이름(인디고 강조)=값 칩 행, `array1d`는 인덱스 라벨이 붙은 가로 박스 행(overflow-x-auto), `array2d`는 행/열 인덱스 헤더가 붙은 테이블 격자, `text`는 흐린 색 `whitespace-pre-wrap` 자유 텍스트. `lines`가 비어있으면 표기법 안내 문구 표시
- 이유: 파싱 결과를 순수 렌더만 담당하는 컴포넌트로 분리해 `ScratchPadPanel`의 책임을 가볍게 유지

#### `frontend/src/components/ui/TraceBlocks.tsx`
- 변경 전: `TraceBlock` 판별 유니온(`vars`/`array1d`/`array2d`/`iter`) + 블록 생성 팩토리 + `sanitizeTraceBlocks` + `<TraceBlockEditor>`(툴바로 블록 추가, 각 블록별 입력 폼 렌더링·행/열 추가삭제·순서이동·라벨 편집)
- 변경 후: 파일 삭제. 레거시 파싱 로직은 `traceNotation.ts`의 `sanitizeLegacyTraceBlocks`로 이관(마이그레이션 전용, 편집 UI 없음)
- 이유: 클릭식 블록 편집 UI 전면 폐지에 따라 더 이상 필요하지 않음. 미사용 export 잔재 방지를 위해 재작성 대신 삭제 선택

#### `frontend/src/components/ui/ScratchPadPanel.tsx`
- 변경 전: `ScratchPadData.traceBlocks: TraceBlock[]`(필수 필드), 코드 트레이싱 탭이 "자유 트레이싱 메모(h-32 textarea)" + "구조화 트레이스 블록(`TraceBlockEditor`, 클릭식 추가/편집)" 2단 구성
- 변경 후: `ScratchPadData.traceBlocks?: unknown`(`@deprecated`, optional). `loadData`에서 `sanitizeLegacyTraceBlocks(p.traceBlocks)` 결과가 있으면 `legacyTraceBlocksToNotation`으로 텍스트화해 `trace`에 합치고, 반환 객체는 `traceBlocks` 필드 자체를 포함하지 않음(다음 저장부터 자동으로 빠짐). 코드 트레이싱 탭은 "표기법 안내 문구 + h-40 textarea" + "자동 렌더 프리뷰(`<TracePreview lines={traceLines} />`)" 2단 구성으로 교체. `useMemo`로 `data.trace` 변경 시에만 재파싱
- 이유: 클릭식 편집 부담을 없애면서 기존 로컬 저장 데이터(변수·배열·반복 스텝)를 표기법 텍스트로 무손실 이관하고, storageKey·디바운스 저장·탭 전환·ESC 닫기 등 기존 흐름은 그대로 유지

#### `CLAUDE.md`
- 변경 전: Shared Utilities 표에 `TraceBlockEditor`/`sanitizeTraceBlocks`/`TraceBlock`(TraceBlocks.tsx) 행 존재
- 변경 후: 해당 행을 `parseTraceLines`/`TraceLine`(traceNotation.ts), `TracePreview`(TracePreview.tsx) 2행으로 교체, `ScratchPadPanel` 설명을 "타이핑→자동 렌더 표기법 방식(traceNotation)"으로 갱신
- 이유: 신규/삭제된 공용 유틸·컴포넌트 위치를 문서에 즉시 반영

### 복원 방법
이 ID(HIST-20260706-002)만으로 복원 시: `frontend/src/lib/traceNotation.ts`·`frontend/src/components/ui/TracePreview.tsx`를 삭제하고, HIST-20260706-001의 "복원 방법"대로 `frontend/src/components/ui/TraceBlocks.tsx`를 재생성(HIST-20260706-001 수정 상세의 "변경 후" 내용 적용)한 뒤 `ScratchPadPanel.tsx`를 다시 `TraceBlockEditor`/`sanitizeTraceBlocks`/`TraceBlock` import 및 `ScratchPadData.traceBlocks: TraceBlock[]` 필수 필드, 코드 트레이싱 탭의 "자유 트레이싱 메모 + `TraceBlockEditor`" 2단 구성으로 되돌린다. `CLAUDE.md` Shared Utilities 표도 HIST-20260706-001 시점 행으로 되돌린다. 단, 퀴즈 화면(`DailyQuiz_Modified.md` HIST-20260706-002)도 동일 공용 파일을 사용 중이므로 함께 되돌리지 않는 한 파일 자체를 삭제하지 말 것.

## HIST-20260706-001

- **날짜**: 2026-07-06
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 — 풀이 스크래치패드 코드 트레이싱 탭 구조화 위젯 개편
- **수정 개요**: 코드 트레이싱 탭을 monospace 자유 메모 단일 필드에서 "자유 메모 + 구조화 트레이스 블록(변수 워치 표·1D 배열 그리드·2D 배열 그리드·반복 스텝 표)" 조합으로 확장. 실행/eval 전혀 없음, 값은 전부 사용자가 직접 입력하는 프론트 전용 편집 위젯이며 localStorage에만 저장(BE/DB 변경 없음). 퀴즈 화면(`DailyQuiz_Modified.md` HIST-20260706-001)과 공용 컴포넌트.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/TraceBlocks.tsx` | 추가(신규, 공용) | `TraceBlock` 판별 유니온 타입(`vars`/`array1d`/`array2d`/`iter`) 정의, 블록 생성 팩토리, `sanitizeTraceBlocks(raw)`(로드 시 항목 단위 안전 파싱), `<TraceBlockEditor blocks onChange />`(블록 추가 툴바 + 4종 블록 렌더링·삭제·순서이동·라벨 편집) |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 수정(순수 확장) | `ScratchPadData`에 `traceBlocks: TraceBlock[]` 필드 추가(EMPTY_DATA도 함께 확장), `loadData`가 `sanitizeTraceBlocks`로 구버전(필드 없음) 데이터를 `[]`로 안전 보정, 코드 트레이싱 탭 렌더를 "자유 트레이싱 메모(기존 textarea 축소 유지)" + "구조화 트레이스 블록(`TraceBlockEditor`)" 조합으로 교체 |
| `CLAUDE.md` | 수정 | Shared Utilities 표에 `TraceBlockEditor`/`sanitizeTraceBlocks`/`TraceBlock` 행 추가, `ScratchPadPanel` 설명에 구조화 트레이싱 반영 |

### 수정 상세

#### `frontend/src/components/ui/TraceBlocks.tsx`
- 변경 전: 파일 없음(신규)
- 변경 후: `VarsBlock{rows:{name,value}[]}` / `Array1DBlock{name,cells:string[],cursor:number|null}` / `Array2DBlock{name,grid:string[][]}` / `IterBlock{columns:string[],rows:string[][]}` 4종 판별 유니온. id는 `crypto.randomUUID?.() ?? 폴백`. `sanitizeTraceBlocks`는 배열이 아니면 `[]`, 각 항목은 타입별 필드 검증을 통과한 것만 채택(손상 항목은 개별 drop, 전체를 버리지 않음)
- 이유: 코드 실행 없이 변수·배열·반복 상태를 손으로 기록할 수 있는 구조화 위젯 제공. `any` 미사용, 타입가드로 안전 파싱

#### `frontend/src/components/ui/ScratchPadPanel.tsx`
- 변경 전: `ScratchPadData = { note, trace, calcHistory }`, 코드 트레이싱 탭은 `data.trace` monospace textarea 1개만 렌더
- 변경 후: `ScratchPadData = { note, trace, calcHistory, traceBlocks }`. `loadData`가 구버전 저장분(`traceBlocks` 키 없음)도 `sanitizeTraceBlocks(undefined)` → `[]`로 안전 처리. storageKey(=문항) 전환 시 기존 로직 그대로 `traceBlocks`도 함께 로드/저장(별도 분기 추가 없음). 코드 트레이싱 탭 JSX는 자유 메모(h-32 축소, 라벨 추가) 아래에 `<TraceBlockEditor>` 배치
- 이유: 기존 자유 트레이싱 메모·storageKey·디바운스 저장 흐름을 그대로 재사용하면서 구조화 블록만 추가 필드로 확장(하위호환, storageKey 불변)

#### `CLAUDE.md`
- 변경 전: Shared Utilities 표에 `TraceBlocks` 관련 행 없음
- 변경 후: `TraceBlockEditor`/`sanitizeTraceBlocks`/`TraceBlock` 행 추가, `ScratchPadPanel` 설명에 "코드 트레이싱 탭은 자유 메모 + 구조화 트레이스 블록(TraceBlocks) 함께 제공" 문구 추가
- 이유: 신규 공용 컴포넌트 위치·용도를 문서에 즉시 반영

### 복원 방법
이 ID(HIST-20260706-001)만으로 복원 시: `frontend/src/components/ui/TraceBlocks.tsx` 파일을 삭제하고, `frontend/src/components/ui/ScratchPadPanel.tsx`에서 `TraceBlockEditor`/`sanitizeTraceBlocks`/`TraceBlock` import를 제거하고 `ScratchPadData`에서 `traceBlocks` 필드를 제거(EMPTY_DATA·loadData도 원복)하며 코드 트레이싱 탭 JSX를 기존 단일 textarea로 되돌린다. `CLAUDE.md` Shared Utilities 표에서 `TraceBlocks` 관련 행을 제거하고 `ScratchPadPanel` 설명 문구를 원복한다. 단, 퀴즈 화면(`DailyQuiz_Modified.md` HIST-20260706-001)도 동일 공용 파일을 사용 중이므로 함께 되돌리지 않는 한 파일 자체를 삭제하지 말 것.

## HIST-20260705-001

- **날짜**: 2026-07-05
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 — 풀이 스크래치패드 1차 릴리스
- **수정 개요**: 시험 응시 화면 우하단에 FAB로 여는 풀이 스크래치패드(자유 메모 · CODE 트레이싱 · 안전 계산기)를 추가. localStorage에만 저장하며 BE/DB 변경·임의 코드 실행 없음.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/safeMathCalc.ts` | 추가(신규) | `evaluateExpression(expr)` — 화이트리스트 정규식 + 자체 재귀하강 파서로 사칙연산 평가. eval/Function 미사용, 항상 `{value}` 또는 `{error}` 반환(throw 없음) |
| `frontend/src/components/ui/ScratchPadPanel.tsx` | 추가(신규) | FAB(연필 아이콘) → 데스크톱은 우측 비모달 드로어, 모바일은 기존 답안 Bottom Sheet 컨벤션 재사용. 자유 메모/코드 트레이싱(CODE 유형 한정)/계산기 3탭, storageKey 단위 500ms 디바운스 localStorage 저장 |
| `frontend/src/app/exam/[id]/page.tsx` | 수정(순수 추가) | `ScratchPadPanel` import 및 문항 렌더 블록에 `storageKey={tpmp_scratchpad:exam:${examId}:${q.id}}` `isCodeQuestion={isCode}`로 1회 마운트. 기존 상태·타이머·제출·답안지 로직 변경 없음 |
| `CLAUDE.md` | 수정 | Shared Utilities 표에 `ScratchPadPanel`, `evaluateExpression` 행 추가 |

### 수정 상세

#### `frontend/src/lib/safeMathCalc.ts`
- 변경 전: 파일 없음(신규)
- 변경 후: `ALLOWED_PATTERN`(숫자/공백/`+ - * / % ( )`)으로 1차 검증 → 토크나이저 → 재귀하강 `Parser`(expression→term→unary→power→primary)로 계산. 0으로 나누기·괄호 불일치·허용 외 문자는 내부 `ScratchCalcError`로 던져지고 `evaluateExpression` 내부 try/catch에서 `{error}`로 변환되어 외부로는 절대 throw되지 않음
- 이유: 임의 코드 실행(eval/Function) 없이 안전하게 계산기 기능 제공

#### `frontend/src/components/ui/ScratchPadPanel.tsx`
- 변경 전: 파일 없음(신규)
- 변경 후: `{ note, trace, calcHistory }` 상태를 storageKey 기준 debounce(500ms) 저장. storageKey 변경 시 이전 키의 pending 저장을 flush한 뒤 새 키 데이터를 로드(패널 open 상태는 유지). lg 이상은 `fixed right-0 top-14 w-80 h-[calc(100vh-3.5rem)]` 비모달 드로어(z-40), lg 미만은 `bg-black/50` 딤 + `rounded-t-2xl` + `max-h-[80vh]` Bottom Sheet(z-50, 딤 클릭/X/ESC로 닫힘)
- 이유: 시험/퀴즈 두 화면에서 공용으로 재사용하기 위해 컴포넌트로 분리

#### `frontend/src/app/exam/[id]/page.tsx`
- 변경 전: `ScratchPadPanel` 미사용
- 변경 후: import 추가 + 개념노트 모달 블록 뒤에 `<ScratchPadPanel storageKey={\`tpmp_scratchpad:exam:${examId}:${q.id}\`} isCodeQuestion={isCode} />` 1회 마운트
- 이유: 문항별로 독립된 스크래치패드 데이터를 유지하기 위해 시험ID+문항ID 조합을 storageKey로 사용

### 복원 방법
이 ID(HIST-20260705-001)만으로 복원 시: `frontend/src/lib/safeMathCalc.ts`, `frontend/src/components/ui/ScratchPadPanel.tsx` 파일을 삭제하고, `frontend/src/app/exam/[id]/page.tsx`에서 `ScratchPadPanel` import 문과 `<ScratchPadPanel .../>` 마운트 라인을 제거하며, `CLAUDE.md` Shared Utilities 표에서 두 행을 제거한다.

## HIST-20260630-001

- **날짜**: 2026-06-30
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 — CODE 문항 CodeBlock 높이 제한 제거
- **수정 개요**: CODE 유형 문항 본문 CodeBlock에 적용된 `max-h-48 overflow-y-auto`(높이 제한 + 내부 스크롤)를 제거하여 코드 전체가 펼쳐지도록 복원. 가독성 회복.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/exam/[id]/page.tsx` | 수정 | CodeBlock의 `className="max-h-48 overflow-y-auto"` prop 제거 (L662) |

### 수정 상세

#### `frontend/src/app/exam/[id]/page.tsx` (L661-663 영역)
- 변경 전:
  ```tsx
  {q.code && <CodeBlock code={q.code} language={q.language} className="max-h-48 overflow-y-auto" />}
  ```
- 변경 후:
  ```tsx
  {q.code && <CodeBlock code={q.code} language={q.language} />}
  ```
- 이유: 직전 작업(HIST-20260629-001)에서 "긴 코드에서도 답안칸이 같은 화면에 보이도록" max-h-48을 추가했으나, 사용자 피드백으로 코드가 좁은 박스에 갇혀 스크롤해야 하는 가독성 문제가 제기됨. 높이 제한 없이 전체 코드를 펼쳐 표시하도록 되돌림. ExamResultDisplay 내 결과 화면의 CodeBlock(showHeader=false)은 대상 아님 — 무변경.

### 복원 방법
이 ID(HIST-20260630-001)만으로 복원 시: `exam/[id]/page.tsx` L662의 `{q.code && <CodeBlock code={q.code} language={q.language} />}`에 `className="max-h-48 overflow-y-auto"` prop을 다시 추가한다.

---

## HIST-20260629-001

- **날짜**: 2026-06-29
- **수정 범위**: 사용자 프론트엔드 / 시험 응시·결과 — CODE 문항 답안 입력·결과 표시 개선
- **수정 개요**: 시험 응시 CODE 답안 입력을 기존 `<textarea rows={4}>`에서 공용 `CodeAnswerInput`(rows=6, Tab 들여쓰기)으로 교체. 문제 CodeBlock에 `max-h-48 overflow-y-auto` 추가. 시험·퀴즈 공용 결과 화면 `ExamResultDisplay`에서 CODE 유형의 내 답/정답을 인라인 텍스트 대신 `CodeBlock`(구문강조)으로 렌더.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/exam/[id]/page.tsx` | 수정 | CODE 답안 textarea → CodeAnswerInput(rows=6) 교체, CodeBlock에 max-h 추가 |
| `frontend/src/components/ui/ExamResultDisplay.tsx` | 수정 | CODE 유형 내 답/정답을 CodeBlock(showHeader=false, size="xs")으로 표시, 그 외 유형은 기존 span 유지 |

### 수정 상세

#### `frontend/src/app/exam/[id]/page.tsx`
- CODE 답안 입력(L702 영역): `<textarea rows={4} font-mono>` → `<CodeAnswerInput value={answers[q.id] ?? ''} onChange={v => handleAnswer(q.id, v)} placeholder="코드 답안을 입력하세요" rows={6} />` (제출은 별도 버튼이므로 onCtrlEnter 미전달). 객관식·OX·단답은 무변경
- CodeBlock(L661): `className="max-h-48 overflow-y-auto"` 추가

#### `frontend/src/components/ui/ExamResultDisplay.tsx`
- 내 답/정답 표시부(L216 영역): `item.questionType === 'CODE'`이면 내 답·정답을 각각 `<CodeBlock code={...} language={item.language} showHeader={false} size="xs" className="mt-1" />`로 렌더(미제출은 "미제출" span 유지, 정답은 오답일 때만 표시). OX·SHORT_ANSWER는 기존 span 그대로
- 이유: 코드 답안이 길거나 다줄일 때 인라인 span은 가독성이 낮음. 공용 CodeBlock 재사용
- 비고: `QuestionResult.language?: string` 기존 존재로 타입 변경 없음. `ExamResultDisplay`는 시험 결과·퀴즈 결과 양쪽 공용이나 CODE 조건 분기라 기존 경로 무영향

### 복원 방법
이 ID(HIST-20260629-001)만으로 복원 시: `exam/[id]/page.tsx`의 CodeAnswerInput을 기존 `<textarea rows={4} className="...font-mono...">`로 되돌리고 CodeBlock의 max-h 제거, `ExamResultDisplay.tsx`의 CODE 분기를 제거해 모든 비객관식 유형을 기존 span 표시로 복원, CodeBlock import 제거.

---

## HIST-20260626-005

- **날짜**: 2026-06-26
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 — 개념노트 버튼 시각 개선
- **수정 개요**: 시험 응시 화면의 개념노트 버튼을 퀴즈 화면과 동일한 인디고 테마(라벨 "개념 정리"/"개념 정리됨", 항상 인디고 테두리)로 통일. 비활성 상태에서도 인디고 톤 유지.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/exam/[id]/page.tsx` | 수정 | 개념노트 버튼 className·라벨·title 변경 — 인디고 테마 통일 |

### 수정 상세

#### `frontend/src/app/exam/[id]/page.tsx` (L638-652 영역)
- 변경 전:
  - className: 노트 있음 `text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100`, 없음 `text-gray-400 border-transparent hover:border-gray-200 hover:text-indigo-500 hover:bg-indigo-50`
  - 라벨: 있음 `'노트'`, 없음 `'메모'`
  - title: `"개념노트 작성"`
- 변경 후:
  - className: 노트 있음 `bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100`, 없음 `border-indigo-200 text-indigo-500 hover:bg-indigo-50` (항상 인디고 테두리, 회색 비활성 제거)
  - 라벨: 있음 `'개념 정리됨'`, 없음 `'개념 정리'`
  - title: `"이 문제의 개념을 정리합니다"`
- 이유: 퀴즈(HIST-20260626-001)와 동일한 인디고 테마로 통일하여 두 화면 간 UI 일관성 확보. `questionNotes[q.id]` 판정 로직 및 `openNoteModal` 동작 무변경.

### 복원 방법
이 ID(HIST-20260626-005)만으로 복원 시: `exam/[id]/page.tsx` 해당 버튼의 className을 `text-gray-400 border-transparent hover:border-gray-200 hover:text-indigo-500 hover:bg-indigo-50` (없음) / `text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100` (있음)으로, 라벨을 `'메모'`/`'노트'`로, title을 `"개념노트 작성"`으로 되돌린다.

---

## HIST-20260626-004

- **날짜**: 2026-06-26
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 (답안 현황 접근 UI)
- **수정 개요**: 모바일(lg 미만) 답안 현황 접근을 우하단 FAB에서 상단 고정(sticky) 요약바로 교체 — 탭 시 기존 바텀시트 오픈

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/exam/[id]/page.tsx` | 수정 | FAB 블록 삭제, sticky 요약바 추가, main 내부 p-4 wrapper div 삽입 |

### 수정 상세

#### `frontend/src/app/exam/[id]/page.tsx`

- **변경 전**: 모바일 답안 접근이 `fixed bottom-4 right-4 lg:hidden z-40` FAB(`답안 N/M`)였음. `<main className="flex-1 mt-14 p-4">`로 p-4가 main에 직접 있었음.
- **변경 후**: FAB 제거. `<main className="flex-1 mt-14">`(p-4를 내부 wrapper div로 이동). main 최상단에 `sticky top-14 z-30 lg:hidden w-full` 요약바(button) 삽입, 그 아래 `<div className="p-4">`로 기존 콘텐츠 감쌈.
- **이유**: FAB는 콘텐츠 위에 떠 있어 가시성이 떨어지고("영역이 안 보인다"는 사용자 피드백), 탭 영역이 좁음. sticky 요약바는 헤더 바로 아래 항상 노출되어 진행 상황 확인이 쉽고 전체 가로가 탭 영역이라 접근성이 개선됨.

### 요약바 동작 규격

| 항목 | 내용 |
|------|------|
| 위치 | `sticky top-14 z-30` — 헤더(fixed h-14) 바로 아래, 스크롤 시 상단 고정 |
| 노출 조건 | `lg:hidden` — lg 미만 화면 전용(lg 이상은 기존 우측 사이드바 유지) |
| 표시 내용 | 인디고 진행 바(h-0.5, 답한/총 비율) + `답안 N/M · 미응답 K`(+ flagged>0이면 `· 체크 F`) + 우측 "답안 보기" chevron |
| 탭 동작 | `setShowAnswerSheet(true)` → 기존 바텀시트 그대로 오픈(문항 이동·제출 무수정) |
| 데이터 소스 | `Object.keys(answers).length`, `questions.length`, `flagged.size` |

### 복원 방법

HIST-20260626-004 복원 시:
1. `<main className="flex-1 mt-14">`를 `<main className="flex-1 mt-14 p-4">`로 되돌린다.
2. sticky 요약바 `<button className="sticky top-14 z-30 lg:hidden ...">` 블록 전체 삭제.
3. `<div className="p-4">` 래퍼 태그 및 닫는 `</div>` 제거.
4. `</main>` 바로 뒤(바텀시트 앞)에 FAB 복원: `<button onClick={() => setShowAnswerSheet(true)} className="fixed bottom-4 right-4 lg:hidden z-40 ...">답안 {Object.keys(answers).length}/{questions.length}</button>`.

---

## HIST-20260626-003

- **날짜**: 2026-06-26
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 게이트 화면 — 최근 응시일 표시
- **수정 개요**: 게이트 화면에 최신 회차의 "최근 응시일"을 표시. BE 응답(`ExamHistoryDetailResponse.takenAt`)·FE 타입(`ExamHistoryDetailResult.takenAt`)은 이미 존재하여 표시 배선만 추가(BE 변경·재기동 불필요).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/exam/[id]/page.tsx` | 수정 | `takenAt` state 추가, init()에서 `saved.takenAt` 세팅, 게이트 화면에 "최근 응시일" 표시 |

### 수정 상세

#### `app/exam/[id]/page.tsx`

**1. 상태 추가 (`attemptCount` 선언 인근)**
- `const [takenAt, setTakenAt] = useState<string | null>(null);` 추가 — 게이트에 표시할 최신 응시일 보관

**2. init() latestRes 처리**
- `setAttemptCount(saved.attemptCount ?? 1);` 직후에 `setTakenAt(saved.takenAt ?? null);` 추가 — undefined 방어(null 폴백)

**3. 게이트 화면 — "총 N회 응시" 칩 아래에 응시일 줄 추가**
- `takenAt`이 있을 때만 렌더:
  ```tsx
  {takenAt && (
    <p className="text-xs text-gray-400">
      최근 응시일:{' '}
      <span className="font-medium text-gray-500">
        {new Date(takenAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
      </span>
    </p>
  )}
  ```
- 포맷: `ko-KR` 날짜(예: 2026년 6월 26일), 시간 미표시. 다회차이므로 "최근 응시일"로 표기(최신 1건 기준).

### 복원 방법
이 ID(HIST-20260626-003)만으로 복원 시:
1. `exam/[id]/page.tsx`에서 `takenAt` useState 제거
2. `init()`에서 `setTakenAt(...)` 라인 제거
3. 게이트 화면의 "최근 응시일" 블록(`{takenAt && (...)}`) 제거

---

## HIST-20260626-002

- **날짜**: 2026-06-26
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 게이트 화면 — 다회차 응시 정보 표기 보강
- **수정 개요**: 게이트 화면("이미 응시한 시험입니다")에 총 응시 횟수 칩과 "전체 이력 보기" 보조 링크를 추가. 타입에 `attemptCount` 필드 추가.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `ExamHistoryDetailResult`에 `attemptCount?: number` 필드 추가 |
| `frontend/src/app/exam/[id]/page.tsx` | 수정 | `attemptCount` state 추가, init()에서 세팅, 게이트 화면 UI 보강(횟수 칩 + 전체 이력 링크) |

### 수정 상세

#### `types/index.ts`
- 변경 전: `ExamHistoryDetailResult` 6필드(historyId/total/correct/score/takenAt/results)
- 변경 후: `attemptCount?: number` optional 필드 추가 (주석: "getLatestResult 전용; 회차 결과 조회 시 1")
- 이유: BE 응답에 새로 추가된 attemptCount를 TS strict 타입으로 수용. optional로 선언해 기존 코드 하위 호환 유지.

#### `app/exam/[id]/page.tsx`

**1. 상태 추가 (L116 인근)**
- 변경 전: `pendingResult` state만 있음
- 변경 후: `const [attemptCount, setAttemptCount] = useState(0);` 추가 — 게이트 화면에 표시할 총 응시 횟수 보관

**2. init() latestRes 처리 (L167 인근)**
- 변경 전: `setPendingResult(restored);` 직전에 attemptCount 세팅 없음
- 변경 후: `setAttemptCount(saved.attemptCount ?? 1);` 추가 — undefined/0 방어(기본 1)

**3. 게이트 화면 제목 영역 (L389-392 인근)**
- 변경 전: `<p className="text-sm text-gray-500">이미 응시한 시험입니다</p>`
- 변경 후: 안내 문구 옆에 `attemptCount > 0`이면 인디고 배경 칩(`총 N회 응시`) 인라인 표시. flex-wrap으로 좁은 화면 대응.

**4. 보조 액션 영역 (L416-441 인근)**
- 변경 전: 버튼 2개([지난 결과 보기]/[다시 풀기]) + 하단 텍스트 링크 1개(시험 목록으로 돌아가기)
- 변경 후: 버튼 2개 유지 → 하단에 `border-t` 구분선 + 보조 액션 영역 추가:
  - "전체 이력 보기" 텍스트 버튼 — 시계 아이콘, `router.push('/user/exam-history')` — indigo 톤으로 주요 버튼과 시각적 위계 구분
  - "시험 목록으로 돌아가기" 텍스트 링크 — 기존과 동일, 위계 최하위(gray-400)
- /user/exam-history는 examinationId 필터 미지원 → 일반 이력 목록으로 이동 (필터 신규 구현은 이번 범위 외)

### 복원 방법
이 ID(HIST-20260626-002)만으로 복원 시:
1. `types/index.ts`에서 `ExamHistoryDetailResult.attemptCount` 필드 제거
2. `exam/[id]/page.tsx`에서 `attemptCount` useState 제거
3. `init()`에서 `setAttemptCount(...)` 라인 제거
4. 게이트 화면 제목 영역을 `<p className="text-sm text-gray-500">이미 응시한 시험입니다</p>` 단일로 복원
5. 보조 액션 영역(border-t 포함 블록)을 `<button onClick={() => router.push('/user/exams')} ...>시험 목록으로 돌아가기</button>` 단일로 복원

---

## HIST-20260626-001

- **날짜**: 2026-06-26
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 화면
- **수정 개요**: 이미 응시 이력이 있는 시험 진입 시 결과 화면으로 직행하지 않고 "지난 결과 보기 / 다시 풀기" 선택 게이트 화면을 먼저 표시하도록 UX 개선

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/exam/[id]/page.tsx` | 수정 | pendingResult 상태 추가, init() ②단계 수정, 선택 게이트 화면 렌더 분기 추가, handleRetake 공통화, 타이머 자동제출 가드 추가 |

### 수정 상세

#### `frontend/src/app/exam/[id]/page.tsx`

**1. 상태 추가 (L115-116)**
- 변경 전: `result` 상태만 존재
- 변경 후: `pendingResult: ExaminationSubmitResult | null` 상태 추가 — 이력 복원 결과를 사용자 선택 전까지 보관
- 이유: 결과 직행 없이 게이트 화면을 통한 선택이 필요하기 때문

**2. init() ②단계 (L176-179)**
- 변경 전: `setResult(restored); examDone.current = true; return;`
- 변경 후: `setPendingResult(restored); examDone.current = true; return;`
- 이유: 이력 복원 결과를 `result`가 아닌 `pendingResult`에 보관해 게이트 화면을 경유하도록 변경

**3. 타이머 자동제출 가드 (L259, L263)**
- 변경 전: `const timerActive = !result && secondsLeft > 0;` / `if (!result && secondsLeft === 0 && !loading)`
- 변경 후: `const timerActive = !result && !pendingResult && secondsLeft > 0;` / `if (!result && !pendingResult && secondsLeft === 0 && !loading)`
- 이유: 게이트 상태에서 secondsLeft가 0이면 자동제출이 잘못 트리거되는 것을 방지

**4. handleRetake 공통화 (L313)**
- 변경 전: `setResult(null);` 만 호출
- 변경 후: `setResult(null); setPendingResult(null);` — 게이트 화면에서 호출 시에도 pendingResult 초기화
- 이유: 결과 화면과 게이트 화면 양쪽에서 동일한 함수를 재사용하여 중복 로직 방지

**5. 선택 게이트 화면 렌더 분기 추가 (L373-449)**
- 변경 전: `result` 있으면 결과 화면, 없으면 응시 UI
- 변경 후: `result` → 결과 화면 / `pendingResult` → 선택 게이트 화면 / else → 응시 UI
- 게이트 화면 구성: 시험 제목, "이미 응시한 시험입니다" 안내, 점수·정답수·정답률 요약 카드, [지난 결과 보기] / [다시 풀기] 버튼, 시험 목록으로 링크
- [지난 결과 보기]: `setResult(pendingResult); setPendingResult(null);` → 기존 ExamResultDisplay 표시
- [다시 풀기]: `handleRetake()` 호출 → 세션 reset·타이머 재시작·응시 UI 진입

### 복원 방법
이 ID(HIST-20260626-001)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 항목에 적용한다.
- `pendingResult` 상태 제거
- `setPendingResult(restored)` → `setResult(restored)`로 복구
- `timerActive`, 자동제출 조건에서 `!pendingResult` 제거
- `handleRetake` 내 `setPendingResult(null)` 제거
- `if (pendingResult)` 렌더 분기 블록 전체 삭제

---

## HIST-20260625-001

- **날짜**: 2026-06-25
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 — 모바일 답안 현황 접근
- **수정 개요**: lg 미만 화면에서 답안 접근 불가 문제 해결 — 기존 사이드바 `hidden lg:flex` 전환, 답안 목록 마크업을 `AnswerSheetContent` 컴포넌트로 공통화, 모바일 FAB(하단 고정 버튼) + Bottom Sheet 오버레이 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/exam/[id]/page.tsx` | 수정 | `AnswerSheetContent` 컴포넌트 추출, 사이드바 `hidden lg:flex` 전환, 모바일 FAB+Bottom Sheet 추가, `showAnswerSheet` 상태 추가 |

### 수정 상세

#### `frontend/src/app/exam/[id]/page.tsx`
- 변경 전:
  - `w-full lg:w-64 shrink-0 flex flex-col gap-4` — lg 미만에서도 답안지가 렌더되나 레이아웃이 문제 영역 아래로 밀려 접근하기 어려움
  - 답안 목록 마크업이 사이드바 내부에 인라인으로 작성됨 (중복 방지 불가)
  - 모바일용 진입점 없음
- 변경 후:
  - `AnswerSheetContent` 함수 컴포넌트 추출 (파일 상단, `ExamTakingPage` 선언 전): `questions, answers, flagged, current, setCurrent, onNavigate?` props 수신. 답안 버튼 목록 + 범례를 렌더. `onNavigate`는 모바일 시트에서 문항 이동 후 시트를 닫기 위해 사용.
  - 사이드바: `hidden lg:flex w-64 shrink-0 flex-col gap-4` — lg 이상에서만 표시. 내부 답안 목록은 `AnswerSheetContent` 사용.
  - `showAnswerSheet: boolean` 상태 추가 (초기 false)
  - FAB: `fixed bottom-4 right-4 lg:hidden z-40` — "답안 N/M" 텍스트+아이콘. 클릭 시 `setShowAnswerSheet(true)`.
  - Bottom Sheet: `showAnswerSheet` true 일 때 `lg:hidden fixed inset-0 z-50` 오버레이. 딤 배경(클릭 시 닫힘) + 시트 본체(`rounded-t-2xl max-h-[80vh]`). 헤더(닫기 버튼) + 스크롤 가능 `AnswerSheetContent`(onNavigate로 시트 닫힘) + 제출 버튼 (`setShowAnswerSheet(false); submitExam(false)` 호출).
- 이유: JS `alert/confirm`이 아닌 DOM 오버레이로 구현. 기존 채점/타이머/제출 로직은 무변경(레이아웃/표시 계층만 수정). CLAUDE.md 공통화 원칙에 따라 답안 목록 마크업을 `AnswerSheetContent`로 추출하여 사이드바와 시트가 동일한 코드를 재사용.

**답안목록 공통화 여부와 근거**: 공통화 적용.
- 기존 사이드바 답안 목록은 map/className 조건 분기 포함 약 40줄. 시트에서 그대로 복붙 시 두 곳 모두 수정해야 하는 중복이 발생.
- CLAUDE.md "동일 로직이 2곳 이상 필요하면 공통 위치에 추출 후 import" 원칙 적용.
- `AnswerSheetContent`는 파일 내 함수 컴포넌트로 추출(같은 파일 내, 별도 파일 이동 불필요 — 해당 페이지 전용이므로). `onNavigate?` optional prop으로 사이드바(onNavigate 불필요)와 시트(onNavigate = setShowAnswerSheet(false))를 동일 컴포넌트로 커버.

### 복원 방법
이 ID(HIST-20260625-001)만으로 복원 시:
1. `AnswerSheetContent` 함수 컴포넌트 블록 제거.
2. 사이드바 div를 `w-full lg:w-64 shrink-0 flex flex-col gap-4`로 되돌리고, 내부 `<AnswerSheetContent ...>`를 기존 인라인 map 마크업으로 복원.
3. `showAnswerSheet` useState 제거.
4. FAB 버튼 블록 제거.
5. Bottom Sheet 블록 제거.

---

## HIST-20260623-001

- **날짜**: 2026-06-23
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 타이머 보강 (서버 세션 기반 즉시 자동제출)
- **수정 개요**: 마운트 시 POST /start 호출로 서버 기준 남은 시간을 받아 타이머 초기화. 시간 만료 시 즉시 자동제출(버튼 불필요). 1분 경고 배너, 재응시 시 세션 reset, submitFnRef로 stale closure 방지.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `ExamSession` 인터페이스 추가 |
| `frontend/src/services/examinationService.ts` | 수정 | `userStartExam(id, reset)` 메서드 추가, ExamSession import 추가 |
| `frontend/src/app/exam/[id]/page.tsx` | 수정 | 타이머 전면 보강 (서버 세션, 자동제출, 1분 배너, submitFnRef, handleRetake 개선) |

### 수정 상세

#### `types/index.ts`
- 변경 전: `ExamSession` 없음
- 변경 후: `interface ExamSession { examinationId: number; startedAt: string; remainingSeconds: number; }` ExaminationDetail 다음에 추가
- 이유: 서버 세션 응답 타입 정의

#### `services/examinationService.ts`
- 변경 전: `userStartExam` 없음
- 변경 후: `userStartExam: (id, reset=false) => apiClient.post<ApiResponse<ExamSession>>(\`/user/examinations/${id}/start\`, null, { params: { reset } })`
- 이유: 세션 시작 API 호출

#### `app/exam/[id]/page.tsx`
- 변경 전: `secondsLeft` 초기값 `60*60` 고정, Promise.all 병렬 마운트, `timeUp` state + 전용 화면(버튼 클릭 후 제출), `handleSubmit` 단일, 타이머 `if(!exam || result)` 조건
- 변경 후:
  - `secondsLeft` 초기값 0. `timeUp`/전용 화면 제거.
  - 마운트 effect를 순차 await로 전환: ①detail ②latestResult(성공→결과화면, 404→③) ③userStartExam→setSecondsLeft
  - `submitExam(isAutoSubmit)` 단일 함수: 가드(examDone/submitting), isAutoSubmit이 아닐 때만 flagAlert+confirm, finally setSubmitting(false)
  - `submitFnRef` — 매 렌더 최신 클로저 갱신 → setInterval stale closure 방지
  - 타이머 effect: `timerActive = !result && secondsLeft > 0` boolean 의존. next===60 → 1분 배너 8초. next<=0 → clearInterval + submitFnRef(true)
  - 로드 후 remainingSeconds<=0 케이스: timerActive=false이면서 result 없고 secondsLeft==0이면 즉시 submitFnRef(true)
  - 헤더 타이머: `submitting ? '채점 중...' : formatTime(secondsLeft)`
  - 1분 배너 JSX: showWarningBanner → fixed amber 배너 (헤더 아래 top-14)
  - `handleRetake`: warningShown.current=false 추가, `userStartExam(examId, true)` 호출 → setSecondsLeft(data.remainingSeconds), 폴백 exam.timeLimit*60
- 이유: 새로고침·탭전환 후에도 서버 시작시각 기준으로 남은 시간을 정확히 복원, 만료 즉시 자동제출

### 복원 방법
이 ID(HIST-20260623-001)만으로 복원 시:
1. `types/index.ts`에서 `ExamSession` 인터페이스 제거
2. `services/examinationService.ts`에서 `userStartExam` 제거, ExamSession import 제거
3. `app/exam/[id]/page.tsx`를 HIST-20260615-002 이후 상태로 복원 (Promise.all 병렬, secondsLeft 초기값 detail.timeLimit*60, timeUp 전용 화면 재추가, handleSubmit 단일, warningShown/showWarningBanner 제거)

---

## HIST-20260615-002

- **날짜**: 2026-06-15
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 화면 (개념노트 모달 공용화)
- **수정 개요**: 시험 응시 화면의 인라인 개념노트 모달을 공용 컴포넌트 `ConceptNoteModal`로 추출(동작 보존). 데일리 퀴즈와 모달 로직 공유.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/exam/[id]/page.tsx` | 수정 | 인라인 모달 JSX + `handleSaveNote` + 모달 관련 개별 state 제거 → `ConceptNoteModal` 사용 (`noteTarget` 단일 state로 단순화) |

### 수정 상세

#### `app/exam/[id]/page.tsx`
- **변경 전**: `noteModal/noteQuestionId/noteId/noteTitle/noteContent/noteSaving/noteSaved` 7개 state + 인라인 모달 JSX(약 48줄) + `handleSaveNote`.
- **변경 후**: `noteTarget: { question, idx } | null` 단일 state. `openNoteModal`은 `setNoteTarget`만 수행. 모달은 공용 `ConceptNoteModal`을 `key={question.id}`로 렌더 — `link={{ questionId }}`, `defaultTitle`은 `stripHtml(content)` 40자, `existingNote=questionNotes[id]`, `onSaved`로 맵 갱신.
- `questionNotes` 적재(마운트 시 getMyNotes → questionId 매핑)·노트 버튼은 기존 유지. 동작 보존.
- **검증**: `npx tsc --noEmit` 통과. 크롬 — 다시 풀기로 응시 화면 진입 → '메모' 클릭 → 공용 모달 정상 표시(제목 'Q1. …' 자동). 회귀 없음.

### 복원 방법
이 ID(HIST-20260615-002)로 복원 시 인라인 모달 JSX·개별 state·`handleSaveNote`를 되돌린다. (공용 모달은 퀴즈에서도 사용하므로 함께 정리해야 함 — UserQuizExam_Modified.md HIST-20260615-001)

---

## HIST-20260615-001

- **날짜**: 2026-06-15
- **수정 범위**: 공통 프론트엔드 / 다크모드 전역 스타일
- **수정 개요**: 결과 화면 하단 sticky 바 배경(`bg-gray-50/95`)이 다크모드에서 밝은색으로 보이던 문제 수정 — globals.css의 `.dark` 불투명도 오버라이드에 `/95` 변형이 누락되어 있던 것을 추가.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/globals.css` | 수정 | `.dark .bg-gray-50\/95 { background-color: rgb(17 24 39 / 0.95); }` 추가 |

### 수정 상세

#### `app/globals.css`
- **문제**: 이 프로젝트는 `dark:` 프리픽스 대신 globals.css의 전역 `.dark .bg-*` 오버라이드로 다크모드를 처리한다. 불투명도 변형은 `.bg-gray-50\/50`, `.bg-gray-50\/60`만 정의돼 있어, HIST-20260614-003에서 sticky 바에 사용한 `bg-gray-50/95`는 다크 오버라이드가 없어 라이트 팔레트(흰색 계열) 그대로 렌더됐다.
- **변경 후**: `.dark .bg-gray-50\/95 { background-color: rgb(17 24 39 / 0.95); }` 추가 → 다크모드에서 sticky 바가 페이지 배경(#111827)과 동일한 톤으로 렌더. 라이트모드는 `.dark` 미적용으로 영향 없음.
- **검증**: 크롬 스크린샷(다크모드) — `/exam/14` 결과 화면 하단 sticky 바가 어두운 배경으로 정상 표시, 흰색 띠 사라짐 확인.

### 복원 방법
이 ID(HIST-20260615-001)로 복원 시 globals.css에서 `.dark .bg-gray-50\/95` 규칙을 제거한다.

---

## HIST-20260614-003

- **날짜**: 2026-06-14
- **수정 범위**: 사용자 프론트엔드 / 시험 결과 화면(공용 컴포넌트)
- **수정 개요**: 결과 화면 하단 액션 버튼이 20문항 아코디언 아래 맨 끝에 있어 스크롤해야 닿던 UX 문제 해결 — '다시 풀기 / 시험 목록으로' 버튼을 `sticky bottom-0` 액션 바로 변경해 스크롤 위치와 무관하게 항상 표시.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/ExamResultDisplay.tsx` | 수정 | 하단 버튼 컨테이너를 `sticky bottom-0` + 반투명 배경(backdrop-blur) + 상단 보더로 변경 |

### 수정 상세

#### `components/ui/ExamResultDisplay.tsx`
- **변경 전**: 버튼 `<div className="flex gap-2">`가 일반 흐름 맨 끝에 위치 → 20문항을 모두 스크롤해야 버튼 도달.
- **변경 후**: `<div className="sticky bottom-0 -mx-4 px-4 py-3 bg-gray-50/95 backdrop-blur border-t border-gray-200 flex gap-2">`. sticky는 흐름 공간을 차지하면서 스크롤 중엔 뷰포트 하단에 고정되므로, 별도 패딩 없이 콘텐츠를 가리지 않고 항상 접근 가능. `-mx-4 px-4`로 컨테이너(px-4) 전체 폭 배경 처리.
- 시험 응시 결과(다시 풀기+목록), 이력 상세(목록 단일) 양쪽 모두 적용됨. 데스크톱에서는 하단 고정 내비가 없어 겹침 없음.
- **검증**: 크롬 스크린샷 — `/exam/14` 결과 화면에서 스크롤 전/맨아래 모두 sticky 바 정상 표시(문항 가림 없음), `/user/exam-history/2`에서 단일 버튼 sticky 정상.

### 복원 방법
이 ID(HIST-20260614-003)로 복원 시 버튼 컨테이너를 `flex gap-2`(일반 흐름)로 되돌린다.

---

## HIST-20260614-002

- **날짜**: 2026-06-14
- **수정 범위**: 사용자 프론트엔드 / 시험 응시·결과 화면
- **수정 개요**: 완료한 시험을 다시 열면 결과 화면만 떠 재응시가 불가능하던 문제 해결 — 결과 화면에 '다시 풀기' 버튼을 추가해 응시 상태를 초기화하고 처음부터 재응시 가능하게 함(재응시 결과는 시험 이력에 새로 쌓임).

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/ExamResultDisplay.tsx` | 수정 | 선택적 `onRetake` prop 추가 — 제공 시 '다시 풀기' 버튼을 '시험 목록으로' 옆에 표시 |
| `frontend/src/app/exam/[id]/page.tsx` | 수정 | `handleRetake`(상태 초기화) 추가, 결과 화면에 `onRetake` 전달 |

### 수정 상세

#### `components/ui/ExamResultDisplay.tsx`
- **변경 전**: 하단에 '시험 목록으로'(onBack) 버튼 1개만 존재.
- **변경 후**: 선택적 `onRetake?: () => void` prop 추가. 제공되면 하단을 flex 2버튼('다시 풀기' 아웃라인 + '시험 목록으로' 솔리드)으로 렌더. onRetake 미전달 시(시험 이력 상세 화면) 기존처럼 단일 버튼 — 이력 조회 화면에는 재응시 버튼이 노출되지 않음.

#### `app/exam/[id]/page.tsx`
- **문제**: 마운트 시 `userGetLatestResult`로 이전 결과를 조회해 `result`를 세팅 → 완료한 시험은 항상 결과 화면만 표시되고 재응시 경로가 없었음.
- **변경 후**: `handleRetake` 추가 — `result=null`, `answers={}`, `flagged=∅`, `current=0`, `timeUp=false`, `secondsLeft=timeLimit*60`, `examDone.current=false`로 초기화. result가 null이 되면 타이머 effect가 재시작되고 응시 UI가 처음부터 표시됨. 결과 화면에 `onRetake={handleRetake}` 전달.
- 재응시 후 제출은 기존 `handleSubmit` 흐름을 그대로 타며, 백엔드가 제출마다 새 이력을 생성하므로 시험 이력에 누적됨.
- **검증**: `npx tsc --noEmit` 통과. 크롬 — 완료한 시험(id 14) 진입 시 결과 화면에 '다시 풀기' 버튼 표시, 클릭 시 Q1부터 응시 화면 전환 + 타이머 150분 리셋 + 답안 초기화 스크린샷 확인.

### 복원 방법
이 ID(HIST-20260614-002)로 복원 시 `ExamResultDisplay`의 `onRetake` prop과 버튼을 제거하고, `exam/[id]`의 `handleRetake` 및 `onRetake` 전달을 제거한다.

---

## HIST-20260614-001

- **날짜**: 2026-06-14
- **수정 범위**: 사용자 프론트엔드 / 시험 결과 문항별 상세 영속화
- **수정 개요**: 시험 결과 화면이 제출 응답을 메모리(state)에만 담아 새로고침 시 사라지던 것을, 마운트 시 재조회 API(GET /user/examinations/{id}/result)로 복원하도록 변경. amber "재확인 불가" 배너를 green "저장됨" 안내로 교체

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | QuestionResult.questionId nullable화, code·language 추가, ExaminationSubmitResult.historyId 추가, ExamHistoryDetailResult 신규, MVP 주석 제거 |
| `frontend/src/services/examinationService.ts` | 수정 | userGetLatestResult(id) 함수 추가 + ExamHistoryDetailResult import |
| `frontend/src/app/exam/[id]/page.tsx` | 수정 | 마운트 시 결과 재조회·복원 로직(Promise.all), examDone 처리, amber→green 배너 교체 |

### 수정 상세

#### `types/index.ts`
- 변경 전: `QuestionResult.questionId: number`, `ExaminationSubmitResult`에 historyId 없음, "MVP: 새로고침 시 재조회 불가" 주석
- 변경 후: `questionId: number | null`, `code?`/`language?` 추가, `ExaminationSubmitResult.historyId: number | null` 추가, 신규 `ExamHistoryDetailResult`(historyId·total·correct·score·takenAt·results), MVP 주석 제거
- 이유: 백엔드 응답 계약 변경(historyId·code·language) 반영 + 재조회 응답 타입 정의. 스냅샷 question_id가 null일 수 있어 nullable화

#### `services/examinationService.ts`
- 변경 전: `userGetLatestResult` 없음
- 변경 후: `userGetLatestResult: (id) => apiClient.get<ApiResponse<ExamHistoryDetailResult>>(\`/user/examinations/${id}/result\`)` 추가
- 이유: 저장된 결과 재조회 API 호출 함수

#### `app/exam/[id]/page.tsx`
- 변경 전: 마운트 시 시험 상세만 로드, result는 제출 직후에만 채워짐(새로고침 시 소실). amber 배너 "이 화면을 벗어나면 문항별 결과를 다시 확인할 수 없습니다."
- 변경 후: 시험 상세 로드 + `userGetLatestResult` 재조회를 `Promise.all`로 함께 수행 후 loading 해제. 재조회 성공 시 `ExamHistoryDetailResult`→`ExaminationSubmitResult` 매핑하여 setResult + `examDone.current=true`(이탈 경고 비활성). 404/오류는 catch로 조용히 무시(미응시→시험 화면 진행). 배너 green "결과는 저장되어 있어 나중에 다시 확인할 수 있습니다."로 교체
- 이유: 새로고침·직접 진입 시에도 결과 화면 복원. 기존 풍부한 결과 UI를 일회용에서 재조회 가능 자산으로 전환

### 복원 방법
이 ID(front/usr `UserExamination_Modified.md` 기준 HIST-20260614-001)로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다. 백엔드 영속화 분은 back/usr `UserExamination_Modified.md`의 HIST-20260614-001 참조.
