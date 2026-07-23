## HIST-20260724-001

- **날짜**: 2026-07-24
- **수정 범위**: 관리자 프론트엔드 / 메뉴 관리 — 모바일(390px) "메뉴 추가" 버튼 줄바꿈 수정
- **수정 개요**: 모바일 UI/UX 2차 조사에서 발견된 버그. 헤더 영역(`flex items-center justify-between`)에서 좌측 제목 블록과 "메뉴 추가" 버튼이 한 행을 다투면서 버튼 텍스트가 "메뉴 추\n가"로 줄바꿈되던 문제. 버튼에 `shrink-0 whitespace-nowrap`을 추가하고, 헤더 컨테이너에 `flex-wrap gap-3`을 추가해 좁은 화면에서는 버튼이 다음 줄로 자연스럽게 내려가도록(줄바꿈이 아닌 행바꿈) 했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/menus/page.tsx` | 수정 | 헤더 컨테이너에 `flex-wrap gap-3` 추가, "메뉴 추가" 버튼에 `shrink-0 whitespace-nowrap` 추가 |

### 수정 상세

#### `frontend/src/app/admin/menus/page.tsx`
- 변경 전:
  ```tsx
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-xl font-semibold text-gray-900">메뉴 관리</h2>
      ...
    </div>
    <button ... className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5">
      ...메뉴 추가
    </button>
  </div>
  ```
- 변경 후:
  ```tsx
  <div className="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h2 className="text-xl font-semibold text-gray-900">메뉴 관리</h2>
      ...
    </div>
    <button ... className="shrink-0 whitespace-nowrap px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5">
      ...메뉴 추가
    </button>
  </div>
  ```
- 이유: 좁은 화면에서 버튼이 압축되며 텍스트가 글자 단위로 줄바꿈되는 것을 방지. `flex-wrap`으로 공간이 부족하면 버튼이 다음 줄로 내려가도록 해 텍스트 자체는 항상 한 줄을 유지한다.

### 검증
- `npx tsc --noEmit` 통과.
- 브라우저 실측(390×844): "메뉴 추가" 버튼 한 줄 표시, `document.documentElement.scrollWidth === clientWidth === 390`.
- 데스크톱(1440×900): 기존과 동일하게 헤더 한 줄 표시, 레이아웃 변화 없음.

### 복원 방법
이 ID(HIST-20260724-001)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 파일에 적용한다.

## HIST-20260503-001

- **날짜**: 2026-05-03
- **수정 범위**: 관리자 프론트엔드 / 메뉴 관리
- **수정 개요**: 아이콘 키 콤보박스를 하드코딩 목록 → DB distinct 값 + "직접 입력" 옵션 방식으로 전환

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/menus/page.tsx` | 수정 | `ICON_KEYS` 상수 제거 → DB distinct iconKey 동적 조회, "직접 입력" 선택 시 텍스트 입력창 표시 |

### 수정 상세

#### `app/admin/menus/page.tsx`
- **변경 전**:
  - `ICON_KEYS` 하드코딩 배열 상수 (line 10)
  - `<select>` 옵션이 고정 목록만 표시
  - 직접 입력 불가
- **변경 후**:
  - `FALLBACK_ICON_KEYS` 상수 (기존 목록 + `examinfo` 추가)
  - `CUSTOM_VALUE = '__custom__'` 상수
  - `allFlatMenus` state — USER·ADMIN 양쪽 flat 메뉴 보관
  - `distinctIconKeys` useMemo — `allFlatMenus`의 iconKey distinct 값 + `FALLBACK_ICON_KEYS` 병합·정렬
  - `load()` 함수: 기존 2개 Promise → 3개 (`adminGetAll(tab)`, `adminGetFlat(tab)`, `adminGetFlat(otherTab)`)로 확장
  - `MenuForm` 내부에 `isCustom`·`customText` state 추가
    - 콤보박스 마지막 옵션으로 "직접 입력" 추가
    - "직접 입력" 선택 시 텍스트 input 표시, 입력값이 `iconKey`로 반영
    - 기존에 목록에 없는 iconKey 값을 가진 메뉴 수정 시 자동으로 직접 입력 모드로 초기화
  - `MenuForm` `menuType` prop 타입: `'USER' | 'ADMIN'` → `string` (타입 오류 수정)
  - `MenuForm`에 `key` prop 추가 — 편집 대상 변경 시 내부 state 초기화 보장

