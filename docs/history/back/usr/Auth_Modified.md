## HIST-20260724-001

- **날짜**: 2026-07-24
- **수정 범위**: 사용자 백엔드 / 인증 (로그인 rate limiting 신설)
- **수정 개요**: `POST /api/auth/login`에 IP 기준 고정 윈도우(5분/5회) rate limiting 추가 — 배포 전 보안 점검(`docs/deployment-guide.md` §4-3 ⑦)에서 지적된 "로그인 rate limiting 없음 — 무차별 대입 방어 없음" 항목 조치. 단일 VM docker-compose(수평 확장 없음) 배포 구조라 Redis 등 외부 저장소 없이 순수 인메모리 `ConcurrentHashMap`으로 구현.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java` | 수정 | `TOO_MANY_LOGIN_ATTEMPTS(429)` 추가 |
| `backend/src/main/java/com/tpmp/testprep/security/LoginRateLimiter.java` | 추가 | IP 기준 고정 윈도우 rate limiter (`checkAllowed`/`recordFailure`/`recordSuccess` + 1시간 주기 정리 스케줄러) |
| `backend/src/main/java/com/tpmp/testprep/TestprepApplication.java` | 수정 | `@EnableScheduling` 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/AuthService.java` | 수정 | `login()`에서 IP resolve를 최상단으로 이동, `checkAllowed`/`recordFailure`/`recordSuccess` 연동 |
| `backend/src/test/java/com/tpmp/testprep/security/LoginRateLimiterTest.java` | 추가 | `LoginRateLimiter` 단위 테스트 4건 |

### 수정 상세

#### `exception/ErrorCode.java`
- 변경 전: `// Auth` 섹션에 `TOO_MANY_LOGIN_ATTEMPTS` 없음
- 변경 후: `TOO_MANY_LOGIN_ATTEMPTS(HttpStatus.TOO_MANY_REQUESTS, "로그인 시도가 너무 많습니다. 5분 후 다시 시도해주세요.")` 추가
- 이유: rate limit 초과 시 429로 응답하기 위한 전용 에러 코드 필요

#### `security/LoginRateLimiter.java` (신규)
- 내용: `@Component`. IP별 `{count, windowStart}` 엔트리를 `ConcurrentHashMap<String, Entry>`로 관리. `checkAllowed(ip)`는 윈도우(5분) 내 실패 카운트가 5 이상이면 `BusinessException(TOO_MANY_LOGIN_ATTEMPTS)`를 던지고, 윈도우가 지났으면 조회 시점에 통과(레이지 리셋, 별도 스케줄러로 즉시 초기화하지 않음). `recordFailure(ip)`는 윈도우 만료 시 1부터 재시작, 아니면 증가. `recordSuccess(ip)`는 엔트리 제거. 엔트리 단위 `synchronized` 블록으로 스레드 안전성 확보. `@Scheduled(fixedRate = 1시간)` `cleanupStaleEntries()`가 windowStart 1시간 경과 엔트리를 제거해 메모리 누수 방지. 테스트 전용 package-private `forceWindowStart(ip, Instant)`로 윈도우 만료를 강제 재현 가능.
- 이유: 키를 이메일이 아닌 IP로 한정해, 공격자가 타인 이메일로 의도적으로 실패시켜 정상 사용자를 잠그는 DoS를 방지

#### `TestprepApplication.java`
- 변경 전: `@SpringBootApplication`만 존재
- 변경 후: `@EnableScheduling` 추가
- 이유: `LoginRateLimiter`의 정리 스케줄러(`@Scheduled`)를 동작시키기 위해 필요(프로젝트 전체에서 최초로 스케줄링 활성화)

#### `service/AuthService.java`
- 변경 전: `login()`에서 이메일 조회·비밀번호 검증을 먼저 수행하고, `ip` 변수는 토큰 발급 이후(74번째 줄)에 선언
- 변경 후: 메서드 최상단에서 `ip`를 resolve하고 `loginRateLimiter.checkAllowed(ip)` 호출 후 자격증명 검사 진행. 사용자 없음/비밀번호 불일치 두 `INVALID_CREDENTIALS` throw 지점 모두 직전에 `recordFailure(ip)` 호출. 토큰 발급·쿠키 세팅 이후 성공 확정 시점에 `recordSuccess(ip)` 호출. 기존 하단의 중복 `ip` 재선언 제거(위에서 선언한 변수 재사용)
- 이유: rate limit 체크가 자격증명 검사보다 먼저 실행되어야 차단 시 불필요한 DB 조회·비밀번호 해시 비교를 건너뛸 수 있음

