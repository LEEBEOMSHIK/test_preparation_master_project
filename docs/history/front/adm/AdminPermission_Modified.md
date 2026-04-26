## HIST-20260426-017

- **날짜**: 2026-04-26
- **수정 범위**: 관리자 프론트엔드 / 권한 관리
- **수정 개요**: 권한 관리 페이지 4가지 버그/기능 수정 — 세부 권한 추가 버그 수정, 추가 폼 레이아웃 2행 분리, 메뉴 계층 표시 수정, 접근 가능 메뉴를 마스터 단위에서 세부 권한 단위로 이동

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `PermissionDetail`에 `allowedMenuIds: number[]` 추가 |
| `frontend/src/services/permissionService.ts` | 수정 | `getDetailMenuAccess()`, `updateDetailMenuAccess()` 추가 |
| `frontend/src/app/admin/permissions/page.tsx` | 수정 | 4가지 수정 (하단 상세 참조) |

### 수정 상세

#### 버그 1: 세부 권한 추가 실패
- **변경 전**: onChange 핸들러가 `{ ...prev[master.id], field: val }` 패턴 사용 → `prev[master.id]`가 undefined일 때 형제 필드 누락 → `input.code.trim()` 호출 시 TypeError 발생
- **변경 후**: `setDetailInput(masterId, field, value)` 헬퍼 함수로 통합:
  ```typescript
  const current = prev[masterId] ?? { name: '', desc: '', code: '' };
  return { ...prev, [masterId]: { ...current, [field]: value } };
  ```

#### 버그 2: 추가 폼 스타일 깨짐
- **변경 전**: 이름(flex-1) + 코드(w-44) + 설명(flex-1) + 버튼을 단일 `flex gap-2` 행에 배치 → max-w-2xl 컨테이너에서 오버플로우
- **변경 후**: 2행으로 분리
  - 1행: 이름(flex-1) + 코드(w-44)
  - 2행: 설명(flex-1) + 추가 버튼

#### 수정 3: 메뉴 계층 표시
- **변경 전**: `currentMenus.map()` 플랫 목록에 `└` 접두어만 추가 → 부모/자식 순서 보장 없음
- **변경 후**: `buildMenuHierarchy(menus)` 헬퍼 추가 → 부모를 displayOrder 순으로 정렬, 각 부모 아래 자식을 들여쓰기로 표시

#### 수정 4: 접근 가능 메뉴를 세부 권한 단위로 이동
- **변경 전**: "접근 가능 메뉴" 체크박스가 PermissionMaster 블록 레벨에 표시, `pendingMenus: Record<masterId, Set<menuId>>`
- **변경 후**: 각 PermissionDetail 항목에 "메뉴 설정" 토글 버튼 추가, 클릭 시 해당 세부 권한의 메뉴 체크박스 확장
  - `pendingDetailMenus: Record<detailId, Set<menuId>>`
  - `expandedMenuDetail: number | null` — 현재 확장된 세부 권한 ID
  - 코드가 없는 세부 권한은 "권한 코드를 먼저 설정해야..." 안내 메시지 표시
  - 변경 사항 있을 때만 "변경 사항 저장" 버튼 표시

### 복원 방법

HIST-20260426-017 복원 시:
- `types/index.ts`: `PermissionDetail.allowedMenuIds` 제거
- `permissionService.ts`: `getDetailMenuAccess`, `updateDetailMenuAccess` 제거
- `permissions/page.tsx`: HIST-20260426-016 상태로 복원 (단일 flex 행 추가 폼, 플랫 메뉴 목록, 마스터 단위 접근 메뉴)

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
