## HIST-20260614-001

- **날짜**: 2026-06-14
- **수정 범위**: 사용자 프론트엔드 / 시험 이력 목록 + 과거 응시 결과 재조회
- **수정 개요**: ExamResultDisplay 공용 컴포넌트 추출, 이력 목록·상세 페이지 신규 구현, UserLayoutShell 메뉴 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `ExamResultData`, `UserExamHistorySummary` 인터페이스 추가 |
| `frontend/src/services/examinationService.ts` | 수정 | `userGetExamHistories`, `userGetHistoryResult` 메서드 추가 |
| `frontend/src/components/ui/ExamResultDisplay.tsx` | 추가 | 시험 결과 공용 표시 컴포넌트 (점수카드·필터탭·아코디언·뒤로가기) |
| `frontend/src/app/exam/[id]/page.tsx` | 수정 | 결과 블록(253-446) → ExamResultDisplay 위임, resultFilter/expandedItems useState 제거, stripHtml import 제거 |
| `frontend/src/app/user/exam-history/page.tsx` | 추가 | 시험 이력 목록 페이지 (CardListSkeleton, 페이지네이션, 점수배지) |
| `frontend/src/app/user/exam-history/[historyId]/page.tsx` | 추가 | 이력 단건 결과 재조회 페이지 (QuizCardSkeleton, ExamResultDisplay) |
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | ICON_MAP에 history 아이콘(시계) 추가, USER_FALLBACK_NAV에 id=109 시험 이력 항목 추가 |
| `CLAUDE.md` | 수정 | Shared Utilities 표에 ExamResultDisplay 행 추가 |

### 수정 상세

#### `types/index.ts`
- 변경 전: `ExaminationSubmitResult` 다음에 바로 `ExamHistoryDetailResult`
- 변경 후: `ExamResultData`(제출·재조회 공용 타입, historyId/takenAt optional), `UserExamHistorySummary`(이력 목록 항목) 추가
- 이유: ExamResultDisplay 공용 Props 타입 및 이력 목록 API 응답 타입 필요

#### `examinationService.ts`
- 변경 전: `userGetLatestResult` 다음 바로 관리자 메서드
- 변경 후: `userGetExamHistories(page, size)` — GET /user/examinations/history, `userGetHistoryResult(historyId)` — GET /user/examinations/history/{historyId} 추가
- 이유: 이력 목록·단건 결과 API 호출 레이어

#### `ExamResultDisplay.tsx` (신규)
- 변경 전: 없음
- 변경 후: Props `{ result, examinationTitle?, onBack, backLabel?, showSavedBanner? }`. 내부 useState로 resultFilter/expandedItems 관리. showSavedBanner=true일 때만 green 배너 표시. examinationTitle/takenAt 조건부 표시
- 이유: exam/[id]/page.tsx 인라인 결과 블록을 공용 컴포넌트로 추출 (이력 재조회 화면에서도 재사용)

#### `exam/[id]/page.tsx`
- 변경 전: if(result) 블록 193줄의 JSX 인라인, resultFilter/expandedItems useState 2개, stripHtml import
- 변경 후: `<ExamResultDisplay result={result} examinationTitle={exam?.title} onBack={…} backLabel="시험 목록으로" showSavedBanner />` 7줄로 축소. 불필요 state·import 제거
- 이유: 코드 중복 제거, 기존 결과 동작 동일하게 유지(회귀 없음)

#### `user/exam-history/page.tsx` (신규)
- 변경 전: 없음
- 변경 후: 마운트/page 변경 시 userGetExamHistories 호출, CardListSkeleton rows=10, 빈상태(시계 아이콘+"아직 응시한 시험이 없습니다."), 이력 카드(시험명+응시일시·점수배지·정답수·화살표), 페이지네이션(이전/다음+"페이지 N / M")
- 이유: 시험 이력 목록 화면 신규 구현

#### `user/exam-history/[historyId]/page.tsx` (신규)
- 변경 전: 없음
- 변경 후: userGetHistoryResult 호출, 실패 시 router.replace('/user/exam-history'), 로딩 QuizCardSkeleton, 성공 시 ExamHistoryDetailResult→ExamResultData 매핑 후 ExamResultDisplay 렌더
- 이유: 과거 응시 결과 단건 재조회 화면

#### `UserLayoutShell.tsx`
- 변경 전: ICON_MAP에 history 없음, USER_FALLBACK_NAV 항목 id 108(즐겨찾기)까지
- 변경 후: history 아이콘(시계 outline SVG) 추가, id=109 { name:'시험 이력', url:'/user/exam-history', iconKey:'history', displayOrder:9 } 추가
- 이유: API 메뉴 미응답 시 폴백 네비게이션 및 아이콘 렌더 지원

### 복원 방법
HIST-20260614-001 복원 시:
- `types/index.ts`에서 `ExamResultData`, `UserExamHistorySummary` 인터페이스 제거
- `examinationService.ts`에서 `userGetExamHistories`, `userGetHistoryResult` 메서드 제거, `UserExamHistorySummary` import 제거
- `ExamResultDisplay.tsx` 파일 삭제
- `exam/[id]/page.tsx`의 ExamResultDisplay import 제거 후, 제거된 if(result) JSX 블록 복원, resultFilter/expandedItems useState 2개 복원, stripHtml import 복원
- `user/exam-history/page.tsx` 파일 삭제
- `user/exam-history/[historyId]/page.tsx` 파일 삭제
- `UserLayoutShell.tsx`에서 history 아이콘 및 id=109 FALLBACK_NAV 항목 제거
- `CLAUDE.md`에서 ExamResultDisplay 행 제거
