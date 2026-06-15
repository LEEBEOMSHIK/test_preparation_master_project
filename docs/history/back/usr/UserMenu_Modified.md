## HIST-20260615-001

- **날짜**: 2026-06-15
- **수정 범위**: 사용자 백엔드 / 메뉴 시딩(DataInitializer)
- **수정 개요**: '설정'(`/user/settings`) 메뉴를 도움말 그룹 하위에 추가 — 드롭다운(헤더 사용자 메뉴)뿐 아니라 네비게이션 메뉴(도움말)에서도 접근 가능하게 함.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../config/DataInitializer.java` | 수정 | `ensureUserMenuGroups()`에 설정 메뉴 생성(멱등) + 도움말 그룹(helpId) 하위 order 4로 재배치 |

### 수정 상세
- `existsByUrl("/user/settings")` 가드로 설정 메뉴(USER, allowedRoles "USER,ADMIN", icon 'settings') 생성 — 이후 `ensurePermissionMenuAssociations()`에서 GENERAL_USER 부여.
- `reparentMenu("/user/settings", helpId, 4)`로 도움말 그룹 하위에 배치(시험 정보·FAQ·1:1 문의 다음).
- **검증**: `GET /api/menus/mine?menuType=USER` 결과 도움말 그룹에 설정 포함 확인. 크롬 — 도움말 드롭다운에 '설정' 노출.

### 복원 방법
이 ID(HIST-20260615-001)로 복원 시 설정 메뉴 생성/재배치 라인 제거 + DB에서 `/user/settings` 메뉴 행 삭제.

---

## HIST-20260614-001

- **날짜**: 2026-06-14
- **수정 범위**: 사용자 백엔드 / 메뉴 시딩(DataInitializer)
- **수정 개요**: USER 메뉴를 그룹(학습/내 기록/도움말) 부모-자식 구조로 재배치. 그룹 부모 3종 생성 + 기존 리프 메뉴의 `parent_id`·`display_order`를 멱등 재설정.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/config/DataInitializer.java` | 수정 | `ensureUserMenuGroups()` + 헬퍼(`ensureGroupMenu`/`menuIdByUrl`/`reparentMenu`) 추가, `run()` 순서에 호출 삽입 |

### 수정 상세

#### `config/DataInitializer.java`
- **`run()` 순서**: `ensureDashboardMenu()` 다음, `ensurePermissionMenuAssociations()` 이전에 `ensureUserMenuGroups()` 호출 추가 — 모든 리프 메뉴가 생성된 뒤 그룹화하고, 그룹 부모도 GENERAL_USER 권한 코드 연결 대상에 포함되도록 순서 배치.
- **`ensureUserMenuGroups()`**:
  - 그룹 부모 3종 생성(멱등, `existsByUrl` 가드): `학습`(`/user/group/learning`, icon `learn`), `내 기록`(`/user/group/records`, icon `records`), `도움말`(`/user/group/help`, icon `help`). 그룹 부모는 실제 페이지가 없어 합성 URL 사용(프론트 렌더러가 children 보유 항목을 드롭다운 토글로 처리).
  - 최상위 순서 재설정: `시험`(1) → `학습`(2) → `내 기록`(3) → `도움말`(4).
  - 자식 재배치(`reparentMenu` UPDATE): 학습 ← 데일리 퀴즈/연습장/개념노트, 내 기록 ← 통계 대시보드/시험 이력/즐겨찾기, 도움말 ← 시험 정보/FAQ/1:1 문의.
  - `url` NOT NULL 제약·`getMenuTreeByPermissions`(parent_id NULL을 루트로, 나머지를 children으로 그룹화) 구조를 그대로 활용.
- **멱등성**: 그룹 생성은 `existsByUrl`로, 재배치는 매 부팅 동일 값 UPDATE이므로 재실행 안전.
- **권한**: 그룹 부모는 `USER,ADMIN`으로 생성되며 후속 `ensurePermissionMenuAssociations()`에서 `GENERAL_USER`가 추가됨 → 일반 사용자 트리에 정상 노출.
- **이유**: 사용자 메뉴 증가로 네비게이션 과밀 → 성격별 3그룹으로 묶기 위한 데이터 구조 정비.
- **검증**: `GET /api/menus/mine?menuType=USER` 호출 결과 `시험` + 3그룹(각 자식 3종) 트리 정상 반환 확인.

### 복원 방법
이 ID(HIST-20260614-001)로 복원 시 `run()`에서 `ensureUserMenuGroups()` 호출과 메서드 4종을 제거하고, DB에서 그룹 부모 3행 삭제 후 USER 리프 메뉴의 `parent_id`를 NULL로 되돌린다.

---

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
