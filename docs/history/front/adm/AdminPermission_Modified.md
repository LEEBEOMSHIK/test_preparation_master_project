## HIST-20260724-001

- **날짜**: 2026-07-24
- **수정 범위**: 관리자 프론트엔드 / 권한 관리 — 모바일(390px) 그룹명·세부권한명 텍스트 세로 쪼개짐 수정
- **수정 개요**: 모바일 UI/UX 2차 조사에서 발견된 버그. 권한 그룹(마스터) 이름·설명과 세부 권한 이름이 좁은 flex 컬럼(`flex-1 min-w-0`)에서 CJK 기본 줄바꿈 규칙에 의해 글자 단위로 쪼개져 "사\n용\n자"처럼 세로로 표시되던 문제. `break-keep`(word-break: keep-all)을 적용해 최소한 단어 단위로 줄바꿈되도록 했다. 세부 권한 행의 경우 이름 span에 걸려 있던 `flex-1`을 제거(자연폭으로 렌더 — flex-basis:0 기반 강제 압축을 없애 배지·설명과 겹치는 현상 방지)하고, 행 컨테이너에 `flex-wrap`을 추가해 좁은 화면에서 메뉴접근/수정/삭제 버튼이 다음 줄로 자연스럽게 넘어가도록 했다.
- **참고**: 세부 권한 행은 아이콘+이름+코드배지+설명+메뉴접근버튼+수정+삭제가 모두 인라인으로 배치되어 있어 모바일에서 여전히 다소 빽빽하다. 리팩토링 없이 개별 수정만 진행하라는 지시에 따라 텍스트 줄바꿈 버그만 해결했고, 행 전체 레이아웃 재구성은 범위 밖으로 남겨둔다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/permissions/page.tsx` | 수정 | master.name/description에 `break-keep` 추가, detail.name span `flex-1`→자연폭+`break-keep`, 세부 권한 행 컨테이너에 `flex-wrap` 추가 |

### 수정 상세

#### `frontend/src/app/admin/permissions/page.tsx`
- 변경 전:
  ```tsx
  <div className="flex-1 min-w-0">
    <p className="text-base font-bold text-gray-900">{master.name}</p>
    {master.description && (
      <p className="text-xs text-gray-500 mt-0.5">{master.description}</p>
    )}
  </div>
  ...
  <div className="flex items-center gap-3 px-4 py-3">
    ...
    <span className="flex-1 text-sm font-medium text-gray-800">{detail.name}</span>
  ```
- 변경 후:
  ```tsx
  <div className="flex-1 min-w-0">
    <p className="text-base font-bold text-gray-900 break-keep">{master.name}</p>
    {master.description && (
      <p className="text-xs text-gray-500 mt-0.5 break-keep">{master.description}</p>
    )}
  </div>
  ...
  <div className="flex items-center flex-wrap gap-3 px-4 py-3">
    ...
    <span className="text-sm font-medium text-gray-800 break-keep">{detail.name}</span>
  ```
- 이유: `flex-1`(flex-basis:0)로 강제 압축된 텍스트 요소가 CJK 기본 줄바꿈 규칙상 글자 단위로 쪼개지는 버그. `break-keep`으로 단어 단위 줄바꿈을 보장하고, 세부 권한 이름은 `flex-1`을 제거해 압축 자체를 없애 배지와의 겹침을 방지했다.

### 검증
- `npx tsc --noEmit` 통과.
- 브라우저 실측(390×844): "사용자" 그룹명 한 줄 표시, "일반 사용자 권한" 설명 단어 단위 줄바꿈, "일반 사용자" 세부권한명 한 줄 표시(배지와 겹침 없음), 메뉴접근/수정/삭제 버튼 다음 줄로 자연스럽게 배치.
- 데스크톱(1440×900): 기존과 동일하게 한 줄 표시, 레이아웃 변화 없음.

### 복원 방법
이 ID(HIST-20260724-001)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 파일에 적용한다.

## HIST-20260502-005

- **날짜**: 2026-05-02
- **수정 범위**: 관리자 프론트엔드 / 권한 관리
- **수정 개요**: 세부 권한 메뉴 접근 영역을 tri-state 체크박스 트리 구조로 개선 — 상위 메뉴 클릭 시 전체 하위 토글, 전체 체크 시 상위 자동 체크, Indeterminate 상태 표시

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/permissions/page.tsx` | 수정 | `buildMenuHierarchy` 제거, `IndeterminateCheckbox`·`MenuCheckboxTree` 컴포넌트 추가, 메뉴 패널 그리드 → 트리 UI 교체 |

