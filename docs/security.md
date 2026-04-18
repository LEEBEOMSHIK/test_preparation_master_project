# Security Guidelines

## 인증 / 인가

### JWT 토큰 전략
- **Access Token**: 유효기간 15분, Authorization 헤더 (`Bearer {token}`)
- **Refresh Token**: 유효기간 7일, HttpOnly Cookie (`refresh_token`)
- 시크릿 키: 환경변수 `JWT_SECRET` (최소 256bit)
- 알고리즘: HS256

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
- [ ] Rate limiting 적용 검토 (로그인 엔드포인트)
