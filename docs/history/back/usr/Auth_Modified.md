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
