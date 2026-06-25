## HIST-20260625-001

- **날짜**: 2026-06-25
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 — 모바일 답안 현황 접근
- **수정 개요**: lg 미만 화면에서 답안지 접근 불가 문제 해결 — 기존 사이드바 `hidden lg:flex` 전환, 답안 목록 마크업을 `AnswerSheetContent` 컴포넌트로 공통화, 모바일 FAB(하단 고정 버튼) + Bottom Sheet 오버레이 추가

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
