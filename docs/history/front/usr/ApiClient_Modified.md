# ApiClient 수정 이력

## HIST-20260614-002

- **날짜**: 2026-06-14
- **수정 범위**: 공통 프론트엔드 / API 클라이언트(axios 인터셉터)
- **수정 개요**: 401 토큰 재발급에 single-flight 디듀프 적용 — 동시에 여러 요청이 401을 받아도 `POST /api/auth/refresh`를 1회만 호출하고 나머지는 동일 Promise를 공유

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/apiClient.ts` | 수정 | 모듈 레벨 `refreshPromise` + `refreshAccessToken()` 추가, 인터셉터 401 분기가 이 공유 함수를 사용하도록 변경 |

### 수정 상세

#### `frontend/src/services/apiClient.ts`
- **문제**: 만료 토큰 상태로 화면 진입 시 병렬 요청이 각각 401 → 각각 `refresh`를 호출해 동일 시점에 `/api/auth/refresh`가 여러 번(관측상 6회: 엔드포인트 3종 × React strict mode 이중 실행) 중복 호출됨.
- **변경 전**: 인터셉터 내부에서 매 401마다 `axios.post('/api/auth/refresh', ...)` 직접 호출.
- **변경 후**:
  - 모듈 레벨 `let refreshPromise: Promise<string> | null` 도입.
  - `refreshAccessToken()` — 진행 중 refresh가 없을 때만 새 요청을 만들고, 완료(`.finally`) 시 `refreshPromise`를 null로 초기화해 다음 만료 때 재발급 가능. 진행 중이면 동일 Promise를 반환.
  - 인터셉터 401 분기: `const newToken = await refreshAccessToken();` 후 원요청 재시도. 실패 시 종전과 동일하게 토큰 제거 + 로그인 이동.
- **검증**: `npx tsc --noEmit` 통과. 크롬 — 토큰을 무효값으로 바꾼 뒤 리로드해 동시 401 6건 발생시켰을 때 `/api/auth/refresh` **1회**만 호출되고 재시도 전부 200, 화면 정상 렌더 확인(이전 6회 → 1회).

### 복원 방법
이 ID(HIST-20260614-002)로 복원 시 `refreshPromise`/`refreshAccessToken()`를 제거하고 인터셉터 401 분기를 `axios.post('/api/auth/refresh')` 직접 호출로 환원한다.

---

## HIST-20260614-001

- **날짜**: 2026-06-14
- **수정 범위**: 공통 프론트엔드 / API 클라이언트(axios 인터셉터)
- **수정 개요**: 401 응답 시 Refresh→재시도 흐름에서 `/auth/` 엔드포인트 전체를 제외하던 것을 토큰 발급 계열(login/refresh/signup)만으로 한정 — `/auth/me`가 만료 토큰으로 401일 때 자동 재발급되도록 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/services/apiClient.ts` | 수정 | 응답 인터셉터의 `isAuthEndpoint`(`/auth/` 포함 전체 제외)를 `NO_RETRY_AUTH_ENDPOINTS`(login/refresh/signup만) 기반으로 변경 |

### 수정 상세

#### `frontend/src/services/apiClient.ts`
- **문제**: 응답 인터셉터가 `originalRequest.url.includes('/auth/')`인 요청을 모두 갱신 재시도 대상에서 제외함. 이 때문에 `/auth/me`가 만료된 access token으로 401을 받아도 Refresh Token으로 재발급을 시도하지 않고 곧바로 reject → 호출 측에서 로그아웃 처리되어 세션이 유지되지 않았음.
- **변경 전**: `const isAuthEndpoint = originalRequest.url?.includes('/auth/'); if (isAuthEndpoint) return Promise.reject(error);`
- **변경 후**:
  - `NO_RETRY_AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/signup']` 정의.
  - 해당 목록에 포함된 요청만 갱신 재시도에서 제외(토큰 발급 계열이 401 시 refresh 루프에 빠지는 것 방지).
  - `/auth/me` 등 나머지는 401 시 정상적으로 `POST /api/auth/refresh` → 새 토큰으로 원요청 재시도 흐름을 탄다.
- **연계 백엔드 수정**: `JwtAuthenticationFilter`가 `/api/auth/me`를 인증하도록 변경(백엔드 Auth_Modified.md HIST-20260614-001). 두 수정이 함께 동작해 "만료 토큰 → /me 401 → refresh → 재시도 → 200 → 로그인 유지" 흐름이 완성됨.
- **검증**: `npx tsc --noEmit` 통과. 크롬 네트워크 로그 — 만료 토큰 상태에서 `/me`·`/menus/mine`·이력 API가 401 → `/auth/refresh` 200 → 재시도 전부 200 확인. 하드 내비게이션(직접 URL 진입) 시 로그인 튕김 현상 해소.

### 복원 방법
이 ID(HIST-20260614-001)로 복원 시 `NO_RETRY_AUTH_ENDPOINTS`를 제거하고 `isAuthEndpoint = url.includes('/auth/')` 단일 조건으로 환원한다. (단, 그 경우 `/auth/me` 만료 토큰 자동 재발급이 동작하지 않는다.)

---
