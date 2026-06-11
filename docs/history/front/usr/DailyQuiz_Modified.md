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
