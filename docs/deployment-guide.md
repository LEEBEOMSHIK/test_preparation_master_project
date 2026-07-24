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

**가성비 도메인 등록 사이트**

| 등록처 | 유형 | .com 기준 비용 | 특징 |
|---|---|---|---|
| **Cloudflare Registrar** | 해외 | 약 $10.44/년(~1만 4천원대) | 등록가=원가(마진 0%), **갱신가 인상 없음** — 총소유비용이 가장 낮음. DNS도 Cloudflare로 관리하게 됨(무료 CDN·프록시 겸용). 단, `.kr`/`.co.kr` 등 일부 ccTLD는 취급하지 않을 수 있어 원하는 확장자 지원 여부를 등록 전 확인 필요 |
| **Porkbun** | 해외 | 약 $11.06/년 | 첫해뿐 아니라 **평생 동일가(플랫 프라이싱)**, WHOIS 프라이버시 무료, UI가 Cloudflare보다 직관적 |
| **Namecheap** | 해외 | 첫해 ~$5.98, 갱신 ~$13.98 | 첫해는 가장 싸지만 **갱신가가 크게 오름** — 1년만 쓰고 옮길 게 아니면 총비용은 위 두 곳보다 비쌈 |
| **가비아** | 국내 | .com 19,800원 / .kr·.co.kr 16,500원(첫해 할인가) | 원화 결제·국내 지원 편리, `.kr` 계열은 국내 업체가 사실상 유일한 선택지에 가까움. 갱신가는 첫해보다 높아지니 확인 필요 |
| **호스팅케이알** | 국내 | 가비아보다 저렴한 편 | 국내 업체 중 가격 경쟁력 좋음, 관리 UI는 가비아보다 단순 |

**추천**
- **`.com` + Cloudflare Registrar 또는 Porkbun**: 개인 사이드 프로젝트 기준 총소유비용이 가장 낮고, 해외 카드 결제만 가능하면 진입장벽도 낮다. 둘 다 갱신가가 뛰지 않아 장기 운영에 유리하다(Namecheap은 첫해 미끼가로 갱신가 인상되니 지양).
- **`.kr`/`.co.kr`을 원하면**: 국내 업체(가비아 등)로 등록해야 한다 — 한국 서비스라는 신뢰감은 주지만 `.com`보다 연간 비용이 비슷하거나 약간 높고, 국내 사업자만 등록 가능한 제약이 있을 수 있으니 가비아 등에서 등록 전 본인 인증 요건을 확인한다.
- 도메인 이름 자체는 서비스명(TPMP 등)을 그대로 쓰거나 축약해 짧게 가져가는 편이 타이핑·기억에 유리하다(예시일 뿐 최종 이름은 사용자가 결정).

**HTTPS**
- **Let's Encrypt(certbot)로 무료 발급 가능** — 단, 현재 `nginx/nginx.conf`에 SSL 설정이 전혀 없어 별도 작업 필요(§4-1 ② 참고, 도메인 확보 후 진행)

### 변동비 주의 — Claude API
`ANTHROPIC_API_KEY`로 서버가 실제 Claude API를 호출하는 기능이 있음. 호스팅비와 별개로 **사용량에 비례해 계속 과금**되므로, 트래픽이 늘면 이쪽이 주 비용이 될 수 있다. 현재는 `AdminQuestionController`가 `@PreAuthorize("hasRole('ADMIN')")`으로 보호되어 있어 일반 사용자가 트리거할 수 없는 구조라 당장 리스크는 낮음(§4-3 참고).

---

## 3. 배포 전 준비사항 체크리스트

### 코드/설정 준비 (완료)
- [x] §4-1 치명적 항목 중 코드로 해결 가능한 2건(① DB 포트 노출, ③ backend/frontend 포트 노출) 수정 완료
- [x] §4-2 중요 항목 3건(④ Swagger 비활성화, ⑤ 업로드 확장자 화이트리스트, ⑥ actuator 노출 축소) 수정 완료
- [x] §4-3 참고 항목 중 ⑦ 로그인 rate limiting, ⑧ DB 백업/복구 스크립트, ⑩ `.dockerignore` 수정 완료

### 실제 배포 시 수행할 것 (미착수 — 서버·도메인 준비 전이라 아직 진행 불가)
- [ ] Oracle Cloud(또는 VPS) 인스턴스 발급
- [ ] 도메인 구매(§2 가성비 도메인 참고) + DNS A레코드를 서버 IP로 연결
- [ ] 서버에 Docker + Docker Compose 설치
- [ ] `.env` 파일 작성 (아래 §5 필수 환경변수 참고, `.env`는 git에 커밋하지 않음 — 이미 `.gitignore` 등록 확인됨)
- [ ] `docs/db-migration/*.sql` **34개 파일을 파일명 순서대로** 신규 DB에 적용
- [ ] `docs/sql/tpmp_content_data.sql` 적용 (콘텐츠 시드 데이터 — `docs/sql/README.md`의 "마이그레이션 먼저, 콘텐츠 덤프 나중" 순서 준수)
- [ ] §4-1 ② HTTPS: Let's Encrypt 인증서 발급 + nginx 443 설정(도메인 확보 후 진행)
- [ ] §6 참고해 `scripts/backup-db.sh` crontab 자동 실행 등록
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

