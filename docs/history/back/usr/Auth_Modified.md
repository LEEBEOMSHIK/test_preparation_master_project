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
