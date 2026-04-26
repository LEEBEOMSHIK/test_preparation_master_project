## HIST-20260426-017

- **날짜**: 2026-04-26
- **수정 범위**: 관리자 백엔드 / 권한 관리
- **수정 개요**: 세부 권한별 접근 메뉴 관리 API 추가 — `PermissionDetailResponse`에 `allowedMenuIds` 포함, `GET/PUT /details/{id}/menus` 엔드포인트 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `dto/response/PermissionDetailResponse.java` | 수정 | `List<Long> allowedMenuIds` 필드 추가, `from(detail, menuIds)` 오버로드 추가 |
| `dto/response/PermissionMasterResponse.java` | 수정 | `from(m, menuIds, userCount, details)` 오버로드 추가 (pre-built details 수용) |
| `service/PermissionService.java` | 수정 | `getAllMasters()`에서 세부 권한별 allowedMenuIds 계산, `getDetailMenuIds()`, `updateDetailMenuAccess()`, `findDetail()` 추가 |
| `controller/AdminPermissionController.java` | 수정 | `GET/PUT /details/{id}/menus` 엔드포인트 추가 |

### 수정 상세

#### `PermissionDetailResponse.java`
- **변경 전**: `(id, masterId, masterCode, masterName, name, description, code, createdAt, updatedAt)` 9개 필드
- **변경 후**: `allowedMenuIds` 추가 → 10개 필드
  ```java
  public static PermissionDetailResponse from(PermissionDetail d, List<Long> allowedMenuIds) { ... }
  ```

#### `PermissionMasterResponse.java`
- **변경 전**: `from(m, allowedMenuIds, userCount)` → 내부에서 `m.getDetails().stream().map(PermissionDetailResponse::from).toList()`
- **변경 후**: `from(m, allowedMenuIds, userCount, details)` 오버로드 추가 → pre-built details 수용

#### `PermissionService.java`
- `getAllMasters()`: 각 세부 권한의 code로 `getMenuIdsByPermissionCode(code)` 호출하여 `allowedMenuIds` 계산
- 신규 메서드:
  ```java
  public List<Long> getDetailMenuIds(Long detailId)         // detail.code로 메뉴 ID 조회
  public void updateDetailMenuAccess(Long detailId, List<Long> menuIds) // detail.code로 메뉴 일괄 교체
  private PermissionDetail findDetail(Long id)              // 공통 헬퍼
  ```

