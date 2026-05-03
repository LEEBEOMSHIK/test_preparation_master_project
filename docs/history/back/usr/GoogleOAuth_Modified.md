## HIST-20260429-005

- **날짜**: 2026-04-29
- **수정 범위**: 사용자 백엔드 / OAuth2 배포 설정 버그 수정
- **수정 개요**: Docker 배포 시 Google OAuth2 환경변수 미설정으로 인한 서버 시작 실패 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/resources/application.yml` | 수정 | `${GOOGLE_CLIENT_ID:}` → `${GOOGLE_CLIENT_ID:not_configured}` (빈 문자열 기본값 제거) |
| `backend/src/main/resources/application-docker.yml` | 수정 | OAuth2 플레이스홀더에 `:not_configured` 기본값 추가, `OAUTH2_FRONTEND_REDIRECT_URI` 기본값 추가 |
| `docker-compose.yml` | 수정 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH2_REDIRECT_URI`, `OAUTH2_FRONTEND_REDIRECT_URI` 환경변수 4개 추가 |

### 수정 상세

#### 원인 분석
- `application-docker.yml`의 `${GOOGLE_CLIENT_ID}`, `${GOOGLE_CLIENT_SECRET}`, `${GOOGLE_OAUTH2_REDIRECT_URI}` 에 기본값이 없어, 해당 환경변수가 미설정 시 `Could not resolve placeholder` 에러로 서버 시작 불가
- `docker-compose.yml`에 OAuth2 관련 환경변수 4개가 누락되어 컨테이너에 전달되지 않음
- `application.yml` 기본 섹션의 `${GOOGLE_CLIENT_ID:}` 빈 문자열 기본값은 Spring OAuth2의 `clientId cannot be empty` 검증 오류 유발

#### 수정 내용
- **변경 전** (`application.yml`): `client-id: ${GOOGLE_CLIENT_ID:}` (빈 문자열)
- **변경 후** (`application.yml`): `client-id: ${GOOGLE_CLIENT_ID:not_configured}` (비어있지 않은 기본값)
- **변경 전** (`application-docker.yml`): `client-id: ${GOOGLE_CLIENT_ID}` (기본값 없음)
- **변경 후** (`application-docker.yml`): `client-id: ${GOOGLE_CLIENT_ID:not_configured}` (기본값 추가)
- **변경 전** (`docker-compose.yml`): OAuth2 관련 환경변수 없음
- **변경 후** (`docker-compose.yml`): 4개 환경변수 추가 (미설정 시 `not_configured` 또는 기본 URI 사용)

#### 동작 방식
- Google 자격증명 미설정 시: 서버는 정상 시작, Google 로그인 버튼 클릭 시 Google에서 `invalid_client` 에러 반환 (기능 비활성화 상태)
- Google 자격증명 설정 시: `.env`에 실제 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 등 설정 → 정상 동작

### 복원 방법

이 ID(HIST-20260429-005)로 복원 시:
- `application.yml`: `not_configured` → 빈 문자열(`${GOOGLE_CLIENT_ID:}`)로 복원
- `application-docker.yml`: `:not_configured` 기본값 제거, `frontend-redirect-uri` 기본값 제거
- `docker-compose.yml`: 추가한 4개 환경변수 라인 삭제

---

## HIST-20260429-002

- **날짜**: 2026-04-29
- **수정 범위**: 사용자 백엔드 / Google OAuth2 소셜 로그인
- **수정 개요**: Spring Security OAuth2 Client 기반 Google 소셜 로그인 구현 (신규 사용자 자동 가입, 기존 계정 연동, JWT 발급)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/build.gradle` | 수정 | `spring-boot-starter-oauth2-client` 의존성 추가 |
| `backend/src/main/java/com/tpmp/testprep/entity/User.java` | 수정 | `provider`, `provider_id` 컬럼 추가, `password` nullable 변경, `ofOAuth()` 팩토리 메서드 추가 |
| `backend/src/main/java/com/tpmp/testprep/repository/UserRepository.java` | 수정 | `findByProviderAndProviderId()` 메서드 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/AuthService.java` | 수정 | `login()` 메서드에 null password 방어 처리 추가 |
| `backend/src/main/resources/application.yml` | 수정 | Google OAuth2 클라이언트 설정 및 `app.oauth2.frontend-redirect-uri` 추가 |
| `backend/src/main/resources/application-docker.yml` | 수정 | Docker 환경 OAuth2 환경 변수 추가 |
| `backend/src/main/java/com/tpmp/testprep/config/SecurityConfig.java` | 수정 | `oauth2Login()` 설정 추가, OAuth2 엔드포인트 permitAll 추가 |
| `backend/src/main/java/com/tpmp/testprep/security/oauth2/CustomOAuth2UserService.java` | 추가 | Google 사용자 정보 기반 DB 계정 조회/생성/연동 처리 |
| `backend/src/main/java/com/tpmp/testprep/security/oauth2/OAuth2AuthenticationSuccessHandler.java` | 추가 | OAuth2 인증 성공 시 JWT 발급 및 프론트엔드 리디렉트 처리 |
| `docs/oauth2-guide.md` | 추가 | Google OAuth2 설정 및 연동 가이드 문서 |

