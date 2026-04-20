## HIST-20260421-033

- **날짜**: 2026-04-21
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈
- **수정 개요**: 데일리 퀴즈를 고정 10문제 종료 방식에서 연속 랜덤 출제 방식으로 변경 — 라운드 단위 로딩, 세션 누계 통계, "종료하기" 버튼으로 언제든 종료

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/app/user/quiz/[categoryId]/page.tsx | 수정 | 연속 퀴즈 모드 전체 재작성 |
| frontend/src/app/user/quiz/page.tsx | 수정 | 카드 부제 "랜덤 10문제" → "랜덤 연속 출제" |

### 수정 상세

#### `frontend/src/app/user/quiz/[categoryId]/page.tsx`
- 변경 전: Phase `loading | quiz | result`. 10문제 완료 후 결과 화면 → "다시 풀기"로 새 10문제
- 변경 후:
  - Phase `loading | quiz | continue | result` 추가
  - **세션 통계** `sessionAnswered`, `sessionCorrect`: 라운드 종료 시 배치 정답 누적
  - **quiz 헤더**: 카테고리명 + 세션 누계 뱃지 + 라운드·배치 진행(R1 · 3/10) + "종료하기" 버튼
  - **handleNext**: 배치 마지막 문제 → `flushBatch()` 후 `phase='continue'`
  - **handleStop** (종료하기): 현재 배치 진행분 누적 후 `phase='result'`
  - **continue 화면**: 라운드 완료 점수 카드 + 세션 누계 표시 + "계속 풀기" / "종료하기"
  - **result 화면**: 세션 전체 통계(총 문제 수·정답 수·점수) + "카테고리 선택" / "다시 시작"
  - "다시 시작": sessionAnswered·sessionCorrect·roundNum 초기화 후 `loadBatch()`

#### `frontend/src/app/user/quiz/page.tsx`
- 변경 전: 카드 부제 "랜덤 10문제"
- 변경 후: "랜덤 연속 출제"

### 복원 방법

HIST-20260421-033 복원 시:
- `quiz/[categoryId]/page.tsx`를 Phase `loading|quiz|result` 3단계 버전으로 복원 (sessionAnswered/sessionCorrect/roundNum/continue 화면 제거, handleNext 마지막 문제 시 `setPhase('result')`, handleStop 제거)
- `quiz/page.tsx` 카드 부제를 "랜덤 10문제"로 복원

---

## HIST-20260421-028

- **날짜**: 2026-04-21
- **수정 범위**: 사용자 프론트엔드 / 시험 응시
- **수정 개요**: 시험 응시 화면 각 문항에 개념노트 메모 버튼 및 모달 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| frontend/src/app/exam/[id]/page.tsx | 수정 | 문항 헤더에 메모 버튼 + 개념노트 저장 모달 추가 |

### 수정 상세

#### `frontend/src/app/exam/[id]/page.tsx`
- 변경 전: 문항 헤더에 Q번호, 체크 버튼, 문항 카운터만 존재
- 변경 후:
  - 문항 헤더 우측에 연필 아이콘 + "메모" 텍스트의 ghost 스타일 버튼 추가 (기본: 테두리 없음, hover 시 indigo 50 배경)
  - 클릭 시 중앙 모달: 제목(문항 내용 앞 40자 자동 입력), 내용 textarea, 저장/취소 버튼
  - 저장 시 비공개(isPublic=false) 개념노트로 생성 후 "저장됨 ✓" 표시 → 800ms 후 모달 닫힘
  - `conceptNoteService` import 추가, 관련 state 5개 추가

### 복원 방법

HIST-20260421-028 복원 시:
- `exam/[id]/page.tsx`에서 `conceptNoteService` import 제거
- `noteModal`, `noteTitle`, `noteContent`, `noteSaving`, `noteSaved` state 제거
- `openNoteModal`, `handleSaveNote` 함수 제거
- 개념노트 모달 JSX 블록 제거
- 문항 헤더의 메모 버튼 제거

---

## HIST-20260421-024

- **날짜**: 2026-04-21
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 화면
- **수정 개요**: ①답안 현황 단답형 답안 영역 확장 (최대 12자, flex-1 min-w-0), ②다음 버튼 색상을 강한 인디고 실선 → 연한 인디고(bg-indigo-50) 으로 완화

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/app/exam/[id]/page.tsx | 수정 | answerLabel 단답 12자, 행 레이아웃 flex-1 확장, 다음 버튼 bg-indigo-50 |

