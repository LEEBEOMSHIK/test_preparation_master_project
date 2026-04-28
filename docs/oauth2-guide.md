# Google OAuth2 설정 가이드

TPMP 프로젝트의 Google OAuth2 소셜 로그인 설정 방법을 안내합니다.

---

## 아키텍처 개요

```
[브라우저] → /api/oauth2/authorization/google
           → [Spring Security] → [Google 인증 화면]
           ← Google redirects → /api/login/oauth2/code/google
           ← [JWT 발급 + 쿠키 설정]
           ← redirect → /auth/oauth/callback?token=ACCESS_TOKEN
           ← [프론트엔드 콜백 페이지가 토큰 저장 후 라우팅]
```

## Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. **API 및 서비스 → 사용자 인증 정보** 로 이동
4. **OAuth 2.0 클라이언트 ID** 생성 (웹 애플리케이션)
5. **승인된 리디렉션 URI** 추가:

### 로컬 개발
```
http://localhost:8080/api/login/oauth2/code/google
```

### 프로덕션 (Docker/nginx)
```
https://yourdomain.com/api/login/oauth2/code/google
```

6. **클라이언트 ID**와 **클라이언트 보안 비밀번호** 복사

---

## 환경 변수 설정

### 로컬 개발 (`.env` 또는 IDE Run Configuration)

백엔드 실행 시 아래 환경 변수 설정:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_OAUTH2_REDIRECT_URI=http://localhost:8080/api/login/oauth2/code/google
OAUTH2_FRONTEND_REDIRECT_URI=http://localhost:3000/auth/oauth/callback
```

### Docker 환경 (`docker-compose.yml` 또는 `.env`)

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_OAUTH2_REDIRECT_URI=https://yourdomain.com/api/login/oauth2/code/google
OAUTH2_FRONTEND_REDIRECT_URI=https://yourdomain.com/auth/oauth/callback
```

---

## 로그인 흐름 상세

### 1. 인가 요청
- 사용자가 로그인 페이지에서 "Google로 로그인" 클릭
- 브라우저가 `/api/oauth2/authorization/google`로 이동
- Spring Security가 Google 인가 URL로 리디렉트

### 2. 사용자 인증
- Google 계정 선택 화면 표시
- 사용자 동의 (이메일, 프로필 정보 접근)

### 3. 콜백 처리 (`CustomOAuth2UserService`)
- Google이 `redirect_uri`로 인가 코드 전송
- Spring Security가 액세스 토큰 교환 후 사용자 정보 조회
- DB에서 `provider` + `provider_id`로 기존 계정 조회
  - 신규 사용자: 새 `User` 레코드 생성 (GOOGLE provider)
  - 기존 이메일 존재: 기존 계정에 Google provider 연결
  - 기존 Google 계정: 그대로 사용

### 4. JWT 발급 (`OAuth2AuthenticationSuccessHandler`)
- Access Token (15분) 생성 — 권한(permissions) 포함
- Refresh Token (7일) 생성 — HttpOnly 쿠키로 설정
- 프론트엔드 콜백 URL로 리디렉트: `{OAUTH2_FRONTEND_REDIRECT_URI}?token=ACCESS_TOKEN`

### 5. 프론트엔드 처리 (`/auth/oauth/callback`)
- URL에서 `token` 파라미터 추출
- `/api/auth/me` 호출로 사용자 정보 로드
- Zustand store + sessionStorage에 저장
- 역할 기반 라우팅: ADMIN → `/admin/exams`, 첫 로그인 → `/onboarding`, 일반 → `/user/exam-info`

---

## 데이터베이스 변경사항

`users` 테이블에 컬럼 2개 추가:

```sql
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
ALTER TABLE users ADD COLUMN provider VARCHAR(20) DEFAULT 'LOCAL';
ALTER TABLE users ADD COLUMN provider_id VARCHAR(255);
```

> **참고**: `ddl-auto: update` (로컬)에서는 JPA가 자동 처리. 프로덕션에서는 Flyway 마이그레이션 스크립트 작성 필요.

---

## 권한 시스템 연동

OAuth 신규 가입 사용자는 `USER` 역할로 생성되며 별도 권한 없이 시작합니다.  
관리자가 **관리자 → 권한 관리** 메뉴에서 OAuth 계정에 권한을 부여할 수 있습니다.  
다음 로그인(토큰 갱신) 시 부여된 권한이 JWT에 반영됩니다.

---

## 보안 고려사항

- Access Token이 URL query parameter로 전달되므로, 브라우저 히스토리에 남을 수 있음
  - 토큰 유효기간 15분으로 리스크 최소화
  - 콜백 페이지 로드 즉시 sessionStorage 이동 후 URL 클리어 권장 (추후 개선)
- Refresh Token은 HttpOnly 쿠키로 안전하게 관리
- Google OAuth 사용자는 이메일/비밀번호 로그인 불가 (provider 구분)
