## HIST-20260428-011

- **날짜**: 2026-04-28
- **수정 범위**: 관리자 프론트엔드 / 전역 스타일
- **수정 개요**: 다크 모드에서 `bg-emerald-50` 배경이 너무 밝게 보이는 문제 수정 — globals.css에 오버라이드 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/globals.css` | 수정 | `.dark .bg-emerald-50` 다크 모드 오버라이드 추가 |

### 수정 상세

#### `globals.css`
- **변경 전**: `.dark .bg-emerald-50` 없음 → 원래 밝은 초록 그대로 표시
- **변경 후**: `.dark .bg-emerald-50 { background-color: rgb(6 78 59 / 0.25); }` 추가
- **이유**: 계정 목록의 USER 역할 세부 권한 칩(`bg-emerald-50`)이 다크 배경에서 너무 하얗게 보임; `bg-emerald-100`과 같은 색조(6 78 59)에 불투명도만 낮춰 적용

### 복원 방법

HIST-20260428-011 복원 시: `globals.css`에서 `.dark .bg-emerald-50` 줄 제거.

---

## HIST-20260428-010

- **날짜**: 2026-04-28
- **수정 범위**: 관리자 프론트엔드 / 계정 관리
- **수정 개요**: 계정 목록 세부 권한 칩 색상을 역할(USER/ADMIN)별로 구분

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/users/page.tsx` | 수정 | `PERMISSION_CHIP_COLOR` 맵 추가, 권한 칩에 역할별 색상 적용 |

### 수정 상세

#### `admin/users/page.tsx`
- **변경 전**: 모든 권한 칩 `bg-indigo-50 text-indigo-700` 고정
- **변경 후**: `PERMISSION_CHIP_COLOR` 맵 추가
  ```ts
  USER:  'bg-emerald-50 text-emerald-700'
  ADMIN: 'bg-indigo-50  text-indigo-700'
  ```
  역할 배지(`ROLE_COLOR`)와 같은 계열 색상으로 통일

### 복원 방법

HIST-20260428-010 복원 시: `PERMISSION_CHIP_COLOR` 상수 제거, 칩 className을 `bg-indigo-50 text-indigo-700` 고정으로 되돌림.

---

## HIST-20260428-006

- **날짜**: 2026-04-28
- **수정 범위**: 관리자 프론트엔드 / 계정 관리
- **수정 개요**: 계정 목록에 세부 권한 컬럼 추가 — 사용자별 부여된 세부 권한을 칩으로 표시

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/adminUserService.ts` | 수정 | `GrantedPermissionInfo` 타입 추가, `AdminUser`에 `grantedPermissions` 필드 추가 |
| `frontend/src/app/admin/users/page.tsx` | 수정 | "세부 권한" 컬럼 추가, 권한 이름 칩 렌더링 |

### 수정 상세

#### `adminUserService.ts`
- **추가**: `GrantedPermissionInfo { id, name, code? }` 인터페이스
- **변경**: `AdminUser`에 `grantedPermissions: GrantedPermissionInfo[]` 필드 추가

#### `admin/users/page.tsx`
- **변경**: 테이블 컬럼 수 6 → 7, "세부 권한" 컬럼 추가
- **추가**: 권한이 있으면 `bg-indigo-50 text-indigo-700` 칩 렌더링, 없으면 "없음" 표시
- 권한 칩에 `title={p.code}` 속성 추가 → 마우스 오버 시 코드 확인 가능

### 복원 방법

HIST-20260428-006 복원 시: `adminUserService.ts`에서 `GrantedPermissionInfo` 제거 및 `grantedPermissions` 필드 제거, `page.tsx`에서 세부 권한 컬럼 제거.

---

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
