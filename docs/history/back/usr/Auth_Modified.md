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
