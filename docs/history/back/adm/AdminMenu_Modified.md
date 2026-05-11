## HIST-20260510-004

- **날짜**: 2026-05-10
- **수정 범위**: 관리자 백엔드 / 메뉴 관리
- **수정 개요**: 세부 권한 없는 USER 사용자에게 PUBLIC(1:1 문의) 메뉴만 반환하도록 `getMenuTreeByPermissions` 로직 변경 + 1:1 문의 메뉴에 PUBLIC 마킹

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/MenuConfigService.java` | 수정 | `getMenuTreeByPermissions()` — USER 타입 권한 없음 시 PUBLIC 메뉴만 반환, 권한 있음 시 매칭+PUBLIC 포함 |
| `backend/.../config/DataInitializer.java` | 수정 | `ensurePermissionMenuAssociations()` — `/user/inquiries`에 `PUBLIC` 권한 코드 추가 |

### 수정 상세

#### `MenuConfigService.getMenuTreeByPermissions()`
- **변경 전**: `codes.isEmpty()` → 해당 타입 전체 메뉴 반환 (USER/ADMIN 구분 없음)
- **변경 후**:
  ```
  codes 비어 있음 + ADMIN 타입 → 전체 반환 (슈퍼 어드민 폴백 유지)
  codes 비어 있음 + USER 타입  → PUBLIC 마킹된 메뉴만 반환
  codes 있음                   → 권한 매칭 메뉴 + PUBLIC 메뉴 반환
  ```

#### `DataInitializer.ensurePermissionMenuAssociations()`
- 기존: GENERAL_USER(USER 메뉴), MASTER_ADMIN(ADMIN 메뉴) 코드만 추가
- 추가: `/user/inquiries` 메뉴에 `PUBLIC` 코드 추가 (세부 권한 없이도 항상 접근 가능)

### 복원 방법

HIST-20260510-004 복원 시:
- `MenuConfigService`: `codes.isEmpty()` → `menus` (단순 전체 반환)으로 되돌림
- `DataInitializer`: PUBLIC UPDATE 구문 제거
- DB: `UPDATE menu_config SET allowed_roles = REPLACE(allowed_roles, ',PUBLIC', '') WHERE url = '/user/inquiries'`

---

## HIST-20260426-005

- **날짜**: 2026-04-26
- **수정 범위**: 관리자 백엔드 / 메뉴 관리
- **수정 개요**: MenuConfig 테이블 신규 추가, CRUD API 구현, /api/menus 공용 조회 엔드포인트 추가, DataInitializer에 기본 관리자/사용자 메뉴 시딩

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `entity/MenuConfig.java` | 추가 | 메뉴 엔티티 (id, parentId, name, url, iconKey, displayOrder, menuType, isActive, allowedRoles, timestamps) |
| `repository/MenuConfigRepository.java` | 추가 | menuType별 조회, existsByUrl 메서드 |
| `dto/request/MenuConfigRequest.java` | 추가 | 메뉴 요청 DTO |
| `dto/response/MenuConfigResponse.java` | 추가 | 메뉴 응답 DTO (children 포함) |
| `service/MenuConfigService.java` | 추가 | 메뉴 트리 조회, CRUD 서비스 |
| `controller/AdminMenuController.java` | 추가 | `/api/admin/menus` CRUD (관리자 전용) |
| `controller/MenuController.java` | 추가 | `/api/menus` 공용 트리 조회 (인증 필요) |
| `config/SecurityConfig.java` | 수정 | `/api/menus` 경로에 `authenticated()` 규칙 추가 |
| `config/DataInitializer.java` | 수정 | ensureDefaultMenus() 추가 — 관리자·사용자 기본 메뉴 시딩 |

### API 엔드포인트 (신규)

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/menus?menuType=ADMIN\|USER` | 활성 메뉴 트리 조회 (인증 필요) |
| GET | `/api/admin/menus?menuType=&treeView=&activeOnly=` | 메뉴 조회 (관리자) |
| POST | `/api/admin/menus` | 메뉴 추가 |
| PUT | `/api/admin/menus/{id}` | 메뉴 수정 |
| DELETE | `/api/admin/menus/{id}` | 메뉴 삭제 |

### 복원 방법

HIST-20260426-005 복원 시:
- 신규 파일 모두 삭제
- `SecurityConfig.java`에서 `/api/menus` 규칙 제거
- `DataInitializer.java`에서 `ensureDefaultMenus()` 관련 코드 제거
