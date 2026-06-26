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
