## HIST-20260717-002

- **날짜**: 2026-07-17
- **수정 범위**: 사용자 프론트엔드 / 인증 (Refresh 토큰 계정 검증 — 탭 간 계정 오염 버그 수정)
- **수정 개요**: 같은 브라우저에서 사용자 탭과 관리자 탭을 동시에 로그인해 두면 사용자 탭의 accessToken이 만료된 뒤 refresh 시 admin 계정 토큰을 검증 없이 그대로 저장해버려 사용자 세션이 조용히 admin으로 전환되던 버그를 수정. `authStore`에 `authEmail` 기준값을 추가하고 `apiClient`의 refresh 응답 계정을 검증하도록 변경(백엔드 대응 변경은 `docs/history/back/usr/Auth_Modified.md` HIST-20260717-001 참고)

### 원인
- refresh 토큰 쿠키가 origin 단위로 공유되어 관리자 탭 로그인이 사용자 탭의 쿠키를 덮어씀
- 사용자 탭이 401로 `/auth/refresh`를 호출하면 admin 쿠키가 전송되어 admin의 accessToken을 그대로 받아 `sessionStorage`에 저장 — 화면 표시용 user는 zustand 메모리에 남아 있어 사용자가 계정 전환을 눈치채지 못함(실제 피해: `quiz_history`가 admin 계정에 오염 축적)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/types/index.ts` | 수정 | `RefreshResponse`(`AuthTokens` + `user: User`) 타입 신규 추가 |
| `frontend/src/store/authStore.ts` | 수정 | `setAuth`가 `authEmail`(user.email)을 sessionStorage에 함께 저장, `clearAuth`가 함께 제거 |
| `frontend/src/services/apiClient.ts` | 수정 | `refreshAccessToken()`이 경로 기준 scope(`/admin` 접두 여부)로 `/api/auth/refresh?scope=...` 호출, 응답 `user.email`을 저장된 `authEmail`과 비교해 불일치 시 토큰 미저장 + throw. 401 catch에서 `authEmail`도 함께 제거 |
| `frontend/src/services/authService.ts` | 수정 | `refresh()` 응답 타입을 `ApiResponse<AuthTokens>` → `ApiResponse<RefreshResponse>`로 맞춤(동작 변경 없음, apiClient 인터셉터와 별개 경로) |

### 수정 상세

#### `types/index.ts`
- 변경 전: `AuthTokens { accessToken: string }`만 존재
- 변경 후: `export interface RefreshResponse extends AuthTokens { user: User }` 추가(백엔드 `LoginResponse`와 동일 형태 — refresh 응답에도 user가 포함됨)
- 이유: refresh 응답의 계정 검증을 위해 user.email이 필요, `any` 캐스팅 없이 strict 타입으로 접근하기 위함

#### `store/authStore.ts`
- 변경 전: `setAuth`는 `accessToken`만 sessionStorage에 저장, `clearAuth`는 `accessToken`만 제거
- 변경 후: `setAuth`가 `sessionStorage.setItem('authEmail', user.email)`도 함께 수행, `clearAuth`가 `sessionStorage.removeItem('authEmail')`도 함께 수행
- 이유: refresh 응답이 다른 계정으로 뒤바뀌었는지 비교할 기준값이 필요. 로그인/온보딩 등 `setAuth`를 호출하는 모든 지점에서 자동으로 최신 계정 기준값이 갱신됨

#### `services/apiClient.ts`
- 변경 전: `refreshAccessToken()`이 `/api/auth/refresh`를 scope 없이 호출하고 응답 `accessToken`을 검증 없이 그대로 저장
- 변경 후:
  - `scope = window.location.pathname.startsWith('/admin') ? 'admin' : 'user'` 판정 후 `/api/auth/refresh?scope=${scope}`로 POST
  - 응답 `data.user?.email`을 `sessionStorage.getItem('authEmail')`과 비교 — 저장된 값이 있고 응답 이메일과 다르면 `throw`(토큰 미저장, 기존 401 catch가 로그아웃 처리를 타도록 함)
  - 저장된 `authEmail`이 없으면(검증 기준 부재) 검증을 건너뛰고 응답 이메일을 `authEmail`로 기록한 뒤 진행
  - 401 catch 블록에서 `sessionStorage.removeItem('authEmail')`을 `accessToken` 제거와 함께 수행
- 이유: 사용자 탭이 admin 쿠키로 refresh되어 admin의 accessToken을 받더라도, 응답에 포함된 계정 이메일이 사용자 탭이 알고 있던 계정과 다르면 저장을 거부하여 계정 오염을 원천 차단. `/admin`(끝에 슬래시 없음) 기준으로 판정 — 기존 401 catch의 리다이렉트 판정(`/admin/`)과는 별개 기준이므로 혼동 주의

#### `services/authService.ts`
- 변경 전: `refresh: () => apiClient.post<ApiResponse<AuthTokens>>('/auth/refresh')`
- 변경 후: `refresh: () => apiClient.post<ApiResponse<RefreshResponse>>('/auth/refresh')`
- 이유: `apiClient.ts`의 인터셉터 경로와 타입 정합성만 맞춤. 이 함수는 인터셉터의 `refreshAccessToken()`과 별개 경로(scope 없이 기본값 `user`로 호출됨)이므로 동작은 변경하지 않음

### 검증 결과
- `npx tsc --noEmit`: 오류 0건

### 복원 방법
이 ID(HIST-20260717-002)만으로 복원 시:
1. `types/index.ts`에서 `RefreshResponse` 인터페이스 제거
2. `authStore.ts`의 `setAuth`/`clearAuth`에서 `authEmail` 관련 라인 제거
3. `apiClient.ts`의 `refreshAccessToken()`을 `axios.post('/api/auth/refresh', {}, { withCredentials: true })` + 검증 없이 `accessToken` 저장하는 기존 형태로 되돌리고, 401 catch의 `authEmail` 제거 라인 삭제
4. `authService.ts`의 `refresh()` 반환 타입을 `ApiResponse<AuthTokens>`로 되돌림

---

## HIST-20260717-001

- **날짜**: 2026-07-17
- **수정 범위**: 사용자 프론트엔드 / 로그인 화면 (다크모드 토글)
- **수정 개요**: 사용자 로그인 화면에 다크모드 토글 버튼 추가 및 `dark:` 변형 스타일 적용. 레이아웃 셸에 중복 정의돼 있던 토글을 공용 컴포넌트로 추출.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/components/ui/ThemeToggle.tsx` | 추가 | 공용 다크모드 토글 버튼 (해/달 아이콘, `className` prop으로 스타일 재정의) |
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 | 로컬 `ThemeToggle` 정의 제거 → 공용 컴포넌트 import |
| `frontend/src/app/user/login/page.tsx` | 수정 | 우상단(fixed) 토글 추가 + 배경·카드·입력·에러·구분선·Google 버튼·링크·Suspense 폴백에 `dark:` 변형 추가 |

