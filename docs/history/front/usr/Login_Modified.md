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
