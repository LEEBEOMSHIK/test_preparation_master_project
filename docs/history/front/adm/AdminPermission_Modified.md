## HIST-20260426-006

- **날짜**: 2026-04-26
- **수정 범위**: 관리자 프론트엔드 / 권한 관리
- **수정 개요**: 권한 관리 페이지 신규 구현 — 권한 마스터 CRUD + 세부 권한 CRUD, 권한 서비스 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/permissionService.ts` | 추가 | 권한 마스터/세부 권한 CRUD API 서비스 |
| `frontend/src/app/admin/permissions/page.tsx` | 추가 | 권한 관리 페이지 신규 생성 |

### 수정 상세

#### `app/admin/permissions/page.tsx`
- **변경 전**: 파일 없음
- **변경 후**: 신규 생성
  - 상단: 제목 + "권한 추가" 버튼 (토글 폼)
  - 권한 마스터 목록: code 배지, name, description, 세부 권한 개수
  - 마스터별 세부 권한 목록: 이름, 설명, 수정/삭제
  - 각 마스터 하단에 세부 권한 추가 입력 (이름 + 설명)
  - 마스터 수정: 이름/설명 인라인 편집
  - 새 마스터 추가: code(대문자) + name + description

### 복원 방법

HIST-20260426-006 복원 시:
- `permissionService.ts` 삭제
- `app/admin/permissions/page.tsx` 삭제