### 수정 상세
- 로그인 경로는 레이아웃 셸이 children만 반환(HIST-20260506-003)해 헤더 토글이 없었음 → 페이지 자체에 `fixed top-4 right-4` 위치로 `<ThemeToggle />` 배치.
- 테마 상태는 기존 `useThemeStore`(localStorage `tpmp-theme` 영속) + `ThemeProvider` 그대로 사용, 로그인 화면에서 바꾼 테마가 로그인 후 화면에도 유지됨.
- 공용 추출로 `UserLayoutShell`/`AdminLayoutShell`의 중복 토글 정의 제거 (Shared Utilities 규칙). CLAUDE.md 공용 유틸 표에 `<ThemeToggle />` 등재.

### 검증 결과
- `npx tsc --noEmit`: 오류 0건

### 복원 방법
이 ID(HIST-20260717-001)로 복원 시 `ThemeToggle.tsx` 삭제, `UserLayoutShell.tsx`에 로컬 `ThemeToggle` 함수 복원, `user/login/page.tsx`의 토글 블록과 `dark:` 클래스 제거.

---

## HIST-20260615-001

- **날짜**: 2026-06-15
- **수정 범위**: 사용자 프론트엔드 / 로그인 후 진입 화면
- **수정 개요**: 사용자 로그인 후 첫 화면을 시험 목록(`/user/exams`) → **시험 정보(`/user/exam-info`)** 로 변경. 루트 진입 시 리다이렉트도 동일하게 통일.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/user/login/page.tsx` | 수정 | 일반 로그인 성공 시 `router.push('/user/exams')` → `'/user/exam-info'` |
| `frontend/src/app/page.tsx` | 수정 | 로그인 상태로 루트 진입 시 비관리자 리다이렉트 `/user/exams` → `/user/exam-info` |

### 수정 상세
- 첫 로그인(관심 시험 미설정) → 온보딩, 온보딩 완료·OAuth 콜백은 이미 `/user/exam-info`로 가고 있어, 일반 이메일 로그인 경로만 어긋나 있던 것을 통일.
- 관리자 로그인/루트 리다이렉트(`/admin/exams`)는 변경 없음.
- **검증**: 크롬 — 깨끗한 세션으로 사용자 로그인 시 `/user/exam-info`(시험 정보)로 진입 확인.

### 복원 방법
이 ID(HIST-20260615-001)로 복원 시 두 파일의 리다이렉트를 `/user/exams`로 되돌린다.

---

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