#### `security/LoginRateLimiterTest.java` (신규)
- 내용: 5회 미만 실패는 계속 허용, 5회 실패 후 6번째 호출은 차단(`TOO_MANY_LOGIN_ATTEMPTS`), `recordSuccess` 후 카운터 리셋, 윈도우 만료(`forceWindowStart`로 시간 강제 이동) 후 카운터 리셋 4개 케이스 검증

### 검증
- `./gradlew compileJava compileTestJava` 통과
- `./gradlew test --tests "*LoginRateLimiter*"` 통과 (4건)
- `./gradlew test`(전체) 통과, 회귀 없음

### 복원 방법
이 ID(HIST-20260724-001)로 복원 시 `AuthService.login()`의 rate limiter 연동 코드(`checkAllowed`/`recordFailure`/`recordSuccess` 호출, `ip` 변수 위치 이동)를 되돌리고, `TestprepApplication.java`에서 `@EnableScheduling`을 제거하고, `ErrorCode.TOO_MANY_LOGIN_ATTEMPTS`를 삭제하고, `security/LoginRateLimiter.java`와 `security/LoginRateLimiterTest.java`를 삭제한다.

---

## HIST-20260717-002

- **날짜**: 2026-07-17
- **수정 범위**: 사용자 백엔드 / 인증 (로그아웃 엔드포인트 신설)
- **수정 개요**: `POST /api/auth/logout` 신설 — HttpOnly라 프론트에서 지울 수 없는 refresh 쿠키를 서버가 role별로 즉시 만료시킨다. 이전까지 프론트 `authService.logout()`은 정의만 되어 있고 아무도 호출하지 않는 죽은 코드였고, 로그아웃 시 `clearAuth()`로 accessToken만 지워질 뿐 refresh 쿠키(`refresh_token_user`/`refresh_token_admin`, path `/api/auth`)는 최대 7일 남아 있었다.

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/security/jwt/JwtAuthenticationFilter.java` | 수정 | `isTokenOptionalEndpoint`에 `/api/auth/logout` 추가 |
| `backend/src/main/java/com/tpmp/testprep/security/jwt/RefreshTokenCookieProvider.java` | 수정 | `createExpiredCookie(User.Role)` 추가, `createLegacyExpiredCookie()`와 공통 로직을 private `expiredCookie(String)`로 추출 |
| `backend/src/main/java/com/tpmp/testprep/service/AuthService.java` | 수정 | `logout(String scope, HttpServletResponse response)` 추가 |
| `backend/src/main/java/com/tpmp/testprep/controller/AuthController.java` | 수정 | `POST /api/auth/logout` 추가 (scope 쿼리 파라미터, 기본값 `user`) |

### 수정 상세

#### `security/jwt/JwtAuthenticationFilter.java`
- 변경 전: `isTokenOptionalEndpoint`가 `/api/auth/login`·`/api/auth/refresh`·`/api/auth/signup`만 허용
- 변경 후: `/api/auth/logout`을 추가로 허용
- 이유: 로그아웃은 accessToken이 만료된 상태에서도 호출될 수 있다(오히려 만료된 채로 로그아웃하려는 상황이 흔함). 이 예외가 없으면 필터가 만료 토큰을 이유로 401을 반환해 쿠키 삭제 로직에 도달하지 못한다.

#### `security/jwt/RefreshTokenCookieProvider.java`
- 변경 전: `createLegacyExpiredCookie()`만 존재(레거시 `refresh_token` 쿠키 전용)
- 변경 후: `createExpiredCookie(User.Role role)` 추가 — `cookieNameFor(role)` 이름의 쿠키를 값 빈 문자열·`maxAge=0`·HttpOnly·path `/api/auth`로 생성. `createLegacyExpiredCookie()`와 로직이 중복되므로 private `expiredCookie(String name)` 헬퍼로 통합
- 이유: role별 refresh 쿠키를 로그아웃 시 만료시켜야 하는데 기존에는 로그인 시 발급하는 `createCookie`만 있었음. CLAUDE.md 공용 유틸리티 규칙에 따라 중복 로직을 헬퍼로 정리

#### `service/AuthService.java`
- 변경 전: `logout` 메서드 없음
- 변경 후: `logout(String scope, HttpServletResponse response)` 추가 — `"admin".equals(scope)` 기준으로 role 판정(`AuthController.refresh`와 동일 기준) 후 해당 role의 refresh 쿠키 + 레거시 `refresh_token` 쿠키를 응답에 만료 쿠키로 추가. 인증 정보·DB 조회 없음(만료된 토큰으로도 호출 가능해야 하므로)
- 이유: Refresh Token은 stateless JWT라 서버 측 블랙리스트(무효화)는 이번 범위에 포함하지 않음 — 쿠키 삭제만으로 재발급 경로를 차단하는 것으로 충분

#### `controller/AuthController.java`
- 변경 전: `/logout` 엔드포인트 없음
- 변경 후: `@PostMapping("/logout")` 추가 — `@RequestParam(name = "scope", defaultValue = "user") String scope`, `HttpServletResponse response`를 받아 `authService.logout(scope, response)` 호출 후 `ApiResponse.success()` 반환(`signup`의 void 응답 패턴과 동일)
- 이유: 프론트 `authService.logout(scope)`가 호출할 실제 서버 엔드포인트 신설

### 검증
- `./gradlew compileJava` 통과 확인

### 복원 방법
이 ID(HIST-20260717-002)로 복원 시 `JwtAuthenticationFilter.isTokenOptionalEndpoint`에서 `/api/auth/logout` 분기를 제거하고, `RefreshTokenCookieProvider.createExpiredCookie`를 삭제(`createLegacyExpiredCookie`는 기존 `new Cookie(...)` 직접 생성 방식으로 되돌려도 되고 유지해도 무방), `AuthService.logout`과 `AuthController.logout` 메서드를 삭제한다.

---

## HIST-20260717-001

- **날짜**: 2026-07-17
- **수정 범위**: 사용자 백엔드 / 인증 (Refresh Token 쿠키 계정 오염 버그 수정)
- **수정 개요**: 사용자·관리자 탭을 같은 브라우저에서 동시에 로그인하면 origin 단위로 공유되는 refresh 쿠키(`refresh_token` 단일 이름)가 서로 덮어써 사용자 탭이 조용히 admin 계정으로 전환되던 버그를 수정. refresh 쿠키를 role별로 `refresh_token_user` / `refresh_token_admin`으로 분리하고, 쿠키 생성 로직을 공용 `RefreshTokenCookieProvider`로 추출

### 원인

1. accessToken은 `sessionStorage`(프론트 `authStore.ts`)라 탭별로 격리되어 정상 동작
2. 그러나 refresh 토큰은 쿠키 `refresh_token` 하나뿐(`AuthService.login()`). 쿠키는 탭이 아닌 origin 단위로 공유되므로 관리자 탭 로그인이 사용자 탭의 쿠키를 덮어씀
3. 사용자 탭 accessToken이 15분 뒤 만료 → 401 → 프론트 `apiClient.ts`가 `/auth/refresh` 호출(withCredentials로 admin 쿠키 전송) → **admin accessToken**을 검증 없이 수신·저장
4. 화면 표시용 user는 zustand 메모리라 헤더 표시는 그대로 유지되어 사용자가 계정 전환을 눈치채지 못함(실제 피해: `quiz_history`가 admin 계정에 오염 축적)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/security/jwt/RefreshTokenCookieProvider.java` | 추가 | role별 refresh 쿠키 이름 상수(`refresh_token_user`/`refresh_token_admin`)·생성 헬퍼·레거시 쿠키 만료 헬퍼를 제공하는 공용 컴포넌트 |
| `backend/src/main/java/com/tpmp/testprep/service/AuthService.java` | 수정 | `login()`의 쿠키 생성을 `RefreshTokenCookieProvider`로 위임, 레거시 `refresh_token` 쿠키 즉시 만료 처리 추가 |
| `backend/src/main/java/com/tpmp/testprep/security/oauth2/OAuth2AuthenticationSuccessHandler.java` | 수정 | OAuth2 로그인 성공 시 쿠키 생성도 동일하게 `RefreshTokenCookieProvider`로 위임 |
| `backend/src/main/java/com/tpmp/testprep/controller/AuthController.java` | 수정 | `/auth/refresh`가 `refresh_token_user`/`refresh_token_admin` 쿠키와 `scope` 쿼리 파라미터(`user`\|`admin`, 기본 `user`)를 받아 scope에 맞는 쿠키만 사용하도록 변경. 레거시 `refresh_token` 쿠키는 fallback으로 사용하지 않음 |