### 수정 상세

#### `src/app/exam/[id]/page.tsx`
- `answerLabel`: 단답형·코드 표시 4자→12자로 확장 (OX는 별도 분기)
- 답안 현황 행: `justify-between` → `gap-2` + 번호 `shrink-0 w-7` + 답안 `flex-1 min-w-0 truncate text-right`
- 다음 버튼: `bg-indigo-600 text-white` → `bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100`

### 복원 방법

HIST-20260421-024 복원 시 `exam/[id]/page.tsx`를 HIST-20260421-023 상태로 복원

---

## HIST-20260421-023

- **날짜**: 2026-04-21
- **수정 범위**: 사용자 프론트엔드 / 시험 응시 화면
- **수정 개요**: ①답안 현황 패널을 수직 목록+수평 레이아웃으로 변경, ②객관식 선택지 번호를 `(1)` → `①` 원형 숫자로 변경, ③답안 현황 표시에도 원형 숫자 적용

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/app/exam/[id]/page.tsx | 수정 | 답안 현황 UI 개편, circled() 헬퍼, 선택지 번호 원형화 |

### 수정 상세

#### `src/app/exam/[id]/page.tsx`
- 변경 전: 4열 정사각형 그리드 (문항번호 상단, 답안 하단)
- 변경 후: 수직 목록 (한 행 = 1문항), 각 행을 `flex justify-between`으로 `문항번호 | 답안` 수평 배치
- 객관식 선택지 번호: `(1)` → `①` (CIRCLED 배열 + `circled()` 헬퍼 사용)
- 답안 현황 MC 답안 표시: `(1)` → `①` (동일 `circled()` 사용)

### 복원 방법

HIST-20260421-023 복원 시:
- `exam/[id]/page.tsx`를 HIST-20260421-021 상태로 복원 (4열 그리드, `(n)` 형식)

---

## HIST-20260421-021

- **날짜**: 2026-04-21
- **수정 범위**: 사용자 프론트엔드 + 백엔드 / 시험 응시 화면
- **수정 개요**: ①답안 현황 패널에 입력 답안 표시, ②코드 문항 IntelliJ Darcula 스타일 코드 블록, ③문제 본문 이미지(`<img>`) 렌더링, ④코드 답안 입력 textarea, ⑤백엔드 QuestionView에 code·language 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/main/java/.../controller/UserExaminationController.java | 수정 | QuestionView에 `code`, `language` 필드 추가 |
| src/types/index.ts | 수정 | `Question` 인터페이스에 `code?`, `language?` 추가 |
| src/app/exam/[id]/page.tsx | 수정 | 답안 현황 4열 그리드, CodeBlock 컴포넌트, QuestionContent(img 지원), CODE 유형 textarea |

### 수정 상세

#### `UserExaminationController.QuestionView`
- 변경 전: `(id, seq, content, questionType, options)` 5필드
- 변경 후: `(id, seq, content, questionType, options, code, language)` 7필드

#### `src/app/exam/[id]/page.tsx`
- **답안 현황**: 5열 `aspect-square` 번호 박스 → 4열 2단 박스 (상단: 문항번호 작게, 하단: 입력 답안 표시)
  - MULTIPLE_CHOICE: `(1)`, `(2)` 등 형식
  - OX/단답: 입력값 4자 이내면 그대로, 초과 시 말줄임
- **CodeBlock**: IntelliJ Darcula 스타일 (`#2b2b2b` 배경, `#a9b7c6` 텍스트, macOS 신호등 버튼, 언어 라벨)
- **QuestionContent**: content에 `<img` 포함 시 `dangerouslySetInnerHTML` 렌더링 (img max-w-full, rounded-lg)
- **CODE 유형 답안 입력**: `<input>` → `<textarea rows={4} font-mono>`로 변경
- **답안지 패널**: `overflow-y-auto max-h` 추가하여 문항 많을 때 스크롤 가능

### 복원 방법

HIST-20260421-021 복원 시:
- `UserExaminationController.QuestionView`를 5필드로 복원
- `types/index.ts`에서 `Question.code`, `Question.language` 제거
- `exam/[id]/page.tsx`를 HIST-20260421-020 상태로 복원

---

## HIST-20260421-020

