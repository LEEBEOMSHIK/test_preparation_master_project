## HIST-20260611-001

- **날짜**: 2026-06-11
- **수정 범위**: 사용자 프론트엔드 / 인증 (로그인·OAuth 콜백)
- **수정 개요**: `useSearchParams()` 사용 컴포넌트를 `<Suspense>` 경계로 래핑하여 Next.js 14 프로덕션 빌드 `missing-suspense-with-csr-bailout` 오류 해결

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/auth/login/page.tsx` | 수정 | `LoginContent` 내부 컴포넌트 분리 + `<Suspense>` 래핑, `LoginFallback` 추가 |
| `frontend/src/app/auth/oauth/callback/page.tsx` | 수정 | `OAuthCallbackContent` 내부 컴포넌트 분리 + `<Suspense>` 래핑, 기존 처리 중 UI를 `OAuthProcessingUI`로 추출하여 fallback 재사용 |
| `frontend/src/app/user/login/page.tsx` | 수정 | `UserLoginContent` 내부 컴포넌트 분리 + `<Suspense>` 래핑, `UserLoginFallback` 스켈레톤 추가 |

### 수정 상세

#### `frontend/src/app/auth/login/page.tsx`
- 변경 전: `export default function LoginPage()` 안에서 직접 `useSearchParams()` 호출
- 변경 후: `useSearchParams()` 로직을 `LoginContent`로 분리, 페이지는 `<Suspense fallback={<LoginFallback />}>` 래퍼만 반환. fallback은 화면 중앙 `<Skeleton>` 블록
- 이유: Next.js 14 빌드 규칙 — `useSearchParams()`는 반드시 `<Suspense>` 경계 내부에서 사용해야 함

#### `frontend/src/app/auth/oauth/callback/page.tsx`
- 변경 전: `export default function OAuthCallbackPage()` 안에서 직접 `useSearchParams()` 호출, 기존 로딩 UI가 JSX로 인라인 존재
- 변경 후: 기존 로딩 UI를 `OAuthProcessingUI` 컴포넌트로 분리, `useSearchParams()` 로직을 `OAuthCallbackContent`로 이동, 페이지는 `<Suspense fallback={<OAuthProcessingUI />}>`로 래핑. fallback과 컨텐츠가 동일한 UI를 표시하여 전환 시 시각적 일관성 유지
- 이유: 콜백 페이지 특성상 실제 내용이 "처리 중" UI이므로 기존 로딩 UI를 fallback으로 그대로 재사용

#### `frontend/src/app/user/login/page.tsx`
- 변경 전: `export default function UserLoginPage()` 안에서 직접 `useSearchParams()` 호출
- 변경 후: `useSearchParams()` 포함 전체 폼 로직을 `UserLoginContent`로 분리, 페이지는 `<Suspense fallback={<UserLoginFallback />}>`로 래핑. fallback은 로그인 폼 레이아웃을 모방한 스켈레톤 (로고·부제·입력필드·버튼 영역)
- 이유: Next.js 14 빌드 규칙, 로그인 폼 화면 특성에 맞는 스켈레톤으로 CLS(레이아웃 이동) 최소화

### 검증 결과
- `npx tsc --noEmit`: 오류 0건
- `npm run build`: 성공 (44/44 정적 페이지 생성, `missing-suspense-with-csr-bailout` 오류 없음)

### 복원 방법
이 ID(HIST-20260611-001)만으로 복원 시 위 "수정 상세"의 "변경 전" 내용을 각 파일에 적용한다. 구체적으로 각 파일에서 내부 컴포넌트 분리를 되돌리고 `export default`에서 직접 `useSearchParams()`를 호출하는 원래 구조로 복원한다.

---

## HIST-20260506-003

- **날짜**: 2026-05-06
- **수정 범위**: 사용자·관리자 프론트엔드 / 인증 (로그인 화면 레이아웃 제거)
- **수정 개요**: `/user/login`, `/admin/login` 경로에서 네비게이션 셸이 표시되던 문제 수정 — 로그인 페이지에서는 레이아웃 없이 폼만 표시

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | `pathname === '/user/login'` 일 때 useEffect 인증 체크 건너뛰고 children만 반환 |
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | `pathname === '/admin/login'` 일 때 useEffect 인증 체크 건너뛰고 children만 반환 |

### 수정 상세

**원인**: `/user/login`과 `/admin/login`이 각각 `app/user/` 및 `app/admin/` 디렉토리 내에 위치하여 해당 디렉토리의 `layout.tsx`(UserLayoutShell/AdminLayoutShell)가 로그인 페이지에도 자동 적용됨.

**해결 방식**: route group으로 디렉토리를 재구조화하는 대신, 각 레이아웃 셸 컴포넌트 내부에서 pathname을 확인하여 로그인 경로일 때는 셸 없이 `children`만 렌더링하도록 조기 반환 추가.

- **변경 전**: 로그인 경로여도 useEffect에서 토큰 확인, 셸 전체 렌더링
- **변경 후**: `pathname === '/user/login'` (또는 `/admin/login`)이면 useEffect 인증 체크 스킵 + `return <>{children}</>` 조기 반환

### 복원 방법

이 ID(HIST-20260506-003)로 복원 시 UserLayoutShell.tsx, AdminLayoutShell.tsx 에서 `if (pathname === '*/login') return;` 조건과 `if (pathname === '*/login') return <>{children}</>` 조기 반환 블록을 제거한다.

---

## HIST-20260506-002

- **날짜**: 2026-05-06
- **수정 범위**: 사용자·관리자 프론트엔드 / 인증 (로그인 경로 분리)
- **수정 개요**: 단일 `/auth/login` 대신 `/user/login`, `/admin/login` 으로 로그인 경로를 역할별로 분리

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/login/page.tsx` | 추가 | 사용자 전용 로그인 페이지 신규 생성 |
| `frontend/src/app/admin/login/page.tsx` | 추가 | 관리자 전용 로그인 페이지 신규 생성 (다크 테마) |
| `frontend/src/app/auth/login/page.tsx` | 수정 | `/user/login` 으로 리다이렉트하는 래퍼로 교체 |
| `frontend/src/app/page.tsx` | 수정 | 루트 페이지 — 로그인 버튼을 사용자/관리자로 분리, 테스트 바로가기도 분리 |
| `frontend/src/components/layout/AdminLayoutShell.tsx` | 수정 | 미인증 리다이렉트·로그아웃 경로를 `/admin/login` 으로 변경 |
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | 미인증 리다이렉트·로그아웃 경로를 `/user/login` 으로 변경 |
| `frontend/src/services/apiClient.ts` | 수정 | 401/403 리다이렉트를 현재 경로 prefix 기준으로 `/admin/login` or `/user/login` 으로 분기 |
| `frontend/src/app/auth/oauth/callback/page.tsx` | 수정 | OAuth 실패 리다이렉트를 `/user/login?error=oauth_failed` 로 변경 |

