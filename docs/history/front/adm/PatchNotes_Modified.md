## HIST-20260826-001

- **날짜**: 2026-08-26
- **수정 범위**: 관리자 프론트엔드 / 패치노트 관리
- **수정 개요**: 관리자 fallback 내비게이션에 패치노트 관리 독립 메뉴를 등록하고 관리 기능을 문서화했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | `/admin/patch-notes` 패치노트 관리 fallback 메뉴 추가 |
| `docs/project-overview.md` | 수정 | 관리자 패치노트 CRUD 및 게시 전환 기능 명시 |

### 수정 상세

#### `frontend/src/components/layout/AdminLayoutShell.tsx`
- 변경 전: API 메뉴 조회가 실패하거나 비어 있을 때 패치노트 관리 메뉴가 표시되지 않았다.
- 변경 후: `패치노트 관리`를 `/admin/patch-notes`의 독립 fallback 메뉴로 표시한다.
- 이유: 관리자 패치노트 관리 화면을 메뉴 API 상태와 관계없이 진입할 수 있게 한다.

### 검증 결과

- `npx tsc --noEmit` 통과.

### 복원 방법

이 ID(`PatchNotes_Modified.md` 기준 HIST-20260826-001)로 복원 시 fallback 메뉴 항목과 관리자 패치노트 기능 문서 항목을 제거한다. (순번은 파일별이므로 복원 시 파일명도 함께 지정한다.)