### 수정 상세

#### `security/jwt/RefreshTokenCookieProvider.java` (신규)
- 변경 전: 없음
- 변경 후: `COOKIE_NAME_USER = "refresh_token_user"`, `COOKIE_NAME_ADMIN = "refresh_token_admin"`, `LEGACY_COOKIE_NAME = "refresh_token"` 상수와 `createCookie(User.Role, String)`(role 기준 이름 분기, HttpOnly, path `/api/auth`, maxAge는 `app.jwt.refresh-token-expiry` 그대로 유지), `createLegacyExpiredCookie()`(값 빈 문자열, maxAge=0)를 제공
- 이유: `AuthService`와 `OAuth2AuthenticationSuccessHandler` 두 곳에 동일한 쿠키 생성 로직이 중복돼 있어 CLAUDE.md 공용 유틸리티 규칙에 따라 추출. 패키지는 기존 `JwtTokenProvider`가 위치한 `security/jwt/`에 배치(같은 "인증 토큰 관련 보안 컴포넌트" 성격)

#### `service/AuthService.java`
- 변경 전: `login()`에서 `new Cookie("refresh_token", refreshToken)` 직접 생성 + `@Value`로 주입받은 `refreshTokenExpiry` 필드 사용
- 변경 후: `refreshTokenCookieProvider.createCookie(user.getRole(), refreshToken)` + `refreshTokenCookieProvider.createLegacyExpiredCookie()` 두 쿠키를 응답에 추가. 로컬 `refreshTokenExpiry` 필드·`Cookie`/`@Value` import 제거(공용 컴포넌트로 이전)
- 이유: role 기반 쿠키 분리 + 레거시 쿠키 정리로 오염 경로 원천 차단. `refresh(String)` 시그니처는 변경하지 않음(컨트롤러가 role에 맞는 토큰 값만 골라 넘기는 구조 유지)