### 수정 상세

#### `user/login/page.tsx` (신규)
- 사용자 전용 이메일/비밀번호 + Google OAuth 로그인
- ADMIN 계정 로그인 시 "관리자 계정입니다. 관리자 로그인 페이지를 이용해 주세요." 오류 표시
- 성공 시 isFirstLogin → `/onboarding`, 일반 → `/user/exams`

#### `admin/login/page.tsx` (신규)
- 관리자 전용 이메일/비밀번호 로그인 (Google OAuth 없음)
- 다크 테마 (`bg-gray-800/700`) 디자인
- USER 계정 로그인 시 "일반 사용자 계정입니다. 사용자 로그인 페이지를 이용해 주세요." 오류 표시
- 성공 시 `/admin/exams`

#### `auth/login/page.tsx` (변경)
- 변경 전: 풀 로그인 폼
- 변경 후: `useEffect`에서 `router.replace('/user/login')` 으로 즉시 리다이렉트 (하위 호환 유지)

#### `page.tsx` (변경)
- 변경 전: "로그인" 단일 버튼 + "사용자 홈 (User)" / "관리자 홈 (Admin)" 테스트 링크
- 변경 후: "사용자 로그인" (indigo), "관리자 로그인" (gray-800) 버튼 + 테스트 섹션도 각 로그인 페이지로 분리

#### `apiClient.ts` (변경)
- 변경 전: `window.location.href = '/auth/login'`
- 변경 후: `window.location.pathname.startsWith('/admin/')` 여부로 `/admin/login` or `/user/login` 분기

### 복원 방법

