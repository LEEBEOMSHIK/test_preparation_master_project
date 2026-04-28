## HIST-20260429-004

- **날짜**: 2026-04-29
- **수정 범위**: 관리자 프론트엔드 / 전체 화면 스켈레톤 UI 적용
- **수정 개요**: 관리자 페이지 데이터 로딩 중 텍스트/스피너를 TableSkeleton으로 전면 교체

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/exams/page.tsx` | 수정 | "불러오는 중..." → `TableSkeleton rows={5} cols={7}` |
| `frontend/src/app/admin/exams/papers/page.tsx` | 수정 | "불러오는 중..." → `TableSkeleton rows={5} cols={6}` |
| `frontend/src/app/admin/exams/questions/page.tsx` | 수정 | "불러오는 중..." → `TableSkeleton rows={5} cols={5}` |
| `frontend/src/app/admin/users/page.tsx` | 수정 | tbody 내 loading tr → 컨테이너 레벨 `TableSkeleton rows={5} cols={7}` |
| `frontend/src/app/admin/faq/page.tsx` | 수정 | "불러오는 중..." → `TableSkeleton rows={5} cols={5}` |
| `frontend/src/app/admin/inquiries/page.tsx` | 수정 | "불러오는 중..." → `TableSkeleton rows={5} cols={5}` |
| `frontend/src/app/admin/permissions/page.tsx` | 수정 | animate-spin 스피너 early return → 더블 `TableSkeleton` 블록 (마스터/상세) |

### 수정 상세

#### 공통 변경 패턴
- **변경 전**: `<div className="p-10 text-center text-gray-400 text-sm">불러오는 중...</div>`
- **변경 후**: `<TableSkeleton rows={5} cols={N} />` (N은 실제 테이블 컬럼 수)
- **이유**: 실제 테이블 레이아웃과 유사한 shimmer 표시로 UX 개선

#### `admin/users/page.tsx` 특이사항
- **변경 전**: 테이블 `<tbody>` 내부에 loading 조건부 `<tr>` 삽입 방식
- **변경 후**: 컨테이너 `div` 레벨에서 `loading ? <TableSkeleton /> : <table>` 삼항 분기
- **이유**: tbody 내 div 삽입은 HTML 구조 위반; 컨테이너 레벨 분기가 올바른 패턴

#### `admin/permissions/page.tsx` 특이사항
- **변경 전**: `animate-spin` 원형 스피너 early return (h-48 중앙)
- **변경 후**: 마스터/상세 두 섹션을 표현하는 이중 TableSkeleton early return
- **이유**: 권한 관리 페이지의 2단 구조 반영

### 복원 방법

이 ID(HIST-20260429-004)로 복원 시:
- 각 페이지에서 `TableSkeleton` import 제거
- 아래 원본 코드로 로딩 블록 복원:

| 페이지 | 복원 코드 |
|--------|-----------|
| `admin/exams`, `admin/exams/papers`, `admin/exams/questions`, `admin/faq`, `admin/inquiries` | `<div className="p-10 text-center text-gray-400 text-sm">불러오는 중...</div>` |
| `admin/users` | tbody 내 `{loading && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">불러오는 중...</td></tr>}` 방식으로 복원, `!loading &&` 조건 추가 |
| `admin/permissions` | `if (loading) return (<div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>);` |
