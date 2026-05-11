# DB 스키마 변경 & 데이터 보존 가이드

> **대상**: Docker Compose 기반 로컬/운영 환경  
> **스택**: Spring Boot 3.3 · JPA/Hibernate · PostgreSQL 15 · Docker

---

## 1. 문제 정의

현재 구조에서 `docker compose down -v` 또는 볼륨 수동 삭제를 하면 `postgres_data` 볼륨이 통째로 사라진다.

```
docker compose down -v   ← 이것이 데이터를 날린다
docker volume rm tpmp_postgres_data
```

Docker 프로필(`application-docker.yml`)은 `ddl-auto: validate`로 설정되어 있어,  
Hibernate가 엔티티와 실제 DB 스키마를 비교해 **불일치 시 기동 자체가 실패**한다.  
이 때문에 "볼륨 삭제 후 재빌드"가 관행처럼 굳어졌지만, 운영 데이터가 있는 상황에서는 절대 금지다.

---

## 2. 핵심 원칙

| 상황 | 올바른 명령 | 금지 명령 |
|------|------------|----------|
| 코드만 재빌드 | `docker compose up -d --build backend` | `docker compose down -v` |
| 전체 재기동 (DB 유지) | `docker compose down` → `docker compose up -d` | `docker compose down -v` |
| 완전 초기화 (개발 환경만) | `docker compose down -v` | 운영 환경에서 사용 금지 |

**볼륨은 건드리지 않는다. 스키마는 코드로 변경한다.**

---

## 3. 방법 A — DataInitializer DDL 패턴 (지금 바로 사용 가능)

### 개요

프로젝트는 이미 `DataInitializer.java`에서 JdbcTemplate으로 DDL을 실행하고 있다.  
`fixAnswerNullable()`, `fixQuestionTypeConstraints()` 등이 이 패턴의 실제 예시다.  
이 방식을 확장하면 Flyway 없이도 스키마를 안전하게 변경할 수 있다.

### 신규 컬럼 추가 예시

```java
// DataInitializer.java에 메서드 추가
private void addColumnIfNotExists(String table, String column, String definition) {
    try {
        jdbcTemplate.execute(
            "ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS " + column + " " + definition
        );
        log.info("[DataInitializer] {}.{} 컬럼 추가 완료", table, column);
    } catch (Exception e) {
        log.debug("[DataInitializer] {}.{} 컬럼 이미 존재 또는 추가 불필요: {}", table, column, e.getMessage());
    }
}

// run()에서 호출
@Override
public void run(ApplicationArguments args) {
    // ... 기존 호출 ...
    addColumnIfNotExists("users", "phone_number", "VARCHAR(20)");
    addColumnIfNotExists("questions", "difficulty", "VARCHAR(20) DEFAULT 'MEDIUM'");
}
```

### 신규 테이블 추가 예시

```java
private void createTableIfNotExists() {
    try {
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS notification (
                id          BIGSERIAL PRIMARY KEY,
                user_id     BIGINT NOT NULL REFERENCES users(id),
                message     TEXT NOT NULL,
                is_read     BOOLEAN DEFAULT FALSE,
                created_at  TIMESTAMP NOT NULL DEFAULT NOW()
            )
        """);
        log.info("[DataInitializer] notification 테이블 생성 완료");
    } catch (Exception e) {
        log.warn("[DataInitializer] notification 테이블 생성 실패: {}", e.getMessage());
    }
}
```

### 핵심 규칙

| 규칙 | 내용 |
|------|------|
| 멱등성 | `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS` 사용 |
| try-catch | 이미 존재하는 경우 무시, 기동은 계속 진행 |
| 순서 | `run()`의 맨 끝에 DDL 호출 배치 (seed 데이터 이후) |
| 제거 금지 | `DROP COLUMN`, `DROP TABLE`은 DataInitializer에 넣지 않음 |

### 적합한 경우

- 신규 컬럼 추가 (nullable 또는 DEFAULT 있는 경우)
- 신규 테이블 추가
- 인덱스 추가
- 제약 조건 변경 (기존 `fixQuestionTypeConstraints` 참고)

---

## 4. 방법 B — Flyway 도입 (권장 장기 방법)

### 개요

DB 스키마 변경을 SQL 파일로 버전 관리한다.  
Git에 마이그레이션 파일이 남아 누가 언제 어떤 변경을 했는지 추적 가능하다.

### 4-1. 의존성 추가

`backend/build.gradle`:

```groovy
dependencies {
    // 기존 의존성 유지 ...

    // Flyway (Spring Boot 3.x + PostgreSQL)
    implementation 'org.flywaydb:flyway-core'
    runtimeOnly 'org.flywaydb:flyway-database-postgresql'
}
```

### 4-2. application.yml 변경

**`application-docker.yml`** (운영용):
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none        # Flyway가 스키마를 관리하므로 none으로 변경

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true   # 기존 DB에 Flyway를 처음 도입할 때 필수
    baseline-version: 1         # V1을 baseline으로 간주 (기존 DB에 V1은 실행 안 함)
```

**`application.yml`** (local 프로필):
```yaml
# local 프로필에서는 ddl-auto: update를 유지하거나
# Flyway를 동일하게 적용할 수 있음
spring:
  jpa:
    hibernate:
      ddl-auto: none
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
    baseline-version: 1
```

### 4-3. 마이그레이션 파일 위치

```
backend/src/main/resources/
└── db/
    └── migration/
        ├── V1__Initial_schema.sql    ← 기존 전체 스키마 덤프 (baseline)
        ├── V2__Add_notification.sql
        ├── V3__Add_difficulty_column.sql
        └── V4__...
```

### 4-4. V1 베이스라인 만들기 (기존 DB 도입 시)

현재 실행 중인 DB에서 스키마를 덤프해 V1 파일을 생성한다.

```powershell
# 실행 중인 DB 컨테이너에서 스키마만 덤프 (데이터 제외)
docker exec tpmp-db pg_dump -U tpmp --schema-only tpmp > V1__Initial_schema.sql

# 또는 데이터까지 포함한 전체 덤프
docker exec tpmp-db pg_dump -U tpmp tpmp > V1__Initial_schema.sql
```

생성된 파일을 `backend/src/main/resources/db/migration/V1__Initial_schema.sql`에 배치한다.

**중요**: 기존 DB에서는 `baseline-on-migrate: true`가 V1을 실행하지 않고 현재 상태를 V1으로 표시한다.  
신규 DB(빈 DB)에서는 V1부터 순서대로 모두 실행한다.

### 4-5. 신규 변경 작업 흐름

```
1. 엔티티 수정 (예: User.java에 phoneNumber 필드 추가)
2. 마이그레이션 파일 생성:
   backend/src/main/resources/db/migration/V2__Add_phone_number_to_users.sql
3. SQL 작성:
   ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
4. 로컬 재기동 → Flyway가 V2 자동 적용
5. docker compose up -d --build backend → 운영에서도 V2 자동 적용
```

### 파일명 규칙

```
V{버전}__{설명}.sql

예시:
V2__Add_notification_table.sql
V3__Add_difficulty_column_to_questions.sql
V4__Create_index_on_exam_created_at.sql
```

- 버전은 정수로 순차 증가 (V1, V2, V3 ...)
- 설명은 스네이크케이스, 무엇을 했는지 명시
- **한 번 커밋된 파일은 절대 수정하지 않는다** (Flyway가 체크섬으로 검증)

---

## 5. 방법 C — 볼륨 백업/복구 (완전 재구축 또는 긴급 상황)

개발 환경에서 어쩔 수 없이 볼륨을 날려야 할 때, 혹은 운영 데이터를 다른 서버로 이전할 때 사용한다.

### 백업

```powershell
# DB가 실행 중인 상태에서 전체 덤프
docker exec tpmp-db pg_dump -U tpmp tpmp > backup_$(Get-Date -Format 'yyyyMMdd_HHmm').sql

# 확인
Get-Item backup_*.sql
```

### 볼륨 삭제 + 재구축

```powershell
# 1. 백업 먼저 (위 명령 실행)
# 2. 컨테이너 + 볼륨 삭제
docker compose down -v

# 3. 재빌드 & 기동
docker compose up -d --build

# 4. DB가 준비될 때까지 대기 (healthcheck 통과 후)
Start-Sleep -Seconds 15

# 5. 복구
Get-Content backup_20240101_1200.sql | docker exec -i tpmp-db psql -U tpmp tpmp
```

### 복구 확인

```powershell
docker exec tpmp-db psql -U tpmp tpmp -c "\dt"    # 테이블 목록
docker exec tpmp-db psql -U tpmp tpmp -c "SELECT COUNT(*) FROM users;"
```

---

## 6. 상황별 처리 가이드

### 신규 엔티티(테이블) 추가

```
DataInitializer (방법 A):
  → createTableIfNotExists() 메서드 추가, run() 끝에 호출