이 ID(HIST-20260506-002)로 복원 시:
- `user/login/page.tsx`, `admin/login/page.tsx` 삭제
- `auth/login/page.tsx` 원래 풀 폼으로 복원 (HIST-20260429-001 참고)
- `page.tsx` 단일 "로그인" 버튼 + "사용자 홈"/"관리자 홈" 링크로 복원
- `AdminLayoutShell.tsx`, `UserLayoutShell.tsx` — `/auth/login` 으로 복원
- `apiClient.ts` — `'/auth/login'` 고정값으로 복원
- `oauth/callback/page.tsx` — `/auth/login?error=oauth_failed` 로 복원

---

## HIST-20260429-001

- **날짜**: 2026-04-29
- **수정 범위**: 사용자 프론트엔드 / 인증 (Google OAuth2 로그인)
- **수정 개요**: 로그인 페이지에 Google OAuth2 버튼 추가 및 OAuth 콜백 페이지 신규 구현

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/auth/login/page.tsx` | 수정 | Google 로그인 버튼 추가, OAuth 실패 오류 메시지 처리 |
| `frontend/src/app/auth/oauth/callback/page.tsx` | 추가 | OAuth 콜백 처리 페이지 신규 구현 |

### 수정 상세

#### `frontend/src/app/auth/login/page.tsx`
- **변경 전**: 이메일/비밀번호 폼만 존재
- **변경 후**:
  - `useSearchParams` 추가 → `?error=oauth_failed` 파라미터 감지 시 오류 메시지 표시
  - 구분선("또는") + "Google로 로그인" 버튼 추가
  - 버튼 클릭 시 `window.location.href = '/api/oauth2/authorization/google'` 이동
- **이유**: Google OAuth2 소셜 로그인 진입점 제공

#### `frontend/src/app/auth/oauth/callback/page.tsx`
- **변경 전**: 파일 없음
- **변경 후**: OAuth 콜백 처리 컴포넌트
  - URL `?token` 파라미터에서 Access Token 추출
  - `sessionStorage`에 토큰 임시 저장
  - `authService.me()` 호출로 사용자 정보 조회
  - `useAuthStore.setAuth()` 저장 후 역할 기반 라우팅
  - 실패 시 `/auth/login?error=oauth_failed` 이동
- **이유**: 백엔드 OAuth2 성공 핸들러가 리디렉트하는 콜백 URL 처리

### 복원 방법

이 ID(HIST-20260429-001)로 복원 시:
- `frontend/src/app/auth/login/page.tsx`에서 `useEffect`, `useSearchParams` import 제거 및 Google 버튼 블록 제거
- `frontend/src/app/auth/oauth/callback/page.tsx` 삭제

---

## HIST-20260418-006

- **날짜**: 2026-04-18
- **수정 범위**: 사용자 프론트엔드 / 인증 (로그인, 회원가입)
- **수정 개요**: 로그인·회원가입 페이지 신규 구현 (빈 파일 → 완성 페이지)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/auth/login/page.tsx` | 추가 | 로그인 페이지 구현 |
| `frontend/src/app/auth/signup/page.tsx` | 추가 | 회원가입 페이지 구현 |

### 수정 상세

#### `frontend/src/app/auth/login/page.tsx`
- **변경 전**: 0 bytes
- **변경 후**: 로그인 폼 컴포넌트
  - 이메일 + 비밀번호 입력 필드
  - 제출 시 `authService.login()` 호출 → `useAuthStore.setAuth()` 저장
  - 역할 기반 리다이렉트: ADMIN → `/admin/exams`, USER → `/user/exams`
  - 에러 메시지 인라인 표시
  - 회원가입 페이지 링크

#### `frontend/src/app/auth/signup/page.tsx`
- **변경 전**: 0 bytes
- **변경 후**: 회원가입 폼 컴포넌트
  - 이름 + 이메일 + 비밀번호 + 비밀번호 확인 필드
  - 실시간 비밀번호 불일치 표시 (border-red + 안내 문구)
  - 8자 미만 클라이언트 유효성 검사
  - 성공 시 `/auth/login?registered=1` 이동
  - 로그인 페이지 링크

### 복원 방법

이 ID(HIST-20260418-006)로 복원 시:
- `frontend/src/app/auth/login/page.tsx` 삭제 (또는 빈 파일로)
- `frontend/src/app/auth/signup/page.tsx` 삭제 (또는 빈 파일로)
