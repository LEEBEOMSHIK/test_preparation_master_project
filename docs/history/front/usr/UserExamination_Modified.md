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
