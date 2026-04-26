## HIST-20260426-016

- **날짜**: 2026-04-26
- **수정 범위**: 관리자 프론트엔드 / 계정 관리 + 권한 관리
- **수정 개요**: RBAC 프론트엔드 연결 — PermissionDetail에 code 표시/입력, 계정 상세에서 세부 권한 체크박스 할당 UI 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `PermissionDetail`에 `code?: string` 추가 |
| `frontend/src/services/permissionService.ts` | 수정 | `PermissionDetailRequest`에 `code?: string` 추가 |
| `frontend/src/services/adminUserService.ts` | 수정 | `getUserPermissions()`, `updateUserPermissions()` 추가 |
| `frontend/src/app/admin/permissions/page.tsx` | 수정 | 세부 권한 추가/수정 폼에 code 입력란 추가, 목록에 code 배지 표시 |
| `frontend/src/app/admin/users/[id]/page.tsx` | 수정 | 세부 권한 할당 섹션 추가 (체크박스, 변경 사항 저장) |

### 수정 상세

#### `types/index.ts`
- **변경 전**: `PermissionDetail.code` 없음
- **변경 후**: `code?: string` 추가

#### `services/permissionService.ts`
- **변경 전**: `PermissionDetailRequest { masterId, name, description? }`
- **변경 후**: `PermissionDetailRequest { masterId, name, description?, code? }`

#### `services/adminUserService.ts`
- **변경 전**: getAll/getOne/update/resetPassword/delete 5개
- **변경 후**: 2개 추가
  ```typescript
  getUserPermissions: (id) => apiClient.get(`.../permissions`)  // → number[]
  updateUserPermissions: (id, detailIds) => apiClient.put(`.../permissions`, detailIds)
  ```

#### `app/admin/permissions/page.tsx`
- 세부 권한 추가 입력란: 이름 + **권한 코드 (font-mono, 자동 대문자)** + 설명
- 세부 권한 수정 폼: 이름 + **권한 코드** + 설명
- 세부 권한 목록 행: 이름 + code가 있으면 `bg-gray-100` 모노 배지로 표시

#### `app/admin/users/[id]/page.tsx`
- **변경 전**: 정보 수정 → 비밀번호 재설정 → 계정 삭제 3개 섹션
- **변경 후**: 정보 수정 → **세부 권한** → 비밀번호 재설정 → 계정 삭제 4개 섹션
  - 역할 변경 시 `handleRoleChange()` → 해당 역할 scope의 세부 권한 목록 갱신
  - 현재 할당된 권한은 체크 표시, 변경 시 "변경 사항 저장" 버튼 표시
  - 세부 권한이 없으면 권한 관리 페이지로 안내 링크 표시
  - `code`가 있는 세부 권한은 이름 옆에 모노 배지로 코드 표시

### 복원 방법

HIST-20260426-016 복원 시:
- `types/index.ts`: `PermissionDetail.code` 제거
- `permissionService.ts`: `PermissionDetailRequest.code` 제거
- `adminUserService.ts`: `getUserPermissions`, `updateUserPermissions` 제거
- `permissions/page.tsx`: code 입력란 제거, code 배지 제거, `editingDetailCode` 상태 제거, newDetailInputs 타입 복원
- `users/[id]/page.tsx`: 세부 권한 섹션 제거, permissionService import 제거

---

## HIST-20260426-014

- **날짜**: 2026-04-26
- **수정 범위**: 관리자 프론트엔드 / 계정 관리
- **수정 개요**: 계정 관리 페이지 신규 구현 — 사용자/관리자 탭 분리 목록, 상세 페이지(정보 수정 + 비밀번호 재설정 + 삭제), AdminLayoutShell에 계정 관리 메뉴 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/adminUserService.ts` | 추가 | 계정 관리 API 서비스 |
| `frontend/src/app/admin/users/page.tsx` | 추가 | 계정 목록 페이지 |
| `frontend/src/app/admin/users/[id]/page.tsx` | 추가 | 계정 상세 페이지 |
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | 계정 관리 메뉴 + 아이콘 추가 |

### 복원 방법

HIST-20260426-014 복원 시:
- `adminUserService.ts` 삭제
- `app/admin/users/page.tsx` 삭제
- `app/admin/users/[id]/page.tsx` 삭제
- `AdminLayoutShell.tsx`: `users` 아이콘 제거, FALLBACK_NAV 계정 관리 항목 제거