#### `security/oauth2/OAuth2AuthenticationSuccessHandler.java`
- 변경 전: `login()`과 동일하게 `new Cookie("refresh_token", refreshToken)` 직접 생성
- 변경 후: `refreshTokenCookieProvider.createCookie(user.getRole(), refreshToken)` 사용. 로컬 `refreshTokenExpiry` 필드 제거
- 이유: OAuth2 로그인 경로도 동일한 오염 취약점을 가지므로 동일 규칙 적용. (레거시 쿠키 만료 처리는 이번 범위에서 이 경로에는 추가하지 않음 — 일반 로그인 `AuthService.login()`에서만 정리)

#### `controller/AuthController.java`
- 변경 전: `@CookieValue(name = "refresh_token", required = false) String refreshToken`만 받아 `authService.refresh(refreshToken)` 호출
- 변경 후: `@CookieValue(name = RefreshTokenCookieProvider.COOKIE_NAME_USER)`, `@CookieValue(name = RefreshTokenCookieProvider.COOKIE_NAME_ADMIN)` 둘 다 받고, `@RequestParam(name = "scope", defaultValue = "user") String scope`로 어느 쿠키를 쓸지 선택(`"admin".equals(scope)`이면 admin 쿠키, 아니면 user 쿠키). 레거시 `refresh_token` 쿠키는 어떤 경우에도 fallback으로 사용하지 않음
- 이유: 프론트가 현재 화면 경로(`/admin` 여부)로 scope를 판정해 넘기고, 서버는 그 scope에 해당하는 쿠키만 신뢰하도록 하여 쿠키 오염 경로를 차단

### 연동 프론트엔드 변경 (참고, 상세는 `docs/history/front/usr/Login_Modified.md` HIST-20260717-002)
- `authStore.ts`: `setAuth`가 `accessToken`과 함께 `authEmail`(user.email)을 sessionStorage에 저장, `clearAuth`가 함께 제거
- `apiClient.ts`: `refreshAccessToken()`이 경로 기준 scope로 `/auth/refresh?scope=...` 호출 + 응답 `user.email`을 저장된 `authEmail`과 비교해 불일치 시 토큰을 저장하지 않고 실패 처리(기존 401 catch의 로그아웃 흐름을 타도록 함)

### 검증 결과
- `./gradlew compileJava`: BUILD SUCCESSFUL (컴파일 오류 없음)
- `npx tsc --noEmit`(frontend): 오류 0건