- **날짜**: 2026-04-21
- **수정 범위**: 사용자 프론트엔드 / 시험 목록 + 시험 응시
- **수정 개요**: 시험 목록을 시험지(ExamSummary)에서 시험(Examination)으로 변경, 응시 화면을 `/api/user/examinations` API 사용으로 전환하여 500 오류 수정, 시험 유형 필터 추가, 제한 시간 서버 값 반영

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/app/user/exams/page.tsx | 수정 | `examinationService.userGetExaminations` 사용, 시험지 제목·유형·제한시간 표시, 유형 필터 |
| src/app/exam/[id]/page.tsx | 수정 | `examinationService.userGetExaminationDetail` / `userSubmitExamination` 사용, 제한시간 서버값 반영 |
| src/services/examinationService.ts | 수정 | 사용자용 3개 메서드 추가 (userGetExaminations, userGetExaminationDetail, userSubmitExamination) |
| src/types/index.ts | 수정 | `ExaminationDetail` 인터페이스 추가 |

### 수정 상세

#### `src/app/user/exams/page.tsx`
- 변경 전: `examService.getExams` → `ExamSummary` (문항수·출제방식만 표시)
- 변경 후: `examinationService.userGetExaminations` → `Examination` (시험지 제목·유형·제한시간 표시), 유형(categoryName) 드롭다운 필터로 변경

#### `src/app/exam/[id]/page.tsx`
- 변경 전: `examService.getExamDetail` / `submitExam` (시험지 ID 기반 → 500 오류)
- 변경 후: `examinationService.userGetExaminationDetail` / `userSubmitExamination` (시험 ID 기반), 타이머 초기값을 `detail.timeLimit * 60`으로 설정

### 복원 방법

HIST-20260421-020 복원 시:
- `src/app/user/exams/page.tsx`를 HIST-20260421-018 상태 (examService 기반)로 복원
- `src/app/exam/[id]/page.tsx`의 import·API 호출을 `examService` 기반으로 복원
- `src/services/examinationService.ts`에서 user 메서드 3개 제거
- `src/types/index.ts`에서 `ExaminationDetail` 제거

---

## HIST-20260421-018

- **날짜**: 2026-04-21
- **수정 범위**: 사용자 프론트엔드 / 시험 목록 + 시험 응시
- **수정 개요**: ①시험 목록에 '시험 시작' 팝업 및 제목·출제방식 필터 + 페이지크기(10/20/50) 페이지네이션 추가, ②레이아웃 미적용 독립 시험 응시 화면(`/exam/[id]`) 신규 추가 및 브라우저 닫기/뒤로가기 시 경고 처리

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/app/user/exams/page.tsx | 수정 | 시험 시작 팝업, 제목·출제방식 필터, 페이지크기 선택, 클라이언트 페이지네이션 |
| src/app/exam/[id]/page.tsx | 추가 | 레이아웃 없는 시험 응시 전용 페이지 (beforeunload + popstate 나가기 경고) |

### 수정 상세

#### `src/app/user/exams/page.tsx`
- 변경 전: `<Link>` 카드로 즉시 `/user/exams/${id}` 이동, 고정 size=50 전체 로드, 필터·페이지네이션 없음
- 변경 후:
  - 전체 시험 한 번에 로드 (size=500), 클라이언트 필터링·페이지네이션 적용
  - 카드 클릭 → `selectedExam` 상태 → '시험 시작' 팝업 표시 (문항수·출제방식·제한시간·경고문구)
  - 팝업 '시험 시작' 버튼 → `/exam/${id}` 이동
  - 필터: 시험 제목 텍스트 검색 input + 출제방식 dropdown (전체/랜덤/순서)
  - 페이지 크기 버튼 (10/20/50), 이전/다음 페이지네이션, 총 건수 표시

#### `src/app/exam/[id]/page.tsx` (신규)
- 변경 전: 파일 없음
- 변경 후:
  - 루트 layout 외 별도 레이아웃 없음 (UserLayoutShell 미적용)
  - 상단 고정 헤더: '나가기' 버튼 + 시험 제목 + 타이머
  - `beforeunload` 이벤트: 브라우저 닫기·새로고침 시 기본 경고 다이얼로그
  - `popstate` 이벤트: 브라우저 뒤로가기 감지 → `leaveConfirm` 모달 표시
  - leaveConfirm 모달: "모든 시험 정보가 초기화됩니다. 그래도 진행하시겠습니까?" + 취소/나가기
  - '나가기' 헤더 버튼도 동일 모달 경유
  - `examDone` ref: 시험 제출·결과 확인 완료 후 경고 비활성화
  - 나머지 로직(문제 풀이·체크·제출·결과) 기존과 동일

