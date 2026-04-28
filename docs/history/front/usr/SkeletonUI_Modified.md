## HIST-20260429-003

- **날짜**: 2026-04-29
- **수정 범위**: 사용자 프론트엔드 / 전체 화면 스켈레톤 UI 적용
- **수정 개요**: 데이터 로딩 중 텍스트/스피너를 스켈레톤 UI로 전면 교체, 공통 Skeleton 컴포넌트 신규 생성

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/Skeleton.tsx` | 추가 | 스켈레톤 공통 컴포넌트 (Skeleton, TableSkeleton, CardListSkeleton, ExamInfoCardSkeleton, AccordionSkeleton, CardGridSkeleton) |
| `frontend/src/app/user/exams/page.tsx` | 수정 | "불러오는 중..." → `CardListSkeleton rows={6}` |
| `frontend/src/app/user/exam-info/page.tsx` | 수정 | 스피너 → `ExamInfoCardSkeleton count={3}` |
| `frontend/src/app/user/faq/page.tsx` | 수정 | "불러오는 중..." → `AccordionSkeleton rows={6}` |
| `frontend/src/app/user/quiz/page.tsx` | 수정 | "카테고리 불러오는 중..." early return → 헤더 유지 + `CardGridSkeleton` |
| `frontend/src/app/user/inquiries/page.tsx` | 수정 | "불러오는 중..." → `TableSkeleton rows={5} cols={5}` |
| `frontend/src/app/user/concepts/page.tsx` | 수정 | "로딩 중..." → `CardListSkeleton rows={5}` |
| `CLAUDE.md` | 수정 | Skeleton UI Convention 섹션 추가 (컴포넌트 표, 구현 패턴, 체크리스트) |

### 수정 상세

#### `frontend/src/components/ui/Skeleton.tsx` (신규)
- **변경 전**: 파일 없음
- **변경 후**: shimmer 애니메이션(`animate-pulse`) 기반 공통 스켈레톤 컴포넌트 6종
  - `Skeleton` — 기본 atom (단일 shimmer div)
  - `TableSkeleton({ rows, cols })` — 헤더행 + N개 데이터행
  - `CardListSkeleton({ rows })` — 카드 목록 행 (제목+부제목)
  - `ExamInfoCardSkeleton({ count })` — 뱃지+제목+설명+3칸 날짜그리드 카드
  - `AccordionSkeleton({ rows })` — Q뱃지+텍스트+화살표 아코디언 행
  - `CardGridSkeleton()` — 그룹 헤더 + 아이콘+텍스트 카드 그리드

#### 각 사용자 페이지
- **변경 전**: `"불러오는 중..."` 텍스트 div, `animate-spin` 스피너, 또는 전체 화면 교체 early return
- **변경 후**: 화면 레이아웃에 맞는 Skeleton 컴포넌트로 교체
- **이유**: 로딩 중에도 실제 콘텐츠와 유사한 레이아웃 제공 → CLS(누적 레이아웃 이동) 감소, UX 개선

### 복원 방법

이 ID(HIST-20260429-003)로 복원 시:
- `frontend/src/components/ui/Skeleton.tsx` 삭제
- 각 페이지에서 `Skeleton` import 제거 및 아래 원본 코드로 복원:

| 페이지 | 복원 코드 |
|--------|-----------|
| `user/exams` | `<div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-400 text-sm">불러오는 중...</div>` |
| `user/exam-info` | `<div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>` |
| `user/faq` | `<div className="p-12 text-center text-sm text-gray-400">불러오는 중...</div>` |
| `user/quiz` | `if (loading) return (<div className="flex items-center justify-center py-20"><p className="text-gray-400 text-sm">카테고리 불러오는 중...</p></div>);` |
| `user/inquiries` | `<div className="p-12 text-center text-sm text-gray-400">불러오는 중...</div>` |
| `user/concepts` | `<div className="text-center py-16 text-gray-400">로딩 중...</div>` |