#### 신규 API 엔드포인트 (AdminPermissionController)

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/admin/permissions/details/{id}/menus` | 세부 권한에 할당된 메뉴 ID 목록 |
| PUT | `/api/admin/permissions/details/{id}/menus` | 세부 권한 메뉴 접근 일괄 교체 (body: `List<Long>`) |

### 복원 방법

HIST-20260426-017 복원 시:
- `PermissionDetailResponse.java`: `allowedMenuIds` 필드 제거, `from(d)` 단일 팩토리로 복원
- `PermissionMasterResponse.java`: `from(m, menuIds, userCount, details)` 오버로드 제거
- `PermissionService.java`: `getAllMasters()` 단순 버전으로 복원, `getDetailMenuIds`/`updateDetailMenuAccess`/`findDetail` 제거
- `AdminPermissionController.java`: `GET/PUT /details/{id}/menus` 엔드포인트 제거

---

## HIST-20260426-015

- **날짜**: 2026-04-26
- **수정 범위**: 관리자 백엔드 / 권한 관리 + 계정 관리
- **수정 개요**: RBAC 구현 — PermissionDetail에 `code` 추가, User ↔ PermissionDetail 다대다 연결, JWT에 세부 권한 코드 포함, 계정별 세부 권한 할당 API 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `entity/PermissionDetail.java` | 수정 | `code` 필드 추가 (Spring Security authority 문자열), builder/update() 갱신 |
| `entity/User.java` | 수정 | `@ManyToMany grantedPermissions` 추가 (join table: `user_granted_permissions`) |
| `dto/request/PermissionDetailRequest.java` | 수정 | `@Size(max=100) String code` 추가 |
| `dto/response/PermissionDetailResponse.java` | 수정 | `String code` 필드 추가 |
| `security/jwt/JwtTokenProvider.java` | 수정 | `createAccessToken` 시그니처에 `List<String> permissions` 추가, `getPermissions()` 메서드 추가 |
| `security/jwt/JwtAuthenticationFilter.java` | 수정 | JWT `permissions` 클레임 읽어 개별 `GrantedAuthority`로 추가 |
| `service/AuthService.java` | 수정 | 로그인/리프레시 시 user.getGrantedPermissions()에서 코드 추출 후 JWT에 포함 |
| `service/PermissionService.java` | 수정 | createDetail/updateDetail에서 `code` 처리 |
| `service/AdminUserService.java` | 수정 | `PermissionDetailRepository` 주입, `getUserPermissions()`, `updateUserPermissions()` 추가 |
| `controller/AdminUserController.java` | 수정 | `GET/PUT /{id}/permissions` 엔드포인트 추가 |

### 수정 상세

#### `entity/PermissionDetail.java`
- **변경 전**: `(master, name, description)` 필드, `update(name, description)`
- **변경 후**: `code VARCHAR(100) UNIQUE` 추가
  ```java
  @Column(unique = true, length = 100)
  private String code;
  // builder: (master, name, description, code)
  // update(String name, String description, String code)
  ```

#### `entity/User.java`
- **변경 전**: `PermissionDetail` 참조 없음
- **변경 후**: 다대다 관계 추가 (join table `user_granted_permissions`)
  ```java
  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(name = "user_granted_permissions",
      joinColumns = @JoinColumn(name = "user_id"),
      inverseJoinColumns = @JoinColumn(name = "detail_id"))
  private Set<PermissionDetail> grantedPermissions = new HashSet<>();

  public void setGrantedPermissions(Set<PermissionDetail> permissions) { ... }
  ```

#### `security/jwt/JwtTokenProvider.java`
- **변경 전**: `createAccessToken(String email, String role)`, permissions 클레임 없음
- **변경 후**: `createAccessToken(String email, String role, List<String> permissions)`
  - permissions → `"EXAM_READ,USER_ALL"` 형태로 `permissions` 클레임에 저장
  - `getPermissions(String token)` 메서드 추가

#### `security/jwt/JwtAuthenticationFilter.java`
- **변경 전**: authority = `[ROLE_ADMIN]` 단일
- **변경 후**: `permissions` 클레임 파싱 → `[ROLE_ADMIN, EXAM_READ, USER_ALL]` 다중 authority

#### `service/AuthService.java`
- **변경 전**: `createAccessToken(email, role)` 2인수 호출
- **변경 후**: `user.getGrantedPermissions()` 로드 → code 필터링 → 3인수 호출
  ```java
  List<String> permCodes = user.getGrantedPermissions().stream()
      .map(PermissionDetail::getCode).filter(c -> c != null && !c.isBlank()).toList();
  jwtTokenProvider.createAccessToken(email, role, permCodes);
  ```

#### 신규 API 엔드포인트 (AdminUserController)

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/admin/users/{id}/permissions` | 계정에 할당된 세부 권한 ID 목록 |
| PUT | `/api/admin/users/{id}/permissions` | 세부 권한 일괄 교체 (body: `List<Long>`) |

### 복원 방법

HIST-20260426-015 복원 시:
- `PermissionDetail.java`: `code` 필드 제거, builder/update() 3인수로 복원
- `User.java`: `grantedPermissions` @ManyToMany 제거, Set/HashSet import 제거, `setGrantedPermissions()` 제거
- `PermissionDetailRequest.java`: `code` 필드 제거
- `PermissionDetailResponse.java`: `code` 필드 제거, `from()` 복원
- `JwtTokenProvider.java`: `createAccessToken` 2인수로 복원, `getPermissions()` 제거, permissions claim 제거
- `JwtAuthenticationFilter.java`: 단순 `List.of(new SimpleGrantedAuthority("ROLE_" + role))` 복원
- `AuthService.java`: permCodes 로직 제거, 2인수 createAccessToken 호출 복원, PermissionDetail import 제거
- `PermissionService.java`: createDetail/updateDetail에서 code 제거
- `AdminUserService.java`: PermissionDetailRepository 제거, getUserPermissions/updateUserPermissions 제거
- `AdminUserController.java`: `/{id}/permissions` GET/PUT 엔드포인트 제거
- DB: `user_granted_permissions` 테이블 DROP, `permission_detail.code` 컬럼 DROP

---

## HIST-20260426-012

- **날짜**: 2026-04-26
- **수정 범위**: 관리자 프론트엔드 / 권한 관리
- **수정 개요**: PermissionMaster 타입에 `userCount` 추가, 권한 배지를 계정 수(N명) 표시로 변경

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `PermissionMaster`에 `userCount: number` 추가 |
| `frontend/src/app/admin/permissions/page.tsx` | 수정 | 마스터 헤더 배지: `{master.details.length}개` → `계정 {master.userCount}명` |

### 수정 상세

