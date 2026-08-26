## HIST-20260826-002

- **날짜**: 2026-08-26
- **수정 범위**: 관리자 프론트엔드 / 패치노트 관리 전체 구현
- **수정 개요**: 목록·등록·수정·삭제·게시 전환 화면과 검증을 구현하고 오류 처리 및 마지막 페이지 삭제 경계를 보강했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/patch-notes/page.tsx` | 추가/수정 | 관리 목록·게시 전환·삭제 및 마지막 페이지 보정 |
| `frontend/src/app/admin/patch-notes/page.test.tsx` | 추가 | 삭제 후 이전/현재 페이지 재조회 경계 테스트 |
| `frontend/src/app/admin/patch-notes/new/page.tsx` | 추가/수정 | 등록 화면과 앱 오류 타입 계약 |
| `frontend/src/app/admin/patch-notes/[id]/edit/page.tsx` | 추가/수정 | 상세 로딩 스켈레톤·수정 화면과 앱 오류 타입 계약 |
| `frontend/src/components/admin/PatchNoteForm.tsx` | 추가 | 공통 등록/수정 폼과 시각적 빈 본문 검증 |
| `frontend/src/components/admin/PatchNoteForm.test.tsx` | 추가 | 빈 HTML·중복 제출·백엔드 오류 테스트 |
| `frontend/src/lib/apiError.ts` | 추가/수정 | HTTP/앱 오류 메시지 보존과 네트워크 fallback 분리 |
| `frontend/src/lib/apiError.test.ts` | 추가/수정 | HTTP·앱·네트워크 오류 회귀 테스트 |
| `frontend/src/services/patchNoteService.ts` | 추가 | 관리자 CRUD·게시 전환 API |
| `frontend/src/types/index.ts` | 수정 | 패치노트 요청·응답 타입 |
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | 관리자 fallback 메뉴 진입점 |
| `docs/project-overview.md` | 수정 | 관리자 패치노트 관리 기능 문서화 |

### 수정 상세

- 변경 전: 패치노트 관리 UI가 없고 일반 `Error.message`가 네트워크 내부 문구까지 노출될 수 있었다.
- 변경 후: CRUD·게시 전환을 제공하며 `ApiApplicationError`만 앱 메시지로 보존하고, 마지막 페이지의 유일한 항목 삭제 시 이전 페이지로 이동한다.
- 이유: 관리자 작업 흐름과 사용자 친화적 오류 계약, 페이지 삭제 경계를 일관되게 보장한다.

### 검증 결과

- 패치노트 관련 프론트 Jest 5개 suite, 13개 테스트 통과.
- `npx tsc --noEmit` 통과.

### 복원 방법

이 ID를 복원할 때 관리자 패치노트 3개 페이지·폼·테스트·메뉴를 제거하고, 서비스·타입·API 오류 유틸의 패치노트 구현분을 되돌린다.

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
