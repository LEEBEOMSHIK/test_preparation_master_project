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