Flyway (방법 B):
  → V{N}__Create_{table_name}_table.sql 작성
  → CREATE TABLE IF NOT EXISTS 사용

ddl-auto: update (local 개발만):
  → 엔티티 추가하면 자동 생성
  → docker 환경에는 적용 안 됨
```

### 기존 테이블에 컬럼 추가 (nullable 또는 DEFAULT)

```
DataInitializer (방법 A):
  → addColumnIfNotExists("테이블", "컬럼", "TYPE DEFAULT 값") 호출

Flyway (방법 B):
  → ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {type} DEFAULT {val};
```

### 기존 테이블에 NOT NULL 컬럼 추가

```
반드시 2단계로 처리:
  1. nullable로 추가:   ALTER TABLE t ADD COLUMN col VARCHAR(50);
  2. 기존 행 채우기:   UPDATE t SET col = '기본값' WHERE col IS NULL;
  3. NOT NULL 적용:    ALTER TABLE t ALTER COLUMN col SET NOT NULL;

한 번에 NOT NULL 추가하면 기존 행 때문에 실패함.
```

### 컬럼 타입 변경

```sql
-- 호환 타입 변경 (VARCHAR 길이 확장 등)
ALTER TABLE t ALTER COLUMN col TYPE VARCHAR(500);

-- 비호환 타입 변경은 USING으로 명시적 캐스트 필요
ALTER TABLE t ALTER COLUMN col TYPE BIGINT USING col::BIGINT;
```

### 컬럼/테이블 제거

```
DataInitializer에 넣지 않는다.
Flyway 사용 시에만 DROP을 파일에 작성.
운영 적용 전 반드시 백업 필수.

V{N}__Drop_deprecated_column.sql:
  ALTER TABLE t DROP COLUMN IF EXISTS old_col;
```

### 인덱스 추가 (운영 중 락 없이)

```sql
-- 운영 중 락 없이 인덱스 생성 (시간이 걸리지만 서비스 중단 없음)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
```

---

## 7. Docker 재빌드 시 데이터 보존 명령어 정리

### 코드만 변경 → 백엔드만 재빌드

```powershell
# DB는 그대로, 백엔드 이미지만 재빌드 후 재기동
docker compose up -d --build backend
```

### 전체 이미지 재빌드 (DB 볼륨 유지)

```powershell
# 컨테이너 중지 (볼륨 보존)
docker compose down

# 전체 재빌드 & 기동
docker compose up -d --build
```

### 프론트엔드만 변경

```powershell
docker compose up -d --build frontend
```

### 완전 초기화 (개발 환경, 데이터 포기)

```powershell
# 경고: 모든 DB 데이터 삭제됨
docker compose down -v
docker compose up -d --build
```

---

## 8. 권장 도입 순서

```
현재 상태
  └─ ddl-auto: update (local) / validate (docker)
  └─ DataInitializer로 일부 DDL 처리

단기 (지금 바로)
  └─ DataInitializer DDL 패턴 확장 사용
  └─ "docker compose down -v" 대신 "docker compose down" 습관화
  └─ 변경 전 pg_dump 백업 습관화

중기 (Flyway 도입)
  └─ build.gradle에 flyway 의존성 추가
  └─ 현재 스키마로 V1__Initial_schema.sql 생성
  └─ ddl-auto: none으로 변경
  └─ 이후 모든 스키마 변경은 V{N}__.sql 파일로 관리
  └─ DataInitializer DDL 메서드는 Flyway 파일로 점진적 이관
```

---

## 9. 자주 쓰는 명령어 치트시트

```powershell
# DB 접속
docker exec -it tpmp-db psql -U tpmp tpmp

# 테이블 목록
docker exec tpmp-db psql -U tpmp tpmp -c "\dt"

# 특정 테이블 컬럼 확인
docker exec tpmp-db psql -U tpmp tpmp -c "\d users"

# 전체 백업
docker exec tpmp-db pg_dump -U tpmp tpmp > backup.sql

# 스키마만 백업 (데이터 제외)
docker exec tpmp-db pg_dump -U tpmp --schema-only tpmp > schema.sql

# 백업 복구
Get-Content backup.sql | docker exec -i tpmp-db psql -U tpmp tpmp

# 볼륨 목록 확인
docker volume ls | Select-String tpmp

# 볼륨 삭제 없이 컨테이너만 삭제
docker compose down

# 백엔드만 재빌드
docker compose up -d --build backend

# DataInitializer 로그 확인
docker logs tpmp-backend 2>&1 | Select-String "DataInitializer"
```
