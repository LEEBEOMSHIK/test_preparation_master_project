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