### 복원 방법

HIST-20260503-001 복원 시:
- `CUSTOM_VALUE`, `FALLBACK_ICON_KEYS` 제거, `ICON_KEYS` 상수 복원
- `allFlatMenus` state 제거, `distinctIconKeys` useMemo 제거
- `load()` 함수를 2개 Promise로 되돌림 (`adminGetAll`, `adminGetFlat(tab)`)
- `MenuForm`에서 `isCustom`·`customText` state 및 직접 입력 input 제거, `menuType` prop 타입 `'USER' | 'ADMIN'` 복원

---

## HIST-20260502-002

- **날짜**: 2026-05-02
- **수정 범위**: 관리자 프론트엔드 / 메뉴 관리
- **수정 개요**: 로딩 스피너를 `TableSkeleton`으로 교체 (CLAUDE.md Skeleton 컨벤션 준수)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/menus/page.tsx` | 수정 | `animate-spin` 스피너 → `TableSkeleton rows={6} cols={4}` 교체, `TableSkeleton` import 추가 |

### 수정 상세

- 변경 전: 로딩 시 `animate-spin` 원형 스피너
- 변경 후: `TableSkeleton rows={6} cols={4}` (다른 관리자 페이지와 동일한 Skeleton 패턴)
- 이유: CLAUDE.md Skeleton UI 컨벤션 — 스피너/텍스트 단독 사용 금지

### 복원 방법

HIST-20260502-002 복원 시:
- `menus/page.tsx` import에서 `TableSkeleton` 제거
- loading early return을 스피너(`animate-spin`) 블록으로 되돌림

---

## HIST-20260426-007

- **날짜**: 2026-04-26
- **수정 범위**: 관리자 프론트엔드 / 메뉴 관리 + 레이아웃
- **수정 개요**: 메뉴 관리 페이지 신규 구현, AdminLayoutShell을 DB 기반 동적 메뉴로 전환 (API fallback 포함), 권한·메뉴 관리 항목 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/menuService.ts` | 추가 | 메뉴 CRUD API 서비스 (adminGetAll, adminGetFlat, getMenuTree, create, update, delete) |
| `frontend/src/app/admin/menus/page.tsx` | 추가 | 메뉴 관리 페이지 신규 생성 |
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | 아이콘 맵 추가, API에서 동적 메뉴 로딩, FALLBACK_NAV 정의 (API 오류 시 폴백), 권한·메뉴 관리 기본 포함 |

### 수정 상세

#### `app/admin/menus/page.tsx`
- **변경 전**: 파일 없음
- **변경 후**: 신규 생성
  - 탭: 관리자 메뉴 / 사용자 메뉴
  - 메뉴 트리 표시 (상위 + 하위)
  - 메뉴 추가: 이름, URL, 상위 메뉴, 아이콘 키, 순서, 허용 권한, 활성화 폼
  - 메뉴 수정: 인라인 편집 폼
  - 메뉴 삭제: confirm 후 삭제

#### `components/layout/AdminLayoutShell.tsx`
- **변경 전**: NAV_ITEMS 정적 배열 하드코딩
- **변경 후**:
  - ICON_MAP (iconKey → SVG 노드 맵)
  - FALLBACK_NAV: API 불가 시 사용하는 기본 정적 메뉴
  - useEffect에서 `menuService.adminGetAll('ADMIN')` 호출 → 성공 시 navItems 상태 업데이트
  - 권한 관리(`/admin/permissions`), 메뉴 관리(`/admin/menus`) 항목 기본 포함

### 복원 방법

HIST-20260426-007 복원 시:
- `menuService.ts` 삭제
- `app/admin/menus/page.tsx` 삭제
- `AdminLayoutShell.tsx`: 이전 정적 NAV_ITEMS 배열 복원, ICON_MAP·FALLBACK_NAV·동적 로딩 코드 제거
