## HIST-20260831-001

- **날짜**: 2026-08-31
- **수정 범위**: 관리자 프론트엔드 / 글로벌 레이아웃 메뉴
- **수정 개요**: 이메일 템플릿 관리 fallback 메뉴·아이콘과 모든 하위 경로 제목을 추가했다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | email 아이콘, displayOrder 15 fallback, edit/new 제목 보강 |
| `frontend/src/components/layout/AdminLayoutShell.test.tsx` | 추가 | API 메뉴와 fallback 편집 경로 렌더링 테스트 |

### 수정 상세

#### `AdminLayoutShell`
- 변경 전: API 메뉴가 비거나 실패하면 이메일 템플릿 링크가 없고, 해당 경로 제목은 대시보드로 폴백했다.
- 변경 후: `/admin/email-templates` fallback 메뉴와 email 봉투 아이콘을 추가하고, base/new/edit 경로 제목을 모두 `이메일 템플릿 관리`로 고정한다.
- 이유: DB 메뉴 로딩 전후와 상세 편집 경로에서도 전역 탐색·제목을 일관되게 제공하기 위해서다.

### 복원 방법

이 ID(`AdminLayout_Modified.md` 기준 HIST-20260831-001)로 복원 시 email 아이콘·fallback 항목·제목 분기와 새 테스트 파일을 제거한다.

---

## HIST-20260724-001

- **날짜**: 2026-07-24
- **수정 범위**: 관리자 프론트엔드 / 레이아웃 셸 — 모바일 최소 방어
- **수정 개요**: `AdminLayoutShell.tsx`의 사이드바가 항상 `w-56` 고정폭으로 펼쳐져 있어 모바일(390px)에서 본문이 심하게 눌리고 메뉴 텍스트가 세로로 쪼개지던 문제를, `lg` 미만에서 사이드바를 기본적으로 접고 햄버거 버튼으로 오버레이 토글하는 방식으로 최소 방어. 데스크톱(`lg` 이상)은 기존 동작 100% 유지.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | `mobileSidebarOpen` 상태 추가, 사이드바에 `-translate-x-full`/`lg:translate-x-0` 토글 클래스 적용, 모바일 전용 backdrop 오버레이 추가, 본문 마진을 `ml-0 lg:ml-56`으로 변경, 헤더에 `lg:hidden` 햄버거 토글 버튼 추가, 경로 이동 시 자동 닫힘 useEffect 추가 |

### 수정 상세

#### `frontend/src/components/layout/AdminLayoutShell.tsx`
- 변경 전:
  - 사이드바: `<aside className="fixed inset-y-0 left-0 z-40 w-56 ... flex flex-col shadow-sm">` — 반응형 분기 없이 항상 펼쳐짐
  - 본문: `<div className="flex-1 flex flex-col min-w-0 ml-56">`
  - 헤더: 햄버거 버튼 없음, `<h1>` 타이틀만 존재
  - state: `mobileSidebarOpen` 없음
- 변경 후:
  - state 추가: `const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);` + `useEffect(() => { setMobileSidebarOpen(false); }, [pathname]);`(경로 이동 시 자동 닫힘)
  - backdrop: `mobileSidebarOpen`이 true일 때만 `fixed inset-0 z-40 bg-black/30 lg:hidden` 오버레이 렌더, 클릭 시 닫힘
  - 사이드바: `z-40` → `z-50`, `transform transition-transform duration-200 lg:translate-x-0` + `mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'` 추가 — `lg` 이상은 `lg:translate-x-0`가 항상 우선해 기존과 동일하게 펼쳐짐
  - 본문: `ml-56` → `ml-0 lg:ml-56`
  - 헤더: `px-6` → `px-4 sm:px-6`, 타이틀 좌측에 `lg:hidden` 햄버거 버튼(`aria-label="메뉴 열기"`) 추가, 부제 "TPMP 관리자 콘솔"은 `hidden sm:block`으로 모바일에서 숨김