### 복원 방법
이 ID(HIST-20260717-001)만으로 복원 시:
1. `RefreshTokenCookieProvider.java` 삭제
2. `AuthService.java`: `login()`의 쿠키 생성부를 `Cookie cookie = new Cookie("refresh_token", refreshToken); cookie.setHttpOnly(true); cookie.setPath("/api/auth"); cookie.setMaxAge((int) (refreshTokenExpiry / 1000)); response.addCookie(cookie);` 로 되돌리고, `@Value("${app.jwt.refresh-token-expiry}") private long refreshTokenExpiry;` 필드와 `import jakarta.servlet.http.Cookie;`를 복원, `RefreshTokenCookieProvider` 필드·import 제거
3. `OAuth2AuthenticationSuccessHandler.java`: 동일하게 `new Cookie("refresh_token", refreshToken)` 직접 생성 방식과 로컬 `refreshTokenExpiry` 필드로 되돌림
4. `AuthController.java`의 `/refresh`를 `@CookieValue(name = "refresh_token", required = false) String refreshToken` 단일 파라미터로 되돌리고 `scope` 파라미터 제거

---

## HIST-20260622-001

- **날짜**: 2026-06-22
- **수정 범위**: 사용자 백엔드 / 닉네임 DB 유니크 제약
- **수정 개요**: 닉네임 컬럼에 대소문자 무시 functional unique index(`LOWER(nickname)`) 적용 — 선행 중복 정리 후 PostgreSQL functional index 생성하는 `NicknameUniqueIndexRunner` 추가, `User.java` nickname 컬럼 주석 명시

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/config/NicknameUniqueIndexRunner.java` | 추가 | `@Order(250)` ApplicationRunner — 대소문자 중복 닉네임 정리 후 `ux_users_nickname_lower` functional unique index 생성 |
| `backend/src/main/java/com/tpmp/testprep/entity/User.java` | 수정 | nickname `@Column`에 `unique=true` 미적용 이유 주석 추가 |

### 수정 상세

#### `config/NicknameUniqueIndexRunner.java` (신규)
- 변경 전: 없음
- 변경 후: `@Order(250)` ApplicationRunner 신규 추가
  - `deduplicateNicknames()`: `LOWER(nickname)` 기준 중복 그룹에서 `ROW_NUMBER() PARTITION BY LOWER(nickname) ORDER BY id ASC` 윈도우 함수를 사용하여 rn > 1(id가 큰 행, 즉 늦게 가입한 사용자)의 닉네임을 `사용자{id}`로 교체. 중복 없으면 0건(멱등).
  - `createUniqueIndex()`: `CREATE UNIQUE INDEX IF NOT EXISTS ux_users_nickname_lower ON users (LOWER(nickname))` 실행. `IF NOT EXISTS`로 멱등 보장.
- 이유: 앱 레벨 `existsByNicknameIgnoreCase`는 단일 요청 중복만 차단; 동시 요청 레이스 컨디션을 DB 레벨에서 방어하기 위해 functional unique index 필요. `@Column(unique=true)`는 대소문자 구분 인덱스만 생성하므로 functional index 방식으로 구현.
- 실행 순서: UserNicknameInitRunner(@Order 150) → 이 러너(@Order 250). 모든 NULL 닉네임이 먼저 채워진 뒤 실행됨.

#### `entity/User.java`
- 변경 전: `@Column(name = "nickname", nullable = true, length = 50)` — 주석 없음
- 변경 후: 위에 `// unique=true 는 의도적으로 생략. 대소문자 무시 유니크 제약은 NicknameUniqueIndexRunner 가 생성하는 functional index (LOWER(nickname)) 로 관리한다.` 주석 추가
- 이유: Hibernate ddl-auto가 `@Column(unique=true)` 감지 시 별도 단순 unique index를 추가로 생성할 수 있어 functional index와 이중 적용될 수 있음. 주석으로 의도를 명시하여 혼동 방지.

### 복원 방법
이 ID(HIST-20260622-001)만으로 복원 시:
1. `NicknameUniqueIndexRunner.java` 삭제
2. `User.java` nickname `@Column` 위 주석 제거
3. DB에 생성된 `ux_users_nickname_lower` 인덱스가 있다면 `DROP INDEX ux_users_nickname_lower`로 제거

---

## HIST-20260621-001

- **날짜**: 2026-06-21
- **수정 범위**: 사용자 백엔드 / 사용자 프로필 · 닉네임 중복 검증
- **수정 개요**: 닉네임 중복 저장 방지 — `existsByNicknameIgnoreCase` 추가, `UserProfileService.updateNickname`에 본인 동일 닉네임 통과·타인 중복 409 검증 적용, `ErrorCode.NICKNAME_ALREADY_EXISTS`(409) 신규 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/repository/UserRepository.java` | 수정 | `boolean existsByNicknameIgnoreCase(String nickname)` 메서드 추가 |
| `backend/src/main/java/com/tpmp/testprep/service/UserProfileService.java` | 수정 | `updateNickname`에 중복 검증 로직 추가 — 본인 현재 닉네임과 동일하면 no-op 반환, 타인 중복이면 `BusinessException(NICKNAME_ALREADY_EXISTS)` |
| `backend/src/main/java/com/tpmp/testprep/exception/ErrorCode.java` | 수정 | `NICKNAME_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다.")` 신규 추가 |

