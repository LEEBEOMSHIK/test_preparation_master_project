# Security Guidelines

## 인증 / 인가

### JWT 토큰 전략
- **Access Token**: 유효기간 15분, Authorization 헤더 (`Bearer {token}`)
- **Refresh Token**: 유효기간 7일, HttpOnly Cookie — role별로 `refresh_token_user` / `refresh_token_admin`으로 분리(동일 브라우저에서 사용자·관리자 탭을 동시에 열어도 쿠키가 origin 단위로 공유되어 서로 덮어쓰며 세션이 다른 계정으로 전환되는 것을 방지하기 위함). 분리 이전 레거시 `refresh_token` 쿠키는 로그인 시 즉시 만료 처리되며 fallback으로 사용하지 않는다.
- **로그아웃**: `POST /api/auth/logout?scope=user|admin` 호출 시 서버가 해당 role의 refresh 쿠키(+ 레거시 `refresh_token`)를 `maxAge=0`으로 즉시 만료시킨다. accessToken 만료 상태에서도 호출 가능(토큰 검증 예외 엔드포인트). Refresh Token은 stateless JWT라 서버 측 블랙리스트는 두지 않으며, 쿠키 삭제만으로 재발급 경로를 차단한다.
- 시크릿 키: 환경변수 `JWT_SECRET` (최소 256bit)
- 알고리즘: HS256

### 로그인 Rate Limiting
- `POST /api/auth/login`에만 적용(signup/refresh 등은 범위 밖).
- 키는 이메일이 아닌 **클라이언트 IP**만 사용. 이메일 기준이면 공격자가 타인 이메일로 의도적으로 실패시켜 정상 사용자를 잠그는 DoS가 가능하기 때문.
- 알고리즘: 고정 윈도우(fixed window) — 같은 IP에서 5분 이내 로그인 실패 5회 이상이면 이후 요청을 즉시 차단(자격증명 검사 자체를 하지 않음)하고 `429 TOO_MANY_LOGIN_ATTEMPTS`를 반환. 로그인 성공 시 해당 IP 카운터는 즉시 제거.
- 저장소: 순수 인메모리 `ConcurrentHashMap`(`security/LoginRateLimiter.java`). 매 시간 `@Scheduled`로 1시간 이상 지난 엔트리를 정리해 메모리 누수를 방지.
- **제약**: 단일 인스턴스(단일 VM docker-compose, 수평 확장 없음)를 전제로 한 설계다. 향후 인스턴스를 다중화하면 인스턴스별로 카운터가 분리되어 한도가 사실상 배수로 늘어나므로, 그 시점에는 Redis 등 외부 공유 저장소로 교체해야 한다.

### 인가 레벨
| 경로 | 접근 권한 |
|---|---|
| `/api/auth/**` | 누구나 |
| `/api/user/**` | 인증된 사용자 (USER, ADMIN) |
| `/api/admin/**` | ADMIN 역할만 |

### Spring Security 설정 원칙
- CSRF: API 서버이므로 비활성화 (Stateless)
- CORS: 허용 Origin은 환경변수로 관리 (`ALLOWED_ORIGINS`)
- Session: STATELESS
- 패스워드: BCrypt (strength 12)

---

## 입력값 검증

### Backend
- 모든 RequestBody에 `@Valid` + Bean Validation 애노테이션 사용
- 파일 업로드:
  - 허용 MIME 타입: `application/pdf`, `application/haansofthwp`, `application/x-hwp`
  - 최대 파일 크기: 10MB (환경변수 `MAX_FILE_SIZE`)
  - 파일명: UUID로 재생성 (원본 파일명 DB에만 저장)
  - 저장 경로: 환경변수 `UPLOAD_PATH` (컨테이너 볼륨)

### Frontend
- 사용자 입력은 서버 전송 전 클라이언트 검증 (UX 목적)
- XSS 방지: React는 기본 이스케이프, 마크다운 렌더링 시 `DOMPurify` 사용

---

## SQL Injection 방지
- JPA Named Query 또는 `@Query`의 파라미터 바인딩 사용 (`:param` 방식)
- JPQL/HQL 문자열 연결 절대 금지
- Native Query 사용 시 반드시 `?1` 파라미터 바인딩

---

## 민감 정보 관리

### 절대 코드에 하드코딩 금지
- DB 비밀번호
- JWT 시크릿
- 서드파티 API 키

### 환경변수 관리
- 개발: `.env` 파일 (`.gitignore` 등록)
- 운영: Docker secrets 또는 환경변수 직접 주입

```
# .env.example (커밋 허용)
DB_PASSWORD=change_me
JWT_SECRET=change_me_to_256bit_secret
ALLOWED_ORIGINS=http://localhost:3000
UPLOAD_PATH=/uploads
MAX_FILE_SIZE=10485760
```

---

## API 보안 체크리스트

- [ ] 모든 관리자 엔드포인트에 `@PreAuthorize("hasRole('ADMIN')")` 적용
- [ ] 사용자는 자신의 리소스만 수정/삭제 가능 (소유권 검증)
- [ ] 파일 다운로드 경로 노출 금지 (내부 UUID 경로, 직접 접근 차단)
- [ ] 에러 응답에 스택 트레이스 미포함 (프로덕션)
- [x] Rate limiting 적용 검토 (로그인 엔드포인트) — IP 기준 5분/5회 고정 윈도우 (`security/LoginRateLimiter.java`)