**④ (완료) Swagger/OpenAPI 문서가 프로덕션에서도 인증 없이 공개됨**
`SecurityConfig.java:55` `/api/v3/api-docs/**`, `/api/swagger-ui/**`가 permitAll이고 `application-prod.yml`에 비활성화 설정 없음 → 전체 API 스펙(엔드포인트·DTO 구조)이 공개 노출.
→ 수정: `application-prod.yml`에 `springdoc.api-docs.enabled: false` / `swagger-ui.enabled: false` 추가. (base `application.yml`은 그대로 두어 local/개발 프로필은 Swagger 계속 사용 가능. `docs/history/back/adm/ServerConfig_Modified.md` HIST-20260724-001)

**⑤ (완료) 파일 업로드 확장자 화이트리스트 미검증** (CLAUDE.md 정책 위반)
`AttachmentService.java:36-45` — MIME 타입만 클라이언트 `Content-Type` 헤더로 검사(스푸핑 가능)하고, 저장 확장자는 원본 파일명에서 그대로 추출(화이트리스트 없음). `/uploads/**`가 permitAll로 정적 서빙되므로, `evil.svg`를 `image/jpeg`로 위장 업로드 시 stored XSS 벡터가 될 수 있음.
→ 수정: 확장자 화이트리스트(jpg/jpeg/png/gif/webp) 추가 검증(MIME 검사는 기존대로 병행 유지). `docs/history/back/adm/AdminAttachment_Modified.md` HIST-20260724-001

**⑥ (완료) actuator 전체가 permitAll**
`SecurityConfig.java:54` — 현재 `exposure.include: health`뿐이라 당장은 안전하지만, 향후 디버깅 목적으로 exposure를 넓히면 즉시 무방비 공개됨.
→ 수정: `/api/actuator/health`만 permitAll하고 나머지는 `anyRequest().authenticated()`로 인증 요구(docker-compose healthcheck 경로와 동일함을 확인). `docs/history/back/adm/ServerConfig_Modified.md` HIST-20260724-001

### 4-3. 참고 (배포 직후 필수는 아님)

**⑦ (완료) 로그인 rate limiting 없음** — 무차별 대입 방어 없음. 배포 직후 필수는 아니나 조기 권장.
→ 수정: `POST /api/auth/login`에 IP 기준 5분/5회 고정 윈도우 rate limiting 추가(인메모리 `ConcurrentHashMap`, 단일 VM 배포 전제로 Redis 미도입). 초과 시 자격증명 검사 없이 즉시 429 반환. `docs/history/back/usr/Auth_Modified.md` HIST-20260724-001

**⑧ (완료) 프로덕션 DB 백업 전략 부재** — `docs/sql`은 마이그레이션용 콘텐츠 덤프이지 운영 자동 백업이 아님. 단일 VM + Docker named volume(`postgres_data`) 구조라 VM 손실 시 데이터 전체 유실.
→ 수정: `scripts/backup-db.sh`(pg_dump + gzip 압축, 로컬 14일 보관 정책, `BACKUP_REMOTE_UPLOAD_CMD` 환경변수로 임의 원격 업로드 명령 주입 가능) / `scripts/restore-db.sh`(대화형 확인 프롬프트, `-y`/`--yes`로 생략 가능) 신규 작성. crontab 자동 실행 예시와 상세 사용법은 §6 참고.

**⑨ AI(Anthropic) 비용 리스크는 낮음** — `AdminQuestionController`가 클래스 레벨 `@PreAuthorize("hasRole('ADMIN')")`으로 보호되어 일반 사용자가 트리거 불가. 별도 조치 불요.

**⑩ (완료) `.dockerignore` 부재**(backend/frontend) — 큰 문제는 아니나 빌드 컨텍스트에 불필요 파일 포함 가능(선택 사항).
→ 수정: `backend/.dockerignore`(build/·.gradle/·bin/·logs/·uploads/·*.class·*.jar(gradle-wrapper.jar 예외)·.env* 등 제외, src/test/는 `./gradlew bootJar` 컴파일에 필요해 유지) / `frontend/.dockerignore`(node_modules/·.next/·out/·build/·.env*.local·coverage/ 등 제외) 신규 작성.

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