### 수정 상세

#### `repository/UserRepository.java`
- 변경 전: `existsByNicknameIgnoreCase` 없음
- 변경 후: `boolean existsByNicknameIgnoreCase(String nickname)` 추가 — JPA 쿼리 메서드 자동 구현(대소문자 무시 LIKE)
- 이유: 서비스 레벨 닉네임 중복 검증에 사용

#### `service/UserProfileService.java`
- 변경 전: `findByEmail` 후 바로 `user.updateNickname(request.nickname())` 호출
- 변경 후:
  ```java
  // 1. 본인 현재 닉네임과 동일하면 no-op (자기 자신과의 충돌 방지)
  if (newNickname.equalsIgnoreCase(user.getNickname())) {
      return UserResponse.from(user);
  }
  // 2. 타인이 이미 사용 중이면 409
  if (userRepository.existsByNicknameIgnoreCase(newNickname)) {
      throw new BusinessException(ErrorCode.NICKNAME_ALREADY_EXISTS);
  }
  user.updateNickname(newNickname);
  ```
- 이유: 중복 검증 없이 저장하면 동일 닉네임이 여러 사용자에게 할당 가능. 본인-동일 케이스를 먼저 처리하여 자기 자신과의 false-positive 방지.

#### `entity/User.java` — DB unique 제약 보류 판단
- `@Column(name = "nickname", nullable = true, length = 50)`에 `unique = true` 추가를 검토하였으나 **보류**함.
  - 사유: `ddl-auto: update` 환경에서 기존 DB에 NULL 닉네임 행이 잔존할 경우 unique 인덱스 생성이 실패할 수 있음. 또한 마이그레이션 러너 실행 전 상태나 예외 케이스에서 중복 값이 있으면 서버 기동 자체가 실패할 위험이 있음.
  - 대안: 앱 레벨 `existsByNicknameIgnoreCase` 검증으로 동시성 이슈를 제외한 일반적인 중복 입력은 충분히 차단함. 향후 정식 마이그레이션 스크립트(`V*__add_unique_nickname.sql`)로 적용 예정.

#### `exception/ErrorCode.java`
- 변경 전: `NICKNAME_ALREADY_EXISTS` 없음
- 변경 후: `NICKNAME_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다.")` User 섹션에 추가

### 복원 방법
이 ID(HIST-20260621-001)만으로 복원 시:
1. `UserRepository.java`에서 `existsByNicknameIgnoreCase` 제거
2. `UserProfileService.updateNickname`에서 no-op 분기 및 중복 검증 블록 제거, 바로 `user.updateNickname` 호출로 복원
3. `ErrorCode.java`에서 `NICKNAME_ALREADY_EXISTS` 제거

---

## HIST-20260620-001

- **날짜**: 2026-06-20
- **수정 범위**: 사용자 백엔드 / 인증 · 사용자 프로필
- **수정 개요**: User nickname 필드 도입, 신규 가입(로컬/OAuth) 시 기본 닉네임 자동 설정, 기존 사용자 마이그레이션 러너, UserResponse에 nickname 포함, PATCH /nickname API 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `entity/User.java` | 수정 | `nickname` 컬럼(nullable, length=50) 추가, `updateNickname()` 메서드 추가 |
| `config/UserNicknameInitRunner.java` | 추가 | `@Order(150)` ApplicationRunner — `UPDATE users SET nickname = CONCAT('사용자', id) WHERE nickname IS NULL` 멱등 실행 |
| `dto/response/UserResponse.java` | 수정 | record에 `nickname` 필드 추가, `from(user)` · `from(user, interests)` 모두 `user.getNickname()` 포함 |
| `dto/request/NicknameUpdateRequest.java` | 추가 | `@NotBlank @Size(min=1, max=20) String nickname` 요청 DTO |
| `service/AuthService.java` | 수정 | `signup()` 내 save 후 2-step 닉네임 초기화 (`"사용자" + saved.getId()`) |
| `security/oauth2/CustomOAuth2UserService.java` | 수정 | 신규 OAuth 사용자 save 직후 2-step 닉네임 초기화 |
| `service/UserProfileService.java` | 추가 | `updateNickname(email, request)` — findByEmail → user.updateNickname → UserResponse.from |
| `controller/UserProfileController.java` | 추가 | `PATCH /api/user/me/nickname` 엔드포인트 |