### 수정 상세

#### `backend/build.gradle`
- **변경 전**: `spring-boot-starter-security`만 있음
- **변경 후**: `spring-boot-starter-oauth2-client` 추가
- **이유**: Spring Security OAuth2 Client 라이브러리 필요

#### `backend/.../entity/User.java`
- **변경 전**: `password NOT NULL`, provider 관련 필드 없음
- **변경 후**:
  - `password` → nullable (OAuth 사용자는 비밀번호 없음)
  - `provider VARCHAR(20)` 추가 (LOCAL / GOOGLE)
  - `provider_id VARCHAR(255)` 추가 (Google sub 클레임)
  - `ofOAuth(email, name, provider, providerId)` 정적 팩토리 메서드 추가
  - `linkOAuthProvider(provider, providerId)` 메서드 추가
  - 기존 `@Builder` 생성자에 `provider = "LOCAL"` 기본값 설정
- **이유**: 소셜 로그인 사용자와 일반 로그인 사용자 구분 필요

#### `backend/.../repository/UserRepository.java`
- **변경 전**: 이메일 기반 조회만 존재
- **변경 후**: `findByProviderAndProviderId(String, String)` 추가
- **이유**: OAuth 재로그인 시 기존 계정 식별

#### `backend/.../service/AuthService.java`
- **변경 전**: `passwordEncoder.matches()` — password null 시 NPE 가능
- **변경 후**: `user.getPassword() == null` 선행 체크 추가
- **이유**: OAuth 전용 계정이 이메일/비밀번호 로그인 시도 시 안전하게 거부

#### `backend/.../config/SecurityConfig.java`
- **변경 전**: JWT 필터만 존재, STATELESS 세션
- **변경 후**:
  - 세션 정책 `IF_REQUIRED`로 변경 (OAuth2 인가 상태 유지 필요)
  - `/api/oauth2/**`, `/api/login/oauth2/**` permitAll 추가
  - `oauth2Login()` 설정: 커스텀 엔드포인트 `/api/oauth2/authorization`, `/api/login/oauth2/code/*`, `CustomOAuth2UserService`, `OAuth2AuthenticationSuccessHandler` 연결
- **이유**: Spring Security OAuth2 Client 흐름 활성화

#### `backend/.../security/oauth2/CustomOAuth2UserService.java` (신규)
- Google `DefaultOAuth2UserService` 확장
- `provider + providerId` → 기존 계정 조회
- 없으면 이메일로 조회 → 있으면 OAuth provider 연결, 없으면 신규 사용자 생성
- 원본 `OAuth2User` 반환 (성공 핸들러에서 email attribute 사용)

#### `backend/.../security/oauth2/OAuth2AuthenticationSuccessHandler.java` (신규)
- `OAuth2User`에서 email 추출 → DB에서 User 로드
- `JwtTokenProvider`로 Access Token + Refresh Token 생성
- Refresh Token → HttpOnly 쿠키 (`/api/auth`, 7일)
- Access Token → `{OAUTH2_FRONTEND_REDIRECT_URI}?token=ACCESS_TOKEN` 리디렉트

### DB 마이그레이션 (프로덕션 적용 시)

```sql
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'LOCAL';
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);

-- 기존 사용자는 LOCAL provider로 설정
UPDATE users SET provider = 'LOCAL' WHERE provider IS NULL;
```

### 복원 방법

이 ID(HIST-20260429-002)로 복원 시:
1. `build.gradle`에서 `spring-boot-starter-oauth2-client` 제거
2. `User.java`에서 `provider`, `providerId` 필드 제거, `password` NOT NULL 복원, `ofOAuth()`, `linkOAuthProvider()` 제거, Builder에서 `provider = "LOCAL"` 제거
3. `UserRepository.java`에서 `findByProviderAndProviderId()` 제거
4. `AuthService.java`에서 null 체크 원복: `if (!passwordEncoder.matches(...))`
5. `application.yml`에서 OAuth2 관련 설정 제거
6. `application-docker.yml`에서 OAuth2 관련 설정 제거
7. `SecurityConfig.java`에서 oauth2Login 블록 제거, `STATELESS` 세션 복원, `/api/oauth2/**` permitAll 제거, OAuth2 서비스 의존성 제거
8. `security/oauth2/` 패키지 디렉터리 전체 삭제
9. `docs/oauth2-guide.md` 삭제
