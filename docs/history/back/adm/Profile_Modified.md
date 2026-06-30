## HIST-20260701-001

- **날짜**: 2026-07-01
- **수정 범위**: 인프라 / Spring 프로파일 분리 + Docker Compose base+override 재구성
- **수정 개요**: Spring 프로파일을 local/dev/prod로 완전 분리하고, application-docker.yml 삭제, docker-compose를 base+override 구조로 재구성, .env 템플릿 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/resources/application.yml` | 수정 | 공통 섹션만 남김. local 블록 제거. 시크릿 4종(JWT_SECRET, TOKEN_ENCRYPTION_KEY, ANTHROPIC_API_KEY, DB_PASSWORD) 기본값 제거하여 dev/prod fast-fail 보장 |
| `backend/src/main/resources/application-local.yml` | 추가 | local 전용 오버라이드. JWT_SECRET/TOKEN_ENCRYPTION_KEY/DB_PASSWORD fallback 기본값 포함. AI provider=ollama 기본 |
| `backend/src/main/resources/application-dev.yml` | 추가 | dev 전용. ddl-auto=update, show-sql=false, DEBUG 로그, AI provider=anthropic |
| `backend/src/main/resources/application-prod.yml` | 추가 | prod 전용. ddl-auto=validate, WARN SQL 로그, ANTHROPIC_MODEL=claude-sonnet-4-6 |
| `backend/src/main/resources/application-docker.yml` | 삭제 | docker 프로파일 폐기. dev/prod override로 대체 |
| `docker-compose.yml` | 수정 | base 파일로 재정의. SPRING_PROFILES_ACTIVE 제거, 누락 env 6종 추가(ANTHROPIC_API_KEY/MODEL, AI_PROVIDER, NOTION_SUCCESS/FAILURE_REDIRECT, DB_USERNAME/DB_NAME env화), POSTGRES_DB/USER도 env화 |
| `docker-compose.dev.yml` | 추가 | override: backend에 SPRING_PROFILES_ACTIVE=dev 주입 |
| `docker-compose.prod.yml` | 추가 | override: backend에 SPRING_PROFILES_ACTIVE=prod, restart=always, ANTHROPIC_MODEL=claude-sonnet-4-6 기본 |
| `docker-compose.local.yml` | 추가 | 독립 파일. DB(Postgres) 서비스만 정의. 로컬 개발 시 DB만 컨테이너로 띄우는 용도 |
| `.env.dev.example` | 추가 | dev 환경 변수 템플릿. 더미/예시값 포함, git 커밋 대상 |
| `.env.prod.example` | 추가 | prod 환경 변수 템플릿. 시크릿 빈 플레이스홀더, git 커밋 대상 |
| `.gitignore` | 수정 | `.env.dev`, `.env.prod` 추가 (`.env.*.example`은 제외하지 않음) |

### 수정 상세

#### `backend/src/main/resources/application.yml`
- 변경 전: local 프로파일 블록(`---` 구분)이 공통 파일에 혼재. `format_sql: true`, `com.tpmp: DEBUG` 등 local 전용 설정이 공통 섹션에 포함. 시크릿 일부(`ANTHROPIC_API_KEY:`)에 빈 문자열 기본값 존재
- 변경 후: 공통 섹션만 유지. `format_sql: false`, `com.tpmp: INFO`로 변경. 시크릿 4종 기본값 없이(`${VAR}`) 선언하여 dev/prod 누락 시 fast-fail. datasource 섹션을 공통으로 이동(DB_HOST/PORT/NAME/USERNAME env 변수화)
- 이유: 프로파일별 설정이 한 파일에 혼재하여 관리 어려움. 각 환경 파일로 분리하면 추적과 변경이 명확해짐

#### `backend/src/main/resources/application-local.yml` (신규)
- 변경 전: 없음
- 변경 후: `spring.datasource.url` localhost 고정, `ddl-auto: update`, `show-sql: true`, `com.tpmp: DEBUG`, JWT/TOKEN_ENCRYPTION_KEY/DB_PASSWORD fallback 기본값 포함, `ai.provider: ollama` 기본
- 이유: 개발자 PC는 환경변수 없이 기동 가능해야 함. ollama 기본으로 anthropic API key 없이도 AI 기능 동작

#### `backend/src/main/resources/application-dev.yml` (신규)
- 변경 전: 없음
- 변경 후: `ddl-auto: update`, `show-sql: false`, DEBUG 로그, `ai.provider: anthropic` 기본
- 이유: 개발 서버는 스키마 자동 업데이트 허용, SQL 로그는 끄되 애플리케이션 DEBUG는 유지

#### `backend/src/main/resources/application-prod.yml` (신규)
- 변경 전: 없음
- 변경 후: `ddl-auto: validate`, `org.hibernate.SQL: WARN`, `ANTHROPIC_MODEL: claude-sonnet-4-6` 기본
- 이유: 프로덕션은 스키마 검증만, SQL 로그 최소화, 성능 모델 사용

#### `backend/src/main/resources/application-docker.yml` (삭제)
- 변경 전: docker 프로파일 전용 datasource/jpa/app 설정 포함
- 변경 후: 파일 삭제
- 이유: docker 프로파일 대신 dev/prod 프로파일로 대체. docker-compose override에서 SPRING_PROFILES_ACTIVE=dev|prod를 주입

#### `docker-compose.yml` (base 재정의)
- 변경 전: `SPRING_PROFILES_ACTIVE: docker` 고정, DB_NAME/DB_USERNAME 하드코딩, ANTHROPIC_API_KEY 등 누락
- 변경 후: SPRING_PROFILES_ACTIVE 제거(override에서 주입), DB_NAME/DB_USERNAME env화, 누락 env 6종 추가
- 이유: base 파일은 override 없이 단독 실행 금지. 공통 인프라 구조만 정의하고 프로파일은 override에 위임

#### `docker-compose.dev.yml` / `docker-compose.prod.yml` (신규)
- 변경 전: 없음
- 변경 후: dev → `SPRING_PROFILES_ACTIVE: dev`. prod → `SPRING_PROFILES_ACTIVE: prod`, `restart: always`, `ANTHROPIC_MODEL: claude-sonnet-4-6`
- 이유: 환경별 최소 차이점만 override 파일에 정의

#### `docker-compose.local.yml` (신규)
- 변경 전: 없음
- 변경 후: DB 서비스만 정의(`postgres_data_local` 볼륨 사용). 포트 5432.
- 이유: 로컬 개발 시 `docker-compose -f docker-compose.local.yml up -d`로 DB만 컨테이너로 실행하고 backend는 IntelliJ/gradle로 기동하는 패턴 지원

#### `.gitignore`
- 변경 전: `.env`, `.env.local`, `.env.*.local` 3종
- 변경 후: `.env.dev`, `.env.prod` 2종 추가 (`.env.*.example`은 커밋 대상이므로 제외하지 않음)
- 이유: 실제 시크릿이 담긴 파일이 git에 올라가지 않도록 방지

### 복원 방법
이 ID(HIST-20260701-001)만으로 복원 시:
1. `backend/src/main/resources/application.yml` 을 이 항목의 "변경 전" 상태(local 블록 포함, 시크릿 빈 기본값 포함)로 되돌린다.
2. `application-local.yml`, `application-dev.yml`, `application-prod.yml` 삭제
3. `application-docker.yml` 재생성 (변경 전 내용으로)
4. `docker-compose.yml`에 `SPRING_PROFILES_ACTIVE: docker` 복원, DB_NAME/DB_USERNAME 하드코딩으로 복원, 추가된 env 제거
5. `docker-compose.dev.yml`, `docker-compose.prod.yml`, `docker-compose.local.yml` 삭제
6. `.env.dev.example`, `.env.prod.example` 삭제
7. `.gitignore`에서 `.env.dev`, `.env.prod` 제거
