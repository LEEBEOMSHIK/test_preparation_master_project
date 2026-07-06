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
