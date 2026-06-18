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