## 6. DB 백업/복구

`postgres_data` named volume은 VM 자체에 종속되므로, VM이 사라지면(디스크 장애, 실수로 인스턴스 삭제 등) 데이터가 함께 사라진다. 이를 대비해 `scripts/backup-db.sh` / `scripts/restore-db.sh`를 준비했다.

### 6-1. 백업 (`scripts/backup-db.sh`)

```bash
chmod +x scripts/backup-db.sh scripts/restore-db.sh
./scripts/backup-db.sh
```

- `docker exec tpmp-db pg_dump`로 덤프한 뒤 gzip 압축해 `backups/tpmp_YYYYMMDD_HHMMSS.sql.gz`로 저장한다(저장소 루트 기준, `BACKUP_DIR` 환경변수로 변경 가능).
- 실행할 때마다 `BACKUP_RETENTION_DAYS`(기본 14일)를 초과한 로컬 백업 파일을 자동 삭제한다.
- `backups/`는 `.gitignore`에 등록되어 있어 커밋되지 않는다.
- 컨테이너명/DB명/유저명은 각각 `DB_CONTAINER_NAME`/`DB_NAME`/`DB_USERNAME` 환경변수로 오버라이드 가능(기본값은 `docker-compose.yml`과 동일하게 `tpmp-db`/`tpmp`/`tpmp`).

**원격 업로드(선택 사항).** 외부 오브젝트 스토리지(S3, Backblaze B2, rclone이 지원하는 임의 원격지 등) 계정이 준비되면, 벤더에 상관없이 `BACKUP_REMOTE_UPLOAD_CMD` 환경변수에 업로드 명령 전체를 넣으면 백업 직후 자동 실행된다. 백업 파일 경로는 그 명령 안에서 `$BACKUP_FILE`로 참조한다.

```bash
# 예: AWS S3
export BACKUP_REMOTE_UPLOAD_CMD='aws s3 cp "$BACKUP_FILE" s3://my-bucket/tpmp-backups/'
# 예: rclone (임의 원격지)
export BACKUP_REMOTE_UPLOAD_CMD='rclone copy "$BACKUP_FILE" remote:tpmp-backups/'
./scripts/backup-db.sh
```

`BACKUP_REMOTE_UPLOAD_CMD`가 설정되지 않으면 "원격 업로드 미설정 — 로컬 백업만 수행" 로그만 남기고 정상 종료한다(실패로 취급하지 않음). 스토리지 계정이 정해지면 서버의 crontab 환경(아래 6-3)에 이 환경변수를 등록하면 된다.

### 6-2. 복구 (`scripts/restore-db.sh`)

```bash
./scripts/restore-db.sh backups/tpmp_20260724_030000.sql.gz
```

- **되돌릴 수 없는 파괴적 작업이다** — 대상 DB(`tpmp-db` 컨테이너)의 기존 데이터를 덮어쓴다. 실행 시 `yes` 입력을 요구하는 확인 프롬프트가 뜬다.
- 자동화 파이프라인 등 확인 프롬프트를 생략해야 하면 `-y`/`--yes` 플래그를 붙인다: `./scripts/restore-db.sh -y backups/tpmp_20260724_030000.sql.gz`
- 내부적으로 gzip 압축을 해제한 뒤 `docker exec -i tpmp-db psql`로 복원한다.
- 컨테이너명/DB명/유저명 오버라이드는 백업 스크립트와 동일하게 `DB_CONTAINER_NAME`/`DB_NAME`/`DB_USERNAME` 환경변수를 사용한다.

### 6-3. 자동 실행 (crontab)

서버에 매일 새벽 자동 백업을 등록하려면:

```bash
crontab -e
# 아래 줄 추가 (매일 새벽 3시 실행, 로그는 /var/log/tpmp-backup.log에 누적)
0 3 * * * /path/to/scripts/backup-db.sh >> /var/log/tpmp-backup.log 2>&1
```

원격 업로드를 crontab에서도 사용하려면 `BACKUP_REMOTE_UPLOAD_CMD` 등 환경변수를 crontab 상단에 함께 선언하거나, 이 값들을 export하는 wrapper 스크립트를 만들어 그 wrapper를 cron에 등록한다(cron은 로그인 쉘의 환경변수를 상속하지 않음에 유의).

---

## 관련 문서
- [`docs/db-guidelines.md`](db-guidelines.md) — DB 컨벤션, del_yn/use_yn 정책
- [`docs/db-migration/`](db-migration) — 마이그레이션 파일 34개 (순서대로 적용)
- [`docs/sql/README.md`](sql/README.md) — 콘텐츠 데이터 덤프 및 로드 순서
- [`docs/security.md`](security.md) — 보안 정책 전반
