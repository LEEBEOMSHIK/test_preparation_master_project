# Deployment Guide — 배포 가이드

TPMP를 실제 서비스로 올리기 위한 호스팅 전략, 배포 전 준비사항, 점검 결과를 정리한 문서.
작성 시점: 2026-07-24. 아직 별도 개발/운영 DB는 존재하지 않으며(로컬 `tpmp-db` docker 컨테이너만 존재), 실제 배포는 진행되지 않은 상태에서 사전 검토용으로 작성됨.

---

## 1. 배포 구조

기존에 준비된 `docker-compose.yml`(base) + `docker-compose.prod.yml`(override) + `nginx/nginx.conf` 조합을 그대로 사용한다. **단일 VM에 docker-compose로 4개 컨테이너(db, backend, frontend, nginx)를 올리는 구조**이며, 별도의 관리형 서비스(PaaS)로 쪼개는 것보다 이 구조가 훨씬 저렴하다.

```
인터넷 → nginx(80/443) → frontend(3000) / backend(8080) → db(5432, 컨테이너 내부만)
```

---

## 2. 가성비 호스팅 추천

### 1순위: Oracle Cloud Always Free Tier (ARM Ampere A1)
- **비용: 완전 무료** (신용카드 등록은 필요하나 free tier 내에서는 과금 없음)
- 스펙: 2026-06-15부로 신규 가입 기준 **2 OCPU / 12GB RAM**으로 축소됨(과거 4 OCPU/24GB). 이 프로젝트 규모(개인 사이드 프로젝트, 4개 컨테이너)에는 여전히 충분.
- 기존 docker-compose 구조 그대로 올릴 수 있어 궁합이 좋음.

### 대안: 저가 VPS
Oracle 가입/리전 문제가 있을 경우:
- Hostinger VPS: 월 $5.99~ (1vCPU/4GB, 연간 결제 기준)
- Kamatera: 월 $4~
- IONOS: 월 $2~ (base)

### 도메인 + HTTPS
- 도메인: 연 1~2만원대(.com/.kr 등)
- HTTPS: **Let's Encrypt(certbot)로 무료 발급 가능** — 단, 현재 `nginx/nginx.conf`에 SSL 설정이 전혀 없어 별도 작업 필요(§4-2 참고)

### 변동비 주의 — Claude API
`ANTHROPIC_API_KEY`로 서버가 실제 Claude API를 호출하는 기능이 있음. 호스팅비와 별개로 **사용량에 비례해 계속 과금**되므로, 트래픽이 늘면 이쪽이 주 비용이 될 수 있다. 현재는 `AdminQuestionController`가 `@PreAuthorize("hasRole('ADMIN')")`으로 보호되어 있어 일반 사용자가 트리거할 수 없는 구조라 당장 리스크는 낮음(§4-3 참고).

---

## 3. 배포 전 준비사항 체크리스트

- [ ] Oracle Cloud(또는 VPS) 인스턴스 발급
- [ ] 도메인 구매 + DNS A레코드를 서버 IP로 연결
- [ ] 서버에 Docker + Docker Compose 설치
- [ ] `.env` 파일 작성 (아래 §5 필수 환경변수 참고, `.env`는 git에 커밋하지 않음 — 이미 `.gitignore` 등록 확인됨)
- [ ] `docs/db-migration/*.sql` **34개 파일을 파일명 순서대로** 신규 DB에 적용
- [ ] `docs/sql/tpmp_content_data.sql` 적용 (콘텐츠 시드 데이터 — `docs/sql/README.md`의 "마이그레이션 먼저, 콘텐츠 덤프 나중" 순서 준수)
- [ ] §4의 치명적 항목 3개 모두 수정 확인
- [ ] §4의 중요 항목(Swagger 비활성화, 파일 업로드 화이트리스트) 수정 확인
- [ ] Let's Encrypt 인증서 발급 + nginx 443 설정
- [ ] 배포 후 실제 회원가입/로그인/시험응시 e2e 스모크 테스트

---

## 4. 배포 전 보안·설정 점검 결과

fork 에이전트를 통해 9개 영역(시크릿 관리, docs/security.md 완성도, CORS/URL 설정, 파일 업로드 검증, prod 프로필/actuator 노출, DB 백업 전략, Dockerfile 품질, 마이그레이션 정합성, Anthropic API 비용/레이트리밋 리스크)을 코드 직접 확인으로 점검함.

### 4-1. 치명적 (반드시 배포 전 수정)

**① (완료) DB 포트(5432)가 인터넷에 직접 노출됨**
`docker-compose.yml:17-18`의 `ports: "5432:5432"`를 `docker-compose.prod.yml`이 오버라이드하지 않음. 서버 방화벽을 별도로 막지 않으면 PostgreSQL이 외부에서 직접 접근 가능.
→ 수정: prod 오버라이드에서 `db` 서비스의 `ports` 제거하거나 `127.0.0.1:5432:5432`로 바인딩. (`docker-compose.prod.yml`의 `db` 서비스에 `ports: !reset []` 적용 완료 — `ports: []`만으로는 리스트 병합 특성상 base 값이 그대로 남으므로 Compose Specification의 `!reset` 태그로 완전히 제거함)

**② HTTPS/TLS 설정이 전혀 없음**
`nginx/nginx.conf`는 80포트 HTTP만 처리, 인증서/SSL 설정 없음. 로그인 자격증명·JWT access token·개인정보(시험 접수 정보 등)가 전부 평문으로 오간다.
→ 수정: Let's Encrypt(certbot) 연동 + nginx 443 리다이렉트 추가(실제 도메인 확보 후 진행).