- 이유: 관리자는 기본적으로 데스크톱 사용 환경이므로 전면 반응형 재설계 대신 "모바일에서 안 깨지는 최소 방어"만 적용. 사용자 화면(`UserLayoutShell.tsx`)의 모바일 그룹 패널이 backdrop+bottom sheet 오버레이로 처리되는 톤을 참고해, 사이드바도 본문 위에 겹치는 오버레이 방식으로 통일.

### 복원 방법
이 ID(HIST-20260724-001)만으로 복원 시 `AdminLayoutShell.tsx`에서:
- `mobileSidebarOpen` state와 관련 `useEffect`, backdrop `<div>` 블록, 헤더 햄버거 `<button>` 블록을 제거
- 사이드바 className을 `"fixed inset-y-0 left-0 z-40 w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-sm"`로 되돌림
- 본문 className의 `ml-0 lg:ml-56`을 `ml-56`으로, 헤더 className의 `px-4 sm:px-6`을 `px-6`으로 되돌림

---

## HIST-20260717-001

- **날짜**: 2026-07-17
- **수정 범위**: 관리자 프론트엔드 / 로그아웃 처리
- **수정 개요**: `handleLogout`이 백엔드 `POST /api/auth/logout`을 실제로 호출하도록 변경. 기존에는 `clearAuth()`(accessToken 제거) 후 라우팅만 수행해, HttpOnly라 JS로 지울 수 없는 refresh 쿠키(`refresh_token_admin`)가 최대 7일 남아 있었다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | `handleLogout`을 `async`로 변경, `authService.logout('admin')` 호출 후 `clearAuth()`+라우팅 |

### 수정 상세

#### `AdminLayoutShell.tsx`
- 변경 전:
  ```ts
  const handleLogout = () => {
    clearAuth();
    router.push('/admin/login');
  };
  ```
- 변경 후:
  ```ts
  const handleLogout = async () => {
    try {
      await authService.logout('admin');
    } catch {}
    clearAuth();
    router.push('/admin/login');
  };
  ```
- 이유: 서버가 refresh 쿠키를 만료시키려면 로그아웃 API를 실제로 호출해야 함(백엔드 신설 엔드포인트는 같은 날짜 `docs/history/back/usr/Auth_Modified.md` HIST-20260717-002 참조). API 실패(네트워크 오류 등)로 관리자가 로그아웃조차 못 하는 상황을 막기 위해 `try/catch`로 감싸고 실패해도 `clearAuth()`+라우팅은 항상 수행

### 검증
- `npx tsc --noEmit` 통과 확인

### 복원 방법
이 ID(HIST-20260717-001)로 복원 시 `handleLogout`을 `clearAuth()` + 라우팅만 수행하는 동기 함수로 되돌린다.

---

## HIST-20260615-001

- **날짜**: 2026-06-15
- **수정 범위**: 관리자 프론트엔드 / 테마 토글
- **수정 개요**: 테마 토글 라벨이 실제 다크모드 상태와 어긋날 수 있던 문제 수정 — 공용 훅 `useIsDarkMode`로 통일.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | `ThemeToggle`의 `useState`+`useEffect([theme])` 방식을 공용 훅 `useIsDarkMode()`로 교체 |

### 수정 상세

#### `AdminLayoutShell.tsx`
- **변경 전**: `const [isDark, setIsDark] = useState(false); useEffect(() => setIsDark(documentElement.classList.contains('dark')), [theme]);` — 실제 클래스를 읽긴 하나 `[theme]` 의존이라 `theme==='system'`에서 OS 설정 변경 시 라벨이 갱신되지 않는 사각지대 존재.
- **변경 후**: `const isDark = useIsDarkMode();` — MutationObserver로 html `dark` 클래스를 직접 관찰해 테마 토글·시스템 설정 변경 모두에 반응. 사용자 측과 로직 단일화.
- 공용 훅 정의 및 근본 원인 상세: 사용자 프론트 `docs/history/front/usr/UserLayout_Modified.md` HIST-20260615-001 참조.
- **검증**: `npx tsc --noEmit` 통과.

### 복원 방법
이 ID(HIST-20260615-001)로 복원 시 `ThemeToggle`을 기존 `useState`+`useEffect([theme])` 방식으로 되돌린다.

---

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