#### `types/index.ts`
- **변경 전**: `PermissionMaster` 인터페이스에 `userCount` 없음
- **변경 후**: `userCount: number` 필드 추가

#### `app/admin/permissions/page.tsx`
- **변경 전**: `<span>{master.details.length}개</span>` — 세부 권한 수 (항상 0)
- **변경 후**: `<span>계정 {master.userCount}명</span>` — 해당 role을 가진 실제 계정 수

### 복원 방법

HIST-20260426-012 복원 시:
- `types/index.ts`: `PermissionMaster.userCount` 제거
- `permissions/page.tsx`: 배지를 `{master.details.length}개`로 복원

---

## HIST-20260426-010

- **날짜**: 2026-04-26
- **수정 범위**: 관리자 프론트엔드 / 권한 관리
- **수정 개요**: 권한 관리 페이지에 사용자/관리자 탭 추가, 각 권한별 접근 가능 메뉴 체크리스트 UI 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `PermissionScope` 타입 추가, `PermissionMaster`에 `scope`, `allowedMenuIds` 필드 추가 |
| `frontend/src/services/permissionService.ts` | 수정 | `PermissionMasterRequest`에 `scope` 추가, `updateMenuAccess()` API 추가 |
| `frontend/src/app/admin/permissions/page.tsx` | 수정 | 탭(사용자/관리자) 추가, 접근 가능 메뉴 체크리스트 섹션 추가, 권한 추가 시 scope 자동 설정 |

### 수정 상세

#### `types/index.ts`
- **변경 전**:
  ```typescript
  export interface PermissionMaster {
    id: number; code: string; name: string; description?: string;
    createdAt: string; details: PermissionDetail[];
  }
  ```
- **변경 후**:
  ```typescript
  export type PermissionScope = 'USER' | 'ADMIN';

  export interface PermissionMaster {
    id: number; code: string; name: string; description?: string;
    scope: PermissionScope;
    createdAt: string; details: PermissionDetail[];
    allowedMenuIds: number[];
  }
  ```

#### `services/permissionService.ts`
- **변경 전**: `PermissionMasterRequest { code, name, description? }`, `updateMenuAccess()` 없음
- **변경 후**:
  ```typescript
  export interface PermissionMasterRequest {
    code: string; name: string; description?: string;
    scope: PermissionScope;  // 추가
  }

  // 추가된 메서드:
  updateMenuAccess: (id: number, menuIds: number[]) =>
    apiClient.put<ApiResponse<void>>(`/admin/permissions/masters/${id}/menus`, menuIds),
  ```

#### `app/admin/permissions/page.tsx`
- **변경 전**:
  - 모든 권한 마스터를 단일 목록으로 표시
  - 메뉴 접근 섹션 없음
  - 권한 추가 시 scope 선택 없음

- **변경 후** (주요 변경 요약):
  ```typescript
  // 탭 상태
  const [activeTab, setActiveTab] = useState<'USER' | 'ADMIN'>('USER');

  // 메뉴 목록 별도 로드
  const [allMenus, setAllMenus] = useState<{ USER: MenuConfig[]; ADMIN: MenuConfig[] }>(...);
  Promise.all([permissionService.getAll(), menuService.adminGetFlat('USER'), menuService.adminGetFlat('ADMIN')])

  // 필터
  const filteredMasters = masters.filter((m) => m.scope === activeTab);

  // 로컬 체크 상태 (저장 전 pending)
  const [pendingMenus, setPendingMenus] = useState<Record<number, Set<number>>>({});

  // 저장 버튼은 변경사항 있을 때만 표시 (setsEqual 비교)
  ```
  - 탭 클릭 시 해당 scope 권한 목록만 표시
  - 각 권한 블록 내 "접근 가능 메뉴" 섹션: 해당 scope 메뉴를 2열 그리드 체크박스로 표시
  - 체크박스 변경 시 로컬 pending 상태 업데이트 → "변경 사항 저장" 버튼 등장
  - 권한 추가 시 `scope: activeTab` 자동 설정
  - 권한 코드 배지 색상: USER=emerald, ADMIN=indigo

### 복원 방법

HIST-20260426-010 복원 시:
- `types/index.ts`: `PermissionScope` 타입 제거, `PermissionMaster`에서 `scope`, `allowedMenuIds` 제거
- `permissionService.ts`: `PermissionMasterRequest`에서 `scope` 제거, `updateMenuAccess()` 제거
- `permissions/page.tsx`: HIST-20260426-006 이전 상태로 복원 (탭/메뉴 체크 섹션 제거, 단일 목록 표시, `menuService` import 제거)

---

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