### 수정 상세

#### `app/admin/permissions/page.tsx`
- **변경 전**: 메뉴 접근 패널에 `grid-cols-2` 2열 평면 체크박스 목록 — 상위/하위 메뉴 구분 없이 `└` 접두어만으로 계층 표시
- **변경 후**:
  - `buildMenuHierarchy()` 제거, `toggleDetailMenu()` 제거
  - `IndeterminateCheckbox` 컴포넌트: `useRef`로 `input.indeterminate` 직접 제어 → 중간 선택 상태(`—`) 표시
  - `MenuCheckboxTree` 컴포넌트:
    - 상위 메뉴: 색상 헤더 + tri-state 체크박스 + 우측 `N / M` 카운트
    - 하위 메뉴: 들여쓰기(`pl-9`) + 개별 체크박스
    - 상위 클릭 → 전체 하위 on/off (allOn 기준)
    - 하위 전부 체크 → 상위 자동 체크
    - 하위 일부 체크 → 상위 Indeterminate
  - 메뉴 패널 내 `<MenuCheckboxTree>` 연결: `onChange={(next) => setPendingDetailMenus(prev => ({...prev, [detail.id]: next}))}`
  - `import { ..., useRef, useMemo }` 추가

### 복원 방법

HIST-20260502-005 복원 시 `permissions/page.tsx`를 HIST-20260502-004 시점 내용으로 되돌린다:
- `import`에서 `useRef`, `useMemo` 제거
- `buildMenuHierarchy()`, `toggleDetailMenu()` 함수 복원
- `IndeterminateCheckbox`, `MenuCheckboxTree` 컴포넌트 제거
- 메뉴 패널을 기존 `grid-cols-2` 체크박스 그리드로 복원

---

## HIST-20260502-004

- **날짜**: 2026-05-02
- **수정 범위**: 관리자 프론트엔드 / 권한 관리
- **수정 개요**: 마스터(권한 그룹) / 세부 권한 시각 계층 개선 — 섹션 레이블·색상 강화, 구조 안내 배너 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/permissions/page.tsx` | 수정 | 마스터/세부 권한 시각 구분 강화 |

### 수정 상세

#### `app/admin/permissions/page.tsx`
- **변경 전**: 마스터 헤더와 세부 권한 행이 배경색 차이만으로 구분 — 계층 파악 어려움
- **변경 후**:
  - 구조 안내 배너 추가 (상단 amber 배너: "권한 그룹"과 "세부 권한" 역할 설명)
  - 마스터 헤더: `MASTER` 뱃지 + `권한 그룹` 레이블 + 탭별 색상(USER=에메랄드, ADMIN=인디고)
  - 세부 권한 섹션 레이블 추가 (`세부 권한 N건` 구분선)
  - 세부 권한 행: 좌측 세로선(`border-l-2`) + `▸` 아이콘으로 하위 항목 표시
  - 메뉴 접근 패널: 별도 rounded 카드 UI로 분리
  - 세부 권한 추가 영역: 점선 구분선 + `+ 세부 권한 추가` 레이블
  - 탭 UI: 밑줄 방식 → pill 방식으로 변경
  - 버튼 텍스트: "권한 추가" → "권한 그룹 추가"

### 복원 방법

HIST-20260502-004 복원 시 `permissions/page.tsx`를 HIST-20260430-007 시점 내용으로 되돌린다.

---

## HIST-20260430-007

- **날짜**: 2026-04-30
- **수정 범위**: 관리자 프론트엔드 / 권한 관리
- **수정 개요**: 전체 너비 레이아웃으로 변경 + 권한 코드/이름 키워드 검색 조건 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/permissions/page.tsx` | 수정 | `max-w-2xl` 제거, `masterKeyword`/`appliedMasterKeyword` 상태 추가, `filteredMasters` IIFE에 키워드 필터 레이어 추가, 검색 UI 추가 |

### 수정 상세

- **변경 전**: `<div className="max-w-2xl space-y-6">` + `filteredMasters = masters.filter(m => m.scope === activeTab)`
- **변경 후**: `<div className="space-y-6">` + IIFE에서 탭 필터 후 키워드 필터 추가 적용
- **이유**: 다른 관리자 페이지와 동일한 전체 너비 레이아웃 통일; 권한이 많을 때 빠른 검색 가능

### 복원 방법

이 ID(HIST-20260430-007)로 복원 시: `max-w-2xl` 복원, 검색 상태/UI 제거, `filteredMasters` 단순 filter 복원

---

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
