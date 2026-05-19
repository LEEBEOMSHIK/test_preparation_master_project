## HIST-20260516-002

- **날짜**: 2026-05-16
- **수정 범위**: 관리자 프론트엔드 / 레이아웃 메뉴 병합 로직
- **수정 개요**: DB 메뉴 로드 시 대시보드 순서 및 로그인 히스토리 서브메뉴가 누락되는 버그 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | menuService 병합 로직 개선 |

### 수정 상세

#### `AdminLayoutShell.tsx` — `menuService.getMyMenus` 병합 로직

- 변경 전:
  - `[...apiMenus, ...missing]` — missing 항목이 뒤에 붙어 대시보드(displayOrder: 0)가 하단에 위치
  - DB에 `/admin/users`가 있으면 해당 FALLBACK 항목 전체가 제외되어 로그인 히스토리 children 누락
- 변경 후:
  - `enriched`: API 메뉴에 children이 없고 FALLBACK에 children이 있으면 FALLBACK children으로 보완
  - `merged`: `[...enriched, ...missing].sort((a, b) => a.displayOrder - b.displayOrder)` — displayOrder 기준 정렬로 대시보드 최상단 보장
- 이유: DB 메뉴가 로드될 때도 FALLBACK에서 정의한 구조(순서·자식메뉴)가 올바르게 반영되어야 함

### 복원 방법

이 ID(HIST-20260516-002)로 복원 시 menuService.getMyMenus 콜백을 변경 전 코드로 되돌린다.

---

## HIST-20260512-001

- **날짜**: 2026-05-12
- **수정 범위**: 관리자 프론트엔드 / 레이아웃
- **수정 개요**: AdminLayoutShell에서 USER 토큰으로 관리자 화면 진입 시 403이 발생하는 버그 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | authService import 추가, setAuth 추가, authService.me()로 ADMIN role 검증 |

### 원인

AdminLayoutShell이 sessionStorage에 토큰이 존재하는지만 확인하고 role은 검증하지 않음.
사용자(ROLE_USER) 토큰이 sessionStorage에 남아있는 상태에서 /admin/** 접근 시, 서버가 정당하게 403 반환.

### 수정 상세

변경 전: 토큰 존재 확인 후 role 검증 없이 menuService 호출
변경 후: authService.me()로 role 확인 → ADMIN이 아니면 clearAuth + /admin/login 리다이렉트

### 복원 방법

authService import 제거, setAuth 제거, authService.me() 블록 제거 후 원래 구조로 복원
