## HIST-20260612-002

- **날짜**: 2026-06-12
- **수정 범위**: 사용자 프론트엔드 / 시험 응시(exam, user/exams), 온보딩, 시험 정보 모달
- **수정 개요**: CLAUDE.md 스켈레톤 규칙 위반 4개소 수정 — 텍스트 단독 및 인라인 animate-pulse DIV를 Skeleton 컴포넌트로 교체, ExamTypeGridSkeleton 신규 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/Skeleton.tsx` | 수정 | `ExamTypeGridSkeleton` 신규 추가 (시험 유형 선택 2열 그리드) |
| `frontend/src/app/exam/[id]/page.tsx` | 수정 | `<p>시험 불러오는 중...</p>` → `QuizCardSkeleton` |
| `frontend/src/app/user/exams/[id]/page.tsx` | 수정 | `<p>시험 불러오는 중...</p>` → `QuizCardSkeleton` |
| `frontend/src/app/onboarding/page.tsx` | 수정 | 인라인 animate-pulse DIV 배열 → `ExamTypeGridSkeleton count={6} itemHeight="h-14"` |
| `frontend/src/app/user/exam-info/page.tsx` | 수정 | 모달 내 인라인 animate-pulse DIV 배열 → `ExamTypeGridSkeleton count={6} itemHeight="h-10"` |
| `CLAUDE.md` | 수정 | Skeleton UI Convention 표에 `ExamTypeGridSkeleton` 행 추가 |

### 수정 상세

#### `frontend/src/components/ui/Skeleton.tsx`
- 변경 전: `ExamTypeGridSkeleton` 없음
- 변경 후: `ExamTypeGridSkeleton({ count=6, itemHeight="h-14" })` 추가 — `grid grid-cols-2` 구조로 N개 버튼 placeholder 렌더링
- 이유: onboarding과 exam-info 모달이 동일한 2열 그리드 버튼 패턴 사용 → 공통 컴포넌트로 추출

#### `frontend/src/app/exam/[id]/page.tsx`
- 변경 전: `<div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-400 text-sm">시험 불러오는 중...</p></div>`
- 변경 후: `<div className="min-h-screen bg-gray-50 px-4 py-8"><QuizCardSkeleton /></div>`
- 이유: 텍스트 단독 사용 → 규칙 위반. 시험 응시 화면 구조(헤더+진행바+문제카드)와 QuizCardSkeleton이 일치

#### `frontend/src/app/user/exams/[id]/page.tsx`
- 변경 전: `<div className="flex items-center justify-center py-24"><p className="text-gray-400 text-sm">시험 불러오는 중...</p></div>`
- 변경 후: `<div className="px-4 py-8"><QuizCardSkeleton /></div>`
- 이유: 동일 패턴. QuizCardSkeleton으로 교체

#### `frontend/src/app/onboarding/page.tsx`
- 변경 전: `<div className="grid grid-cols-2 gap-3 animate-pulse">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-14 rounded-xl bg-gray-100" />))}</div>`
- 변경 후: `<ExamTypeGridSkeleton count={6} itemHeight="h-14" />`
- 이유: 인라인 animate-pulse 직접 구현 → 인라인 복붙 금지 규칙 위반. ExamTypeGridSkeleton으로 추출

#### `frontend/src/app/user/exam-info/page.tsx`
- 변경 전: `<div className="grid grid-cols-2 gap-2 animate-pulse">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-10 rounded-xl bg-gray-100" />))}</div>`
- 변경 후: `<ExamTypeGridSkeleton count={6} itemHeight="h-10" />`
- 이유: 동일한 인라인 복붙 패턴 위반. itemHeight prop으로 모달 버튼 높이(h-10) 조절

### 복원 방법

이 ID(HIST-20260612-002)만으로 복원 시:

| 파일 | 복원 내용 |
|------|-----------|
| `exam/[id]/page.tsx` | loading 분기를 `<div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-400 text-sm">시험 불러오는 중...</p></div>` 으로 되돌리고 QuizCardSkeleton import 제거 |
| `user/exams/[id]/page.tsx` | loading 분기를 `<div className="flex items-center justify-center py-24"><p className="text-gray-400 text-sm">시험 불러오는 중...</p></div>` 으로 되돌리고 QuizCardSkeleton import 제거 |
| `onboarding/page.tsx` | ExamTypeGridSkeleton을 인라인 grid+animate-pulse DIV 6개로 되돌리고 import 제거 |
| `user/exam-info/page.tsx` | 모달 내 ExamTypeGridSkeleton을 인라인 grid+animate-pulse DIV 6개로 되돌리고 import에서 ExamTypeGridSkeleton 제거 |
| `Skeleton.tsx` | ExamTypeGridSkeleton 함수 블록 전체 삭제 |
| `CLAUDE.md` | Skeleton UI Convention 표에서 ExamTypeGridSkeleton 행 삭제 |

---

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