### 수정 상세

#### `entity/User.java`
- 변경 전: `name` 필드 다음 바로 `role` 필드
- 변경 후: `name` 다음에 `@Column(name="nickname", nullable=true, length=50) private String nickname;` 추가, `updateNickname(String nickname)` 메서드 추가
- 이유: 공개 API 비식별화를 위한 닉네임 저장

#### `config/UserNicknameInitRunner.java` (신규)
- `@Order(150)` ApplicationRunner. `UPDATE users SET nickname = CONCAT('사용자', id) WHERE nickname IS NULL` 실행
- count==0 → "모두 이미 설정됨 — 건너뜀", else → "기존 사용자 {}건 닉네임 초기화 완료"

#### `dto/response/UserResponse.java`
- 변경 전: `record UserResponse(Long id, String email, String name, String role, ...)`
- 변경 후: `record UserResponse(Long id, String email, String name, String nickname, String role, ...)` — 두 `from()` 팩토리 모두 `user.getNickname()` 추가

#### `dto/request/NicknameUpdateRequest.java` (신규)
- `@NotBlank @Size(min=1, max=20) String nickname`

#### `service/AuthService.java`
- 변경 전: `userRepository.save(user);` 한 번
- 변경 후: `User saved = userRepository.save(user); saved.updateNickname("사용자" + saved.getId()); userRepository.save(saved);`

#### `security/oauth2/CustomOAuth2UserService.java`
- 변경 전: `.orElseGet(() -> userRepository.save(User.ofOAuth(email, name, provider, providerId)))`
- 변경 후: lambda로 2-step — save 후 `updateNickname("사용자" + newUser.getId())` 재저장

#### `service/UserProfileService.java` (신규)
- `updateNickname(email, request)`: findByEmail → 없으면 USER_NOT_FOUND, `user.updateNickname(request.nickname())`, `UserResponse.from(user)` 반환

#### `controller/UserProfileController.java` (신규)
- `@PatchMapping("/nickname")` → `userProfileService.updateNickname(email, request)` → `ApiResponse.success()`

### 복원 방법
이 ID(HIST-20260620-001)만으로 복원 시:
- `User.java`에서 `nickname` 컬럼 필드 및 `updateNickname()` 제거
- `UserNicknameInitRunner.java` 삭제
- `UserResponse.java`에서 `nickname` 필드 제거, from() 팩토리 복원
- `NicknameUpdateRequest.java` 삭제
- `AuthService.java` signup()을 단일 save로 복원
- `CustomOAuth2UserService.java` `.orElseGet()` lambda를 단일 save로 복원
- `UserProfileService.java`, `UserProfileController.java` 삭제

---

## HIST-20260614-001

