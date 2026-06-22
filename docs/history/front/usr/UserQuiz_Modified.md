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
