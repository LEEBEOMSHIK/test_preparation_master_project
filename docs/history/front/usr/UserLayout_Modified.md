## HIST-20260615-001

- **날짜**: 2026-06-15
- **수정 범위**: 사용자 프론트엔드 / 테마 토글 (공용 훅 추출)
- **수정 개요**: 테마 토글 버튼 라벨이 실제 적용된 다크모드 상태와 어긋나던 버그 수정 — 렌더 시점 `window.matchMedia` 계산을 제거하고, 실제 `dark` 클래스를 단일 진실 소스로 읽는 공용 훅 `useIsDarkMode`로 대체.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/lib/useIsDarkMode.ts` | 신규 | html `dark` 클래스를 MutationObserver로 관찰해 다크 여부 반환하는 공용 훅 |
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | `ThemeToggle`의 render-time matchMedia 계산 제거 → `useIsDarkMode()` 사용 |
| `CLAUDE.md` | 수정 | 공용 유틸 표에 `useIsDarkMode()` 추가 |

### 수정 상세

#### 문제(근본 원인)
- `ThemeProvider`는 `theme`('light'/'dark'/'system')에 따라 html에 `dark` 클래스를 적용한다.
- `ThemeToggle`은 렌더 시점에 `theme==='dark' || (theme==='system' && matchMedia(...).matches)`로 `isDark`를 재계산했는데, (1) SSR에서는 `window`가 없어 항상 false, (2) 하이드레이션 이후 matchMedia 변화·persist 재수화 타이밍에 반응하지 못해, 실제 적용된 `dark` 클래스와 라벨('라이트 모드로 전환'/'다크 모드로 전환')이 어긋났다. (관측: html에 `dark`가 있는데 라벨은 '다크 모드로 전환')

#### `lib/useIsDarkMode.ts` (신규)
- `document.documentElement.classList.contains('dark')`를 초기 마운트 시 읽고, `MutationObserver`로 class 속성 변경을 구독해 상태를 동기화. 초기값 false로 SSR/하이드레이션 불일치 없음. 테마 토글·시스템 설정 변경 모두에 반응.

#### `UserLayoutShell.tsx`
- `ThemeToggle`에서 `theme` 의존 isDark 계산식 제거, `const isDark = useIsDarkMode();`로 교체. `useThemeStore`는 `toggleTheme`만 사용.

- **검증**: `npx tsc --noEmit` 통과. 크롬 — 전환 전 `dark`+'라이트 모드로 전환', 토글 클릭 후 클래스 제거+'다크 모드로 전환'으로 라벨이 실제 상태와 일치함을 확인.

### 복원 방법
이 ID(HIST-20260615-001)로 복원 시 `ThemeToggle`의 isDark를 기존 render-time matchMedia 계산식으로 되돌리고, `useIsDarkMode.ts`를 제거한다. (관리자 측 동일 수정: 관리자 프론트 AdminLayout_Modified.md HIST-20260615-001)

---

## HIST-20260614-002

- **날짜**: 2026-06-14
- **수정 범위**: 사용자 프론트엔드 / 네비게이션 레이아웃
- **수정 개요**: 데스크톱 nav가 화면에 보이지 않던 버그 수정 — `overflow-x-auto`로 인해 overflow-y가 auto로 계산되어 nav가 수직 스크롤 컨테이너가 되고 아이템이 화면 위로 밀려나던 문제. 그룹화로 항목이 4개가 되어 가로 스크롤이 불필요하므로 overflow 관련 유틸 제거.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | 데스크톱 nav className에서 `min-w-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden` 제거 → `hidden sm:flex items-center gap-0.5` |

### 수정 상세

#### `frontend/src/components/layout/UserLayoutShell.tsx`
- **문제**: HIST-20260614-001에서 메뉴를 그룹(드롭다운)화하면서도 기존 10개 flat 메뉴용 `overflow-x-auto`를 그대로 둠. CSS 명세상 overflow-x가 visible이 아니면 overflow-y가 `auto`로 계산되어 nav가 수직 스크롤 컨테이너가 됨. 드롭다운 그룹 구조와 결합되며 nav 자식(메뉴 항목)이 y=-69px로 밀려 화면 밖으로 사라지고, 헤더 중앙이 비어 보였음. (overflow가 드롭다운 메뉴 자체도 클리핑하는 부작용도 있음)
- **변경 전**: `className="hidden sm:flex items-center gap-0.5 min-w-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"`
- **변경 후**: `className="hidden sm:flex items-center gap-0.5"`
- **이유**: 그룹화로 최상위 항목이 4개로 줄어 가로 스크롤이 불필요하고, overflow를 제거해야 드롭다운이 nav 아래로 정상 표출됨.
- **검증**: 크롬 스크린샷 — nav(시험·학습·내 기록·도움말) 정상 표시 + `내 기록` hover 시 드롭다운 시각적 표출 확인. (이전 검증은 a11y 스냅샷에만 의존해 DOM 존재만 보고 실제 페인트를 놓쳤던 케이스 → 스크린샷으로 재확인)

### 복원 방법
이 ID(HIST-20260614-002)로 복원 시 nav className에 `min-w-0 overflow-x-auto ...` 유틸을 다시 추가한다(단, 그 경우 nav 미표시 버그 재발).

---

## HIST-20260614-001

- **날짜**: 2026-06-14
- **수정 범위**: 사용자 프론트엔드 / 네비게이션 레이아웃
- **수정 개요**: 사용자 메뉴 10개를 그룹 구조로 재편 — `시험`(단독) + `학습`/`내 기록`/`도움말` 3개 드롭다운 그룹으로 묶어 최상위 항목을 10개 → 4개로 축소. 데스크톱 hover 드롭다운, 모바일 하단탭 그룹 패널 렌더링 추가.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | 그룹 아이콘(learn/records/help) 추가, FALLBACK nav 그룹 트리화, 제목/활성 판정 재귀화, 데스크톱 드롭다운 + 모바일 그룹 패널 렌더링 |

### 수정 상세

#### `frontend/src/components/layout/UserLayoutShell.tsx`
- **그룹 구성**: `시험`(최상위) / `학습`(데일리 퀴즈·연습장·개념노트) / `내 기록`(통계 대시보드·시험 이력·즐겨찾기) / `도움말`(시험 정보·FAQ·1:1 문의)
- **데이터 소스**: 기존과 동일하게 `menuService.getMyMenus('USER')`(API) 우선, 실패 시 `USER_FALLBACK_NAV`. FALLBACK을 `leaf()`/`group()` 헬퍼로 그룹 트리 구조로 재작성(백엔드 트리와 동일 형태).
- **ICON_MAP**: `learn`/`records`/`help` 아이콘 3종 추가.
- **`getUserPageTitle`**: children → 자기 자신 순으로 재귀 탐색하도록 변경(그룹 합성 URL `/user/group/*`은 제외). 그룹 하위 페이지(`/user/quiz` 등)의 문서 제목이 정상 해석되도록 함.
- **`isItemActive`**: 그룹은 자식 중 현재 경로 일치 시 활성, 리프는 자신 url 기준으로 활성 판정.
- **데스크톱 nav**: children 보유 항목은 hover 드롭다운(`group/nav` + `group-hover/nav`)으로, 리프는 기존 링크로 렌더.
- **모바일 하단탭**: 최상위 4개 표시 — 리프(`시험`)는 링크, 그룹은 버튼 탭 시 하단탭 위로 자식 목록 패널(오버레이) 토글. 경로 이동 시 패널 자동 닫힘(`mobileGroupId` state + pathname effect).
- **이유**: 메뉴 증가로 한 줄 네비게이션이 과밀해지고 모바일 하단탭이 10개로 분할되어 가독성 저하. 성격별 3그룹으로 묶어 최상위를 4개로 축소.
- **검증**: `npx tsc --noEmit` 통과. 크롬 E2E — 데스크톱 4개 최상위 + hover 드롭다운 + 자식 이동(데일리 퀴즈→`/user/quiz`) + 제목 재귀 해석 확인.

### 복원 방법
이 ID(HIST-20260614-001)로 복원 시 `USER_FALLBACK_NAV`를 flat 10개 구조로 되돌리고, `getUserPageTitle`을 단일 루프로, nav 렌더링을 flat `navItems.map` 링크로 환원한다. ICON_MAP의 learn/records/help, `isItemActive`, `mobileGroupId` state 및 모바일 그룹 패널을 제거한다.

---

## HIST-20260612-002

- **날짜**: 2026-06-12
- **수정 범위**: 사용자 프론트엔드 / 네비게이션 레이아웃
- **수정 개요**: 데스크톱 nav 가로 스크롤 제거 — 헤더를 전체 폭으로 확장하고 중간 폭에서 사용자 이름을 숨겨 메뉴 9개가 한 줄에 들어가도록 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | 헤더 컨테이너 max-w-5xl → 전체 폭, 사용자 이름 hidden sm:block → lg:block, 스크롤바 숨김 유틸 정상화 |

### 수정 상세

#### `frontend/src/components/layout/UserLayoutShell.tsx`
- 변경 전: 헤더 내부가 `max-w-5xl mx-auto`(1024px)로 제한되어 메뉴 9개가 넘쳐 가로 스크롤 발생. nav에 정의되지 않은 `scrollbar-none` 클래스 사용으로 스크롤바가 노출됨.
- 변경 후:
  - 헤더 컨테이너 `max-w-5xl mx-auto` → `w-full ... lg:px-8`(전체 폭)로 변경해 nav 공간 최대 확보 (본문 영역은 max-w-5xl 유지)
  - 사용자 이름 `hidden sm:block` → `hidden lg:block`으로 중간 폭에서 숨겨 공간 확보
  - 스크롤바 숨김을 `[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden` 임의 유틸로 정상화(넘침 시에도 스크롤바 비노출)
- 이유: 직전 수정(HIST-001)에서 추가된 가로 스크롤이 노출되는 문제 해결. 공간을 넓혀 한 줄에 모두 표시되도록 함.

### 복원 방법
이 ID(HIST-20260612-002)로 복원 시 헤더 컨테이너를 `max-w-5xl mx-auto`로, 사용자 이름을 `hidden sm:block`으로 되돌린다.

---

## HIST-20260612-001

- **날짜**: 2026-06-12
- **수정 범위**: 사용자 프론트엔드 / 네비게이션 레이아웃
- **수정 개요**: 데스크톱 nav 메뉴 9개 과밀 시 라벨 줄바꿈 방지 및 가로 스크롤 처리

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | 데스크톱 nav 줄바꿈 방지 및 가로 스크롤 적용 |

### 수정 상세

#### `frontend/src/components/layout/UserLayoutShell.tsx`
- 변경 전:
  - `<nav className="hidden sm:flex items-center gap-1">`
  - Link: `flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors`
- 변경 후:
  - `<nav className="hidden sm:flex items-center gap-0.5 overflow-x-auto scrollbar-none min-w-0">`
  - Link: `flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap shrink-0`
- 이유: 메뉴가 9개로 늘어 헤더 폭(max-w-5xl) 초과 시 라벨이 세로 줄바꿈되는 현상 수정. `whitespace-nowrap`으로 라벨 줄바꿈 차단, `shrink-0`으로 아이템 축소 방지, `overflow-x-auto`로 초과 시 가로 스크롤 허용. `px-4→px-3`, `gap-1→gap-0.5`, `text-sm→text-xs`로 여백/폰트 소폭 축소하여 한 줄 수용력 향상.

### 복원 방법
이 ID(HIST-20260612-001)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 `UserLayoutShell.tsx` nav 블록에 적용한다.

---

## HIST-20260510-005

- **날짜**: 2026-05-10
- **수정 범위**: 사용자 프론트엔드 / 레이아웃
- **수정 개요**: 세부 권한 없는 사용자 — 접근 불가 페이지 진입 시 권한 없음 팝업 + 1:1 문의 페이지로 자동 이동

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | 메뉴 API 결과만 사용(FALLBACK 보충 제거), 현재 페이지 접근 불가 시 팝업+리다이렉트 |

### 수정 상세

#### `UserLayoutShell.tsx` — `menuService.getMyMenus()` then 블록
- **변경 전**:
  ```ts
  const coveredUrls = new Set<string>(apiMenus.map((m) => m.url));
  const missing = USER_FALLBACK_NAV.filter((m) => !coveredUrls.has(m.url));
  setNavItems(missing.length > 0 ? [...apiMenus, ...missing] : apiMenus);
  ```
- **변경 후**:
  ```ts
  setNavItems(apiMenus); // API 결과만 사용, FALLBACK 보충 없음
  const accessibleUrls = apiMenus.flatMap((m) => [m.url, ...(m.children ?? []).map(c => c.url)]);
  const isAccessible = accessibleUrls.some((url) => pathname.startsWith(url));
  if (!isAccessible && !pathname.startsWith('/user/inquiries')) {
    window.dispatchEvent(new CustomEvent('permission-denied'));
    router.replace('/user/inquiries');
  }
  ```
- **이유**:
  - FALLBACK 보충 로직이 API 반환 메뉴가 부분적일 때(권한 제한 시) 나머지 FALLBACK 메뉴를 모두 추가해 권한 제한을 무력화하던 버그 수정
  - 권한 없는 사용자가 1:1 문의 이외의 페이지 진입 시 팝업 + 자동 이동

### 복원 방법

HIST-20260510-005 복원 시:
```ts
// 기존 FALLBACK 보충 로직으로 복원
const coveredUrls = new Set<string>(apiMenus.map((m) => m.url));
const missing = USER_FALLBACK_NAV.filter((m) => !coveredUrls.has(m.url));
setNavItems(missing.length > 0 ? [...apiMenus, ...missing] : apiMenus);
```
- 접근 불가 체크 블록 제거

---

## HIST-20260510-002

- **날짜**: 2026-05-10
- **수정 범위**: 관리자/사용자 프론트엔드 / 레이아웃 + API 클라이언트
- **수정 개요**: 세부 권한 없음(403) 시 로그인 리다이렉트 → 팝업 표시로 변경 (토큰 유지)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/apiClient.ts` | 수정 | 403 처리: 토큰 삭제·리다이렉트 → `permission-denied` 커스텀 이벤트 발행 |
| `frontend/src/components/ui/PermissionDeniedModal.tsx` | 추가 | 권한 없음 팝업 컴포넌트 신규 생성 |
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | `PermissionDeniedModal` import 및 JSX에 렌더링 추가 |

### 수정 상세

#### `components/ui/PermissionDeniedModal.tsx` (신규)
- `window.addEventListener('permission-denied', ...)` 로 전역 이벤트 수신
- "접근 권한 없음 / 관리자에게 권한을 요청하세요." 문구 + 확인 버튼
- 배경 클릭 또는 확인 버튼으로 닫기, 다크 모드 지원

#### `UserLayoutShell.tsx`
- **변경 전**: `<PermissionDeniedModal />` 없음
- **변경 후**: 최상위 `<div>` 내부 최초 위치에 `<PermissionDeniedModal />` 추가

### 복원 방법

HIST-20260510-002 복원 시:
- `UserLayoutShell.tsx`에서 import 및 `<PermissionDeniedModal />` 제거
- (공통 파일 복원은 관리자 프론트엔드 히스토리 HIST-20260510-002 참조)

---

## HIST-20260505-018

- **날짜**: 2026-05-05
- **수정 범위**: 사용자 프론트엔드 / 레이아웃
- **수정 개요**: 페이지 새로고침 후 user 상태 미복원 버그 수정 — `UserLayoutShell` 마운트 시 `authService.me()` 호출로 `interestedExamSlaveIds` 포함 최신 사용자 정보 복원

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | `authService` import 추가; useEffect에 `authService.me()` 호출 추가 |

### 수정 상세

#### `UserLayoutShell.tsx`
- **근본 원인**: Zustand store는 in-memory 상태이므로 페이지 새로고침 시 `user`가 `null`로 초기화됨. 기존 코드는 `sessionStorage`에서 토큰 존재 여부만 확인하고 `authService.me()`를 호출하지 않아 `user.interestedExamSlaveIds`가 `undefined`인 채로 유지. 결과: 관심 설정 모달이 선택된 항목 없이 열림.
- 변경 전: 토큰 존재 시 메뉴만 조회, user 상태 복원 없음
- 변경 후:
  ```javascript
  authService.me()
    .then(res => { if (res.data.data) setAuth(res.data.data, token); })
    .catch(() => { clearAuth(); router.replace('/auth/login'); });
  ```
  마운트 시 최신 사용자 정보(관심 시험 ID 포함)를 가져와 store에 반영

### 복원 방법

HIST-20260505-018 복원 시: `authService` import 제거, useEffect에서 `authService.me()` 블록 제거, `setAuth` destructuring 제거.

---

## HIST-20260502-009

- **날짜**: 2026-05-02
- **수정 범위**: 사용자 프론트엔드 / 레이아웃
- **수정 개요**: UserLayoutShell 전면 재작성 — 하드코딩 NAV_ITEMS 제거, DB 기반 권한 메뉴 조회(`GET /menus/mine?menuType=USER`) 적용, USER_FALLBACK_NAV 폴백 유지

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | NAV_ITEMS 상수 제거 → DB 조회 + FALLBACK 병합 방식으로 전환 |
| `frontend/src/services/menuService.ts` | 수정 | `getMyMenus(menuType)` 메서드 추가 (`GET /menus/mine`) |

### 수정 상세

#### `services/menuService.ts`
- **변경 전**: `adminGetAll`, `adminGetFlat`, `getMenuTree`, `create`, `update`, `delete` 만 존재
- **변경 후**: `getMyMenus(menuType)` 추가 — `GET /api/menus/mine?menuType=USER|ADMIN`

#### `components/layout/UserLayoutShell.tsx`
- **변경 전**:
  - `NAV_ITEMS` 하드코딩 상수 (label/href/icon SVG 직접 포함)
  - DB 조회 없음, 권한 필터링 없음
  - 인증 토큰 확인 없음
- **변경 후**:
  - `NAV_ITEMS` 상수 삭제
  - `ICON_MAP` 추가 (examinfo/exam/concept/quiz/faq/inquiry 키별 SVG)
  - `USER_FALLBACK_NAV: MenuConfig[]` 추가 (id: 101~106, url /user/*)
  - `navItems: MenuConfig[]` state (초기값 = USER_FALLBACK_NAV)
  - `useEffect` 추가: 토큰 없으면 `/auth/login` redirect, 있으면 `menuService.getMyMenus('USER')` 호출
  - DB 응답 성공 시 → DB 메뉴 + (FALLBACK에만 있는 항목 보완) 병합
  - DB 응답 실패/빈 배열 시 → USER_FALLBACK_NAV 유지
  - 렌더링: `item.label` → `item.name`, `item.href` → `item.url`, `item.icon` → `ICON_MAP[item.iconKey]`

### 복원 방법

HIST-20260502-009 복원 시:
- `UserLayoutShell.tsx`를 하드코딩 NAV_ITEMS 방식으로 되돌린다 (HIST-20260427-002 버전 참고)
- `menuService.ts`에서 `getMyMenus` 메서드 제거

---

## HIST-20260427-002

- **날짜**: 2026-04-27
- **수정 범위**: 사용자 프론트엔드 / 다크 모드 — 레이아웃·인증·온보딩
- **수정 개요**: UserLayoutShell에 ThemeToggle 추가 및 dark: variant 전면 적용, 인증/온보딩 페이지 그라디언트 배경 다크 모드 대응

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | `ThemeToggle` 추가, 헤더·내비·드롭다운·바텀탭 `dark:` variant 적용 |
| `frontend/src/app/auth/login/page.tsx` | 수정 | 그라디언트 배경에 `dark:from-gray-950 dark:to-gray-900` 추가 |
| `frontend/src/app/auth/signup/page.tsx` | 수정 | 그라디언트 배경에 `dark:from-gray-950 dark:to-gray-900` 추가 |
| `frontend/src/app/onboarding/page.tsx` | 수정 | 그라디언트 배경 및 시험 유형 버튼 카드 `dark:` variant 추가 |

### 수정 상세

#### `frontend/src/components/layout/UserLayoutShell.tsx`
- 변경 전: `useThemeStore` import 없음, 라이트 전용 클래스
- 변경 후:
  - `ThemeToggle` 함수 컴포넌트 추가 (sun/moon SVG, `toggleTheme()`)
  - 헤더: `dark:bg-gray-900 dark:border-gray-700`
  - 내비 활성: `dark:bg-indigo-900/40 dark:text-indigo-300`
  - 내비 비활성: `dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800`
  - 드롭다운: `dark:bg-gray-800 dark:border-gray-700`
  - 바텀탭: `dark:bg-gray-900 dark:border-gray-700`
  - 루트 래퍼: `dark:bg-gray-950`

#### `frontend/src/app/auth/login/page.tsx`
- 변경 전: `bg-gradient-to-br from-indigo-50 to-white`
- 변경 후: `bg-gradient-to-br from-indigo-50 to-white dark:from-gray-950 dark:to-gray-900`

#### `frontend/src/app/auth/signup/page.tsx`
- 변경 전: `bg-gradient-to-br from-indigo-50 to-white`
- 변경 후: `bg-gradient-to-br from-indigo-50 to-white dark:from-gray-950 dark:to-gray-900`

#### `frontend/src/app/onboarding/page.tsx`
- 변경 전: `bg-gradient-to-br from-indigo-50 via-white to-purple-50`, 시험 유형 버튼 라이트 전용
- 변경 후:
  - 배경: `dark:from-gray-950 dark:via-gray-900 dark:to-gray-950` 추가
  - 선택된 버튼: `dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-400`
  - 미선택 버튼: `dark:border-gray-700 dark:hover:border-gray-600 dark:text-gray-300`

### 복원 방법

이 ID(HIST-20260427-002)로 복원 시:
- `UserLayoutShell.tsx`에서 `useThemeStore` import, `ThemeToggle` 컴포넌트, 모든 `dark:` variant 제거
- `login/page.tsx`: `dark:from-gray-950 dark:to-gray-900` 제거
- `signup/page.tsx`: 동일
- `onboarding/page.tsx`: 배경 dark: variant 및 버튼 dark: variant 제거

---

## HIST-20260422-004

- **날짜**: 2026-04-22
- **수정 범위**: 사용자 프론트엔드 / 인증·레이아웃
- **수정 개요**: 세션 종료(로그아웃) 시 `tpmp_quote_hidden_until` localStorage 키 자동 삭제

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/store/authStore.ts` | 수정 | `clearAuth()` 내부에 `localStorage.removeItem('tpmp_quote_hidden_until')` 추가 |

### 수정 상세

#### `frontend/src/store/authStore.ts`
- 변경 전: `clearAuth()`는 `sessionStorage.removeItem('accessToken')`만 처리
- 변경 후: `localStorage.removeItem('tpmp_quote_hidden_until')` 추가
- 이유: 로그아웃(세션 종료) 후 재로그인 시 "하루 동안 보지 않기" 설정이 남아 명언 팝업이 표시되지 않던 문제 수정 — 세션과 함께 초기화되어야 함

### 복원 방법

HIST-20260422-004 복원 시:
- `authStore.ts` `clearAuth()`에서 `localStorage.removeItem('tpmp_quote_hidden_until')` 줄 삭제

---

## HIST-20260418-007

- **날짜**: 2026-04-18
- **수정 범위**: 사용자/관리자 프론트엔드 공통 / 루트 홈 페이지
- **수정 개요**: 루트 페이지(`/`)에 인증 상태 감지 자동 리다이렉트 및 테스트용 홈 바로가기 버튼 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/page.tsx` | 수정 | 클라이언트 컴포넌트로 전환, 로그인 상태 시 홈 자동 이동, 테스트 바로가기 추가 |

### 수정 상세

#### `frontend/src/app/page.tsx`
- **변경 전**: 서버 컴포넌트 — 로그인/회원가입 링크만 존재
- **변경 후**: `'use client'` 클라이언트 컴포넌트
  - `useAuthStore`로 인증 상태 감지 → 이미 로그인된 경우 `role`에 따라 `/admin/exams` 또는 `/user/exams`로 자동 리다이렉트
  - 하단에 테스트용 바로가기 박스 추가: 사용자 홈(`/user/exams`), 관리자 홈(`/admin/exams`) 버튼
- **이유**: 로그인 후 루트 재방문 시 홈으로 이동하고, 개발 중 인증 없이 레이아웃 확인 가능하도록

### 복원 방법

이 ID(HIST-20260418-007)로 복원 시:
- `frontend/src/app/page.tsx`를 서버 컴포넌트(최상단 `'use client'` 제거, `useEffect`/`useAuthStore` 제거, 테스트 박스 제거)로 되돌린다.

---

## HIST-20260418-005

- **날짜**: 2026-04-18
- **수정 범위**: 사용자/관리자 프론트엔드 공통 / Tailwind CSS 빌드
- **수정 개요**: `postcss.config.js` 누락으로 Tailwind CSS가 처리되지 않아 화면이 빈 상태로 보이던 문제 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/postcss.config.js` | 추가 | PostCSS 설정 파일 신규 생성 (tailwindcss + autoprefixer) |

### 수정 상세

#### `frontend/postcss.config.js`
- **변경 전**: 파일 없음 → `@tailwind` 디렉티브가 브라우저에 그대로 노출, CSS 클래스 전혀 생성 안 됨 (CSS 파일 크기: 1,262 bytes)
- **변경 후**: 신규 생성
  ```js
  module.exports = {
    plugins: { tailwindcss: {}, autoprefixer: {} },
  };
  ```
  → Tailwind 유틸리티 클래스 정상 컴파일 (CSS 파일 크기: 20,234 bytes)
- **이유**: Next.js는 `postcss.config.js`가 있어야 `globals.css`의 `@tailwind` 지시자를 처리함

### 확인 결과

- CSS 파일 크기: 1,262 bytes → **20,234 bytes** (Tailwind 클래스 포함 확인)
- 컴파일된 클래스: `min-height`, `flex`, `font-family`, `background-color`, `indigo`, `rounded` 등 정상 생성
- `http://localhost:3000` 루트 페이지 화면 표시 정상

### 복원 방법

이 ID(HIST-20260418-005)로 복원 시:
- `frontend/postcss.config.js` 삭제 (단, 화면이 깨짐)

---

## HIST-20260418-003

- **날짜**: 2026-04-18
- **수정 범위**: 사용자 프론트엔드 / 전체 페이지 레이아웃 적용
- **수정 개요**: 빈 page.tsx 파일에 default export 추가하여 UserLayout이 모든 사용자 페이지에 즉시 적용되도록 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/exams/page.tsx` | 수정 | 빈 파일 → placeholder 페이지 컴포넌트 추가 |
| `frontend/src/app/user/concepts/page.tsx` | 수정 | 빈 파일 → placeholder 페이지 컴포넌트 추가 |
| `frontend/src/app/user/inquiries/page.tsx` | 수정 | 빈 파일 → placeholder 페이지 컴포넌트 추가 |

### 수정 상세

#### 각 page.tsx 공통 패턴
- **변경 전**: 0 bytes (빈 파일, default export 없어 Next.js 빌드 오류 발생)
- **변경 후**: 제목 + 설명 + "준비 중입니다." dashed 박스 placeholder 컴포넌트
- **이유**: Next.js App Router는 layout.tsx가 있어도 page.tsx에 default export가 없으면 라우트 오류 발생

### 복원 방법

이 ID(HIST-20260418-003)로 복원 시:
각 page.tsx를 빈 파일(0 bytes)로 되돌린다.

---

## HIST-20260418-001

- **날짜**: 2026-04-18
- **수정 범위**: 사용자 프론트엔드 / 레이아웃
- **수정 개요**: 사용자 전용 레이아웃(UserLayoutShell) 신규 생성 및 Next.js App Router 라우트 레이아웃 적용

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/UserLayoutShell.tsx` | 추가 | 사용자 레이아웃 Shell 컴포넌트 신규 생성 |
| `frontend/src/app/user/layout.tsx` | 추가 | Next.js App Router 사용자 라우트 레이아웃 신규 생성 |

### 복원 방법

이 ID(HIST-20260418-001)로 복원 시:
- `frontend/src/components/layout/UserLayoutShell.tsx` 삭제
- `frontend/src/app/user/layout.tsx` 삭제