### 복원 방법

HIST-20260421-018 복원 시:
- `src/app/exam/[id]/page.tsx` 삭제
- `src/app/user/exams/page.tsx`를 HIST-20260420-015 상태로 복원 (`<Link>` 카드, 필터/팝업/페이지네이션 제거)

---

## HIST-20260420-015

- **날짜**: 2026-04-20
- **수정 범위**: 사용자 프론트엔드 / 시험 메뉴 명언 팝업
- **수정 개요**: 시험 메뉴 진입 시 표시되는 명언 팝업에 '하루 동안 보지 않기' 체크박스 추가, localStorage 기반 24시간 비노출 처리

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/app/user/exams/page.tsx | 수정 | dontShowToday 상태, handleCloseQuote, localStorage 저장 로직 및 체크박스 UI 추가 |

### 수정 상세

#### `src/app/user/exams/page.tsx`
- 변경 전: 페이지 진입 시 항상 명언 팝업 표시, '오늘도 화이팅!' 버튼으로만 닫기
- 변경 후:
  - 페이지 진입 시 `tpmp_quote_hidden_until` localStorage 값 확인 → 현재 시각 이전이면 팝업 미표시
  - 팝업에 '하루 동안 보지 않기' 체크박스 추가
  - '오늘도 화이팅!' 버튼 클릭 시 체크박스 선택 상태면 `Date.now() + 86400000` 저장

### 복원 방법

HIST-20260420-015 복원 시:
- dontShowToday 상태 제거
- handleCloseQuote 함수 제거, 버튼의 onClick을 `() => setShowQuote(false)`로 복원
- 체크박스 label 요소 제거
- isHidden 로직 제거, 기존 `!quoteFetched.current` 조건으로 복원

---

## HIST-20260420-011

- **날짜**: 2026-04-20
- **수정 범위**: 사용자 프론트엔드 / 데일리 퀴즈 + 시험 응시 + 홈 명언 알림
- **수정 개요**: 데일리 퀴즈 카테고리 선택·풀이 화면, 시험 목록·응시 2패널 화면, 홈 진입 시 랜덤 명언 모달 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| src/services/quizService.ts | 추가 | getCategories / getQuestions / checkAnswer API |
| src/app/user/quiz/page.tsx | 추가 | 카테고리 선택 화면 |
| src/app/user/quiz/[categoryId]/page.tsx | 추가 | 퀴즈 풀이 화면 (즉시 채점·해설·결과 요약) |
| src/app/user/exams/page.tsx | 수정 | 시험 목록 실제 표시 + 홈 진입 시 랜덤 명언 모달 |
| src/app/user/exams/[id]/page.tsx | 추가 | 시험 응시 2패널 화면 |
| src/components/layout/UserLayoutShell.tsx | 수정 | 데일리 퀴즈 nav 항목 추가 |

### 수정 상세

#### `app/user/exams/page.tsx`
- 변경 전: "준비 중입니다." 표시
- 변경 후: 시험 목록 카드 + 첫 진입 시 랜덤 명언 모달

#### `app/user/exams/[id]/page.tsx` (신규)
- 좌측 패널: 시험 제목, 문제 본문, 선택지/입력, 이전/다음, 체크(나중에 확인) 버튼
- 우측 패널: 남은 시간 카운트다운(기본 60분), 답안 현황 그리드(미답·답변·체크 색상 구분), 제출 버튼
- 체크된 문항이 있으면 제출 차단 → 체크 번호 클릭 시 해당 문제로 이동
- 제출 후 점수(score), 총 문항(total), 맞은 수(correct) 결과 화면 표시
- 시간 종료 시 자동 강제 채점

#### `app/user/quiz/[categoryId]/page.tsx` (신규)
- 즉시 채점(POST /api/user/quiz/check) 후 정오 피드백·해설 표시
- 마지막 문제 후 결과 화면(정답률 표시, 오답 복습 목록)

### 복원 방법

HIST-20260420-011 복원 시:
- quizService.ts 삭제
- src/app/user/quiz/ 디렉토리 삭제
- src/app/user/exams/page.tsx를 "준비 중입니다" 단순 표시로 되돌림
- src/app/user/exams/[id]/ 디렉토리 삭제
- UserLayoutShell.tsx에서 데일리 퀴즈 항목 제거