- **날짜**: 2026-06-14
- **수정 범위**: 공통 백엔드 / 인증 (사용자·관리자 공통)
- **수정 개요**: `GET /api/auth/me`가 유효 토큰으로도 항상 401을 반환하던 버그 수정 — JWT 필터가 `/api/auth/**` 전체를 스킵해 인증이 필요한 `/me`까지 토큰 검증을 못 받던 문제 해결

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../security/jwt/JwtAuthenticationFilter.java` | 수정 | `shouldNotFilter()`에서 `/api/auth/**` 제외 제거(OAuth2만 유지), 만료 토큰 허용은 `isTokenOptionalEndpoint`(login/refresh/signup)로 한정 |

### 수정 상세

#### `security/jwt/JwtAuthenticationFilter.java`
- **문제**: 직전 HIST-20260512-001에서 추가된 `shouldNotFilter()`가 `/api/auth/**` 경로 전체를 필터 대상에서 제외함. 이로 인해 인증이 필요한 `/api/auth/me`도 토큰을 검증받지 못해 `@AuthenticationPrincipal`이 항상 null → 401. 프론트 `UserLayoutShell`이 마운트마다 `me()`를 호출해 실패 시 로그아웃 처리하므로, 새로고침/직접 URL 진입 시 로그인으로 튕기는 원인이었음.
- **변경 전**: `shouldNotFilter` → `path.startsWith("/api/auth/") || oauth2...` (auth 전체 스킵)
- **변경 후**:
  - `shouldNotFilter` → OAuth2 경로(`/api/oauth2/`, `/api/login/oauth2/`)만 스킵. `/api/auth/**`는 필터를 통과시켜 토큰을 검증.
  - 만료/무효 토큰에 대한 즉시 401 차단은 `isTokenOptionalEndpoint(path)`가 `false`일 때만 수행. login/refresh/signup은 만료 토큰이 헤더에 남아 있어도 401로 막지 않고 그대로 진행(`SecurityContextHolder.clearContext()` 후 계속).
  - 결과: `/me`는 유효 토큰 → 인증 성공(200), 무효/만료 토큰 → 401(프론트가 refresh 재시도), login/refresh/signup은 종전처럼 토큰 없이도 동작.
- **검증**: curl — `/me` 유효토큰 200·토큰없음 401·무효토큰 401, `/login` 무효토큰 헤더 동봉 200. 크롬 E2E — 만료 토큰 상태로 `/user/exam-history` 직접 진입 시 `/me` 401 → `/auth/refresh` 200 → 재시도 `/me` 200으로 로그인 유지·정상 렌더 확인.

### 복원 방법
이 ID(HIST-20260614-001)로 복원 시 `shouldNotFilter`에 `path.startsWith("/api/auth/")`를 다시 추가하고 `isTokenOptionalEndpoint` 분기 및 메서드를 제거한다. (단, 그 경우 `/api/auth/me` 401 버그가 재발한다.)

---

## HIST-20260512-001

- **날짜**: 2026-05-12
- **수정 범위**: 공통 백엔드 / 인증 (사용자·관리자 공통)
- **수정 개요**: Access Token 만료 시 403이 반환되어 프론트엔드 토큰 재발급이 트리거되지 않는 버그 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../security/jwt/JwtAuthenticationFilter.java` | 수정 | 만료 토큰에 대해 즉시 401 반환 + 세션 auth 간섭 차단 + `shouldNotFilter()` 추가 |

### 원인 분석

#### 문제 1: `JwtAuthenticationFilter` — 만료 토큰 묵과

변경 전 코드:
```java
if (StringUtils.hasText(token) && jwtTokenProvider.validate(token)) {
    // 유효하면 auth 설정
}
filterChain.doFilter(request, response); // 만료된 경우도 그냥 통과
```

토큰이 존재하지만 만료된 경우, `validate()` = false → auth 미설정 → 다음 필터로 통과.

#### 문제 2: `SecurityConfig` — `SessionCreationPolicy.IF_REQUIRED` + `oauth2Login`

`IF_REQUIRED` 정책 + `oauth2Login` 구성으로 인해 `HttpSessionSecurityContextRepository`가 활성화됨.  
OAuth2 로그인 이력이 있는 브라우저에서는 세션 쿠키(`JSESSIONID`)가 존재할 수 있으며,  
JWT 필터가 auth를 설정하지 않으면 세션 기반 auth(예: `ROLE_USER`)가 복원됨.

#### 결과 흐름 (버그)

```
Access Token 만료
  → JWT 필터: validate() = false → auth 미설정
  → 세션 auth 복원(ROLE_USER 등)
  → /api/admin/** hasRole("ADMIN") 불충족
  → AccessDeniedException → 기본 AccessDeniedHandler → 403
  → 프론트 인터셉터: 403 → permission-denied 이벤트 (재발급 없음)
```

### 수정 상세

#### `JwtAuthenticationFilter.java`

**변경 후:**
- 토큰이 존재하고 유효한 경우: 기존과 동일하게 auth 설정
- 토큰이 존재하지만 만료/무효인 경우:
  1. `SecurityContextHolder.clearContext()` — 세션에서 복원된 auth 제거
  2. HTTP 401 즉시 반환 (`filterChain.doFilter` 호출하지 않음)
  3. 프론트엔드 인터셉터가 401을 받아 Refresh Token으로 재발급 시도
- 토큰이 없는 경우: 기존과 동일하게 다음 필터로 통과 (Spring Security가 401 처리)
- `shouldNotFilter()` 추가: `/api/auth/`, `/api/oauth2/`, `/api/login/oauth2/` 경로는 검사에서 제외

### 수정 후 흐름

```
Access Token 만료
  → JWT 필터: validate() = false, 토큰 존재 → clearContext() → 즉시 401 반환
  → 프론트 인터셉터: 401 → POST /api/auth/refresh (Refresh Token 쿠키 전송)
  → 새 Access Token 발급 → 원래 요청 재시도 → 성공
```

### 복원 방법

HIST-20260512-001 복원 시:
- `JwtAuthenticationFilter.java`에서 `else` 블록(401 반환) 제거, `shouldNotFilter()` 메서드 제거
- 단일 조건문 `if (token && validate) { auth 설정 }` + `filterChain.doFilter(request, response)` 구조로 복원