**③ (완료) backend(8080)·frontend(3000) 포트도 호스트에 직접 노출**
`docker-compose.yml:60-61,80-81`, prod에서 미오버라이드. nginx가 단일 진입점이라는 설계 의도와 달리 백엔드에 직접 우회 접근 가능(CORS는 브라우저만 막을 뿐 직접 curl 호출은 무관).
→ 수정: prod 오버라이드에서 backend/frontend `ports` 제거(nginx만 외부 노출). (`docker-compose.prod.yml`의 `backend`/`frontend` 서비스에 각각 `ports: !reset []` 적용 완료, `nginx`(80 포트)만 외부에 노출되는 구조 확인)

### 4-2. 중요

**④ Swagger/OpenAPI 문서가 프로덕션에서도 인증 없이 공개됨**
`SecurityConfig.java:55` `/api/v3/api-docs/**`, `/api/swagger-ui/**`가 permitAll이고 `application-prod.yml`에 비활성화 설정 없음 → 전체 API 스펙(엔드포인트·DTO 구조)이 공개 노출.
→ 수정: `application-prod.yml`에 `springdoc.api-docs.enabled: false` / `swagger-ui.enabled: false` 추가.

**⑤ 파일 업로드 확장자 화이트리스트 미검증** (CLAUDE.md 정책 위반)
`AttachmentService.java:36-45` — MIME 타입만 클라이언트 `Content-Type` 헤더로 검사(스푸핑 가능)하고, 저장 확장자는 원본 파일명에서 그대로 추출(화이트리스트 없음). `/uploads/**`가 permitAll로 정적 서빙되므로, `evil.svg`를 `image/jpeg`로 위장 업로드 시 stored XSS 벡터가 될 수 있음.
→ 수정: 확장자 화이트리스트(jpg/jpeg/png/gif/webp) 추가 검증.

**⑥ actuator 전체가 permitAll**
`SecurityConfig.java:54` — 현재 `exposure.include: health`뿐이라 당장은 안전하지만, 향후 디버깅 목적으로 exposure를 넓히면 즉시 무방비 공개됨.
→ 수정: `/api/actuator/health`만 permitAll하고 나머지는 인증 요구, 또는 현재 구조 유지 시 확장 금지 주석 명시.

### 4-3. 참고 (배포 직후 필수는 아님)

**⑦ 로그인 rate limiting 없음** — 무차별 대입 방어 없음. 배포 직후 필수는 아니나 조기 권장.

**⑧ 프로덕션 DB 백업 전략 부재** — `docs/sql`은 마이그레이션용 콘텐츠 덤프이지 운영 자동 백업이 아님. 단일 VM + Docker named volume(`postgres_data`) 구조라 VM 손실 시 데이터 전체 유실. 최소 cron `pg_dump` + 외부(S3 등) 보관 스크립트 필요.

**⑨ AI(Anthropic) 비용 리스크는 낮음** — `AdminQuestionController`가 클래스 레벨 `@PreAuthorize("hasRole('ADMIN')")`으로 보호되어 일반 사용자가 트리거 불가. 별도 조치 불요.

**⑩ `.dockerignore` 부재**(backend/frontend) — 큰 문제는 아니나 빌드 컨텍스트에 불필요 파일 포함 가능(선택 사항).

### 4-4. 양호 확인된 부분
- 비밀키 관리: `.env*`가 `.gitignore`에 모두 등록, git 이력에 커밋된 적 없음, 코드에 하드코딩된 시크릿 없음.
- `ddl-auto: validate`(prod)로 스키마 드리프트 방지 잘 되어 있음.

---

## 5. 필수 환경변수 (`.env`)

`docker-compose.yml` 기준. 실제 값은 서버에서 직접 발급/생성하며 저장소에 커밋하지 않는다.

| 변수 | 설명 | 비고 |
|---|---|---|
| `DB_NAME` / `DB_USERNAME` / `DB_PASSWORD` | PostgreSQL 접속 정보 | 기본값(`tpmp_local_pw`) 그대로 쓰지 말 것 |
| `JWT_SECRET` | JWT 서명 키 | 기본값(`change_me_to_256bit_secret_in_production`) 반드시 교체, 256bit 이상 |
| `TOKEN_ENCRYPTION_KEY` | 토큰 암호화 키 | 기본값 반드시 교체 |
| `ALLOWED_ORIGINS` | CORS 허용 origin | 실제 도메인으로 설정 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_OAUTH2_REDIRECT_URI` | Google OAuth2 | 사용 시 실제 값 필요 |
| `NOTION_CLIENT_ID` / `NOTION_CLIENT_SECRET` / `NOTION_REDIRECT_URI` | Notion 연동 | 사용 시 실제 값 필요 |
| `ANTHROPIC_API_KEY` | Claude API 키 | §2 변동비 주의 참고 |
| `NEXT_PUBLIC_API_URL` | 프론트가 호출할 API 베이스 URL | 실제 도메인 기준으로 설정 |

---

## 관련 문서
- [`docs/db-guidelines.md`](db-guidelines.md) — DB 컨벤션, del_yn/use_yn 정책
- [`docs/db-migration/`](db-migration) — 마이그레이션 파일 34개 (순서대로 적용)
- [`docs/sql/README.md`](sql/README.md) — 콘텐츠 데이터 덤프 및 로드 순서
- [`docs/security.md`](security.md) — 보안 정책 전반
