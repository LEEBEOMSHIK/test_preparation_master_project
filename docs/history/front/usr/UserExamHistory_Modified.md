## HIST-20260826-001

- **날짜**: 2026-08-26
- **수정 범위**: 사용자 프론트엔드 / 시험 이력 결과 공용 테스트 안정화
- **수정 개요**: 병렬 Jest worker 경합에서 초기 북마크 상태 반영이 Testing Library 기본 1초를 넘겨 간헐 실패하던 `ExamResultDisplay` assertion 한 곳에만 5초 대기 한도를 적용했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/ExamResultDisplay.test.tsx` | 수정 | 초기 `복습 표시됨` 버튼 조회의 `findByRole` timeout을 해당 assertion에만 5초 적용 |

### 수정 상세

- 변경 전: 병렬 전체 Jest에서 즉시 resolve mock의 React 상태 반영이 기본 1초를 넘으면 111행만 loading DOM 상태로 실패했다.
- 변경 후: 해당 `findByRole` 호출에만 `{ timeout: 5000 }`을 전달했다. production 코드와 다른 테스트 timeout은 변경하지 않았다.
- 이유: 단독 테스트와 전체 `--runInBand`는 수정 전에도 통과해 기능 로직은 정상이었고, 병렬 worker 경합에서만 렌더링 대기가 부족한 것으로 확인됐다.

### RED/GREEN 검증 결과

- RED: `npm test -- --watch=false`를 두 번 실행했을 때 동일한 `ExamResultDisplay.test.tsx:111`만 기본 1초 timeout으로 실패했고 DOM은 loading 상태였다.
- 비교 검증: 수정 전 단독 18/18, 전체 `--runInBand` 68/68 통과.
- GREEN: 수정 후 `npx jest src/components/ui/ExamResultDisplay.test.tsx --runInBand` 18/18 통과.
- GREEN: 수정 후 `npm test -- --watch=false` 병렬 전체 13 suite, 68/68 통과.

### 복원 방법

이 ID를 복원할 때 `ExamResultDisplay.test.tsx` 111행 `findByRole`의 세 번째 인자 `{ timeout: 5000 }`만 제거해 기본 대기 한도로 되돌린다.

## HIST-20260626-003

- **날짜**: 2026-06-26
- **수정 범위**: 사용자 프론트엔드 / 시험 이력 목록
- **수정 개요**: 상단 "뒤로"(router.back) 버튼을 "시험 목록으로"(router.push('/user/exams')) 버튼으로 변경

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/exam-history/page.tsx` | 수정 | 뒤로 버튼 onClick·라벨·aria-label 변경 |

### 수정 상세

#### `frontend/src/app/user/exam-history/page.tsx`
- 변경 전: `onClick={() => router.back()}`, `aria-label="이전으로 돌아가기"`, 라벨 `"뒤로"`
- 변경 후: `onClick={() => router.push('/user/exams')}`, `aria-label="시험 목록으로"`, 라벨 `"시험 목록으로"`
- 이유: `router.back()`은 진입 경로에 따라 시험 목록이 아닌 다른 화면으로 이동할 수 있어, 사용자 기대(항상 시험 목록으로 이동)와 불일치할 수 있음. 명시적 경로로 고정해 일관된 네비게이션 보장. chevron-left 아이콘·위치·스타일은 그대로 유지.

### 복원 방법
HIST-20260626-003 복원 시:
- `user/exam-history/page.tsx`의 버튼 `onClick`을 `() => router.back()`으로, `aria-label`을 `"이전으로 돌아가기"`로, 라벨 span을 `"뒤로"`로 되돌린다(HIST-20260626-002 상태로 복귀).

---

## HIST-20260626-002

- **날짜**: 2026-06-26
- **수정 범위**: 사용자 프론트엔드 / 시험 이력 목록
- **수정 개요**: "뒤로" 버튼을 제목과 같은 줄에서 분리해 헤더 위 독립 줄(상단 좌측)로 이동

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/exam-history/page.tsx` | 수정 | 뒤로 버튼을 헤더 div 외부로 분리, 제목·총N건은 기존 양끝 정렬 유지 |

### 수정 상세

#### `frontend/src/app/user/exam-history/page.tsx`
- 변경 전: `<div className="flex items-center justify-between">` 안의 `<div className="flex items-center gap-2">` 그룹에 뒤로 버튼과 `<h1>시험 이력</h1>`이 나란히 배치
- 변경 후: 뒤로 버튼을 `space-y-4` 컨테이너의 첫 번째 독립 자식으로 이동. 헤더 div에는 `<h1>`과 "총 N건" span만 남겨 양끝 정렬 유지. `space-y-4`가 뒤로 버튼과 헤더 사이 간격 담당
- 이유: 버튼이 제목에 바짝 붙어 어색한 레이아웃 개선, 별도 줄로 분리해 시각적 계층 명확화

### 복원 방법
HIST-20260626-002 복원 시:
- `user/exam-history/page.tsx`에서 독립 `<button>` 뒤로 버튼을 제거하고, 헤더 div 내부에 `<div className="flex items-center gap-2">` 그룹을 복원한 뒤 뒤로 버튼과 `<h1>`을 해당 그룹 안에 재배치한다(HIST-20260626-001 상태로 복귀).

---

## HIST-20260626-001

- **날짜**: 2026-06-26
- **수정 범위**: 사용자 프론트엔드 / 시험 이력 목록
- **수정 개요**: 시험 이력 목록 헤더에 "뒤로" 버튼(chevron-left + 라벨) 추가, router.back() 연결

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/exam-history/page.tsx` | 수정 | 헤더 제목 영역을 좌측 그룹(뒤로 버튼 + 제목)으로 묶고 뒤로가기 버튼 추가 |

### 수정 상세

#### `frontend/src/app/user/exam-history/page.tsx`
- 변경 전: 헤더가 `<div className="flex items-center justify-between">` 안에 `<h1>시험 이력</h1>` 단독으로 위치
- 변경 후: 좌측에 `<div className="flex items-center gap-2">` 그룹을 추가해 chevron-left SVG + "뒤로" 라벨 버튼을 h1 앞에 배치. 버튼에 `aria-label="이전으로 돌아가기"`, `onClick={() => router.back()}` 연결. 우측 "총 N건"은 위치 유지. 다크모드 클래스(`dark:`) 패턴 동일 적용
- 이유: 여러 경로(대시보드·게이트 '전체 이력 보기' 등)에서 진입 시 이전 화면으로 돌아가는 네비게이션이 없어 UX 불편

### 복원 방법
HIST-20260626-001 복원 시:
- `user/exam-history/page.tsx` 헤더의 좌측 그룹(`<div className="flex items-center gap-2">`)을 제거하고 `<h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">시험 이력</h1>` 단독으로 복원한다.

---

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
