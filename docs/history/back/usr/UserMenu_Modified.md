## HIST-20260502-007

- **날짜**: 2026-05-02
- **수정 범위**: 사용자/관리자 백엔드 / 메뉴 API
- **수정 개요**: `GET /api/menus/mine` 엔드포인트 신규 추가 — JWT authorities에 포함된 권한 코드를 기반으로 현재 로그인 사용자에게 허용된 메뉴 트리만 반환

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/controller/MenuController.java` | 수정 | `GET /api/menus/mine` 엔드포인트 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/MenuConfigService.java` | 수정 | `getMenuTreeByPermissions(MenuType, Set<String> codes)` 메서드 추가 |

### 수정 상세

#### `controller/MenuController.java`
- **변경 전**: `GET /api/menus?menuType=` 하나만 존재 (인증 사용자에게 해당 타입 전체 메뉴 반환)
- **변경 후**: `GET /api/menus/mine?menuType=` 추가
  - `@PreAuthorize("isAuthenticated()")` 인증 필수
  - `Authentication` 파라미터에서 `ROLE_` 접두사가 없는 authorities → 권한 코드 `Set<String>` 추출
  - `menuConfigService.getMenuTreeByPermissions(menuType, codes)` 호출 후 반환
  - JWT에 권한 코드가 없는 경우(슈퍼 어드민 등) → 해당 타입 전체 메뉴 반환

#### `service/MenuConfigService.java`
- **변경 전**: `getMenuIdsByPermissionCode(String code)` — 단일 코드로 메뉴 ID 목록 반환
- **변경 후**: `getMenuTreeByPermissions(MenuType, Set<String> codes)` 추가
  - `codes`가 비어 있으면 해당 타입 활성 메뉴 전체를 트리로 반환
  - `codes`에 값이 있으면 `allowedRoles`에 해당 코드가 하나라도 포함된 메뉴만 필터링
  - 필터된 목록으로 부모-자식 트리 구조 빌드 후 `MenuConfigResponse` 리스트 반환

### 동작 원리

```
JWT 클레임 "permissions": "DEPT_MGR,READ_ONLY"
         ↓
Authentication.getAuthorities() = [ROLE_ADMIN, DEPT_MGR, READ_ONLY]
         ↓
ROLE_ 접두사 제외 → codes = {DEPT_MGR, READ_ONLY}
         ↓
MenuConfig.allowedRoles 중 DEPT_MGR 또는 READ_ONLY가 포함된 메뉴만 반환
         ↓
권한 없으면(빈 Set) → 전체 메뉴 반환 (슈퍼어드민 동작)
```

### 복원 방법

HIST-20260502-007 복원 시:
- `MenuController.java`에서 `getMyMenus()` 메서드 및 관련 import 제거
- `MenuConfigService.java`에서 `getMenuTreeByPermissions()` 메서드 및 `Set` import 제거
