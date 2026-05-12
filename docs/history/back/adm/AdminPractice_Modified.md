## HIST-20260512-006

- **날짜**: 2026-05-12
- **수정 범위**: 관리자 백엔드 / 연습장
- **수정 개요**: 방언 변환 규칙 DB 관리 기능 추가 — 엔티티·Seeder 신규, AdminPracticeController에 변환 규칙 조회·토글 API 추가, PracticeService 변환 로직 DB 기반으로 전환

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../entity/DialectConversionRule.java` | 추가 | `dialect_conversion_rules` 테이블 엔티티 |
| `backend/.../repository/DialectConversionRuleRepository.java` | 추가 | 변환 규칙 CRUD Repository |
| `backend/.../service/PracticeDataSeeder.java` | 추가 | 앱 기동 시 초기 변환 규칙 DB 삽입 (`@PostConstruct`) |
| `backend/.../service/PracticeService.java` | 수정 | `enabledRuleKeys` 캐시 추가, `translateMysql/Oracle()` 파라미터에 `enabledKeys` 추가, DELIMITER 처리 규칙 비활성화 분기 추가, `oracle_modify` 비활성화 시 `resolveRestartWith` 생략 |
| `backend/.../controller/AdminPracticeController.java` | 수정 | `conversionRuleRepository`, `practiceService` 주입; `GET /rules` 응답에 `mysqlConversionRules`, `oracleConversionRules` 추가; `PATCH /conversion-rules/{id}/toggle` 신규 엔드포인트; `ConversionRuleDto`, `PracticeRulesResponse.of()` 추가 |

### 수정 상세

#### `DialectConversionRule.java`
- 필드: `id`, `dialect`(mysql/oracle), `ruleKey`, `adminLabel`, `userLabel`, `enabled`, `displayOrder`, `complex`
- `toggle()` 메서드로 `enabled` 반전

#### `PracticeDataSeeder.java`
- MySQL 5개 규칙: `mysql_auto_increment`, `mysql_datatypes`, `mysql_delimiter`, `mysql_procedure`, `mysql_trigger`
- Oracle 5개 규칙: `oracle_datatypes`, `oracle_dual`, `oracle_modify`, `oracle_procedure`, `oracle_trigger`
- `repo.count() > 0`이면 삽입 생략 (멱등)

#### `PracticeService.java`
- `enabledRuleKeys` volatile 필드 + double-checked locking 초기화
- `refreshRuleCache()` — 토글 후 AdminController에서 호출
- `translateToPostgres(sql, dialect, enabledKeys)` — enabledKeys 파라미터 추가
- `translateMysql/Oracle()` — 각 변환 블록에 `enabledKeys.contains(ruleKey)` 조건 추가

#### `AdminPracticeController.java`
- `GET /rules` — `PracticeRulesResponse.of(mysql, oracle)` 형태로 변환 규칙 포함
- `PATCH /conversion-rules/{id}/toggle` — 토글 후 `practiceService.refreshRuleCache()` 호출
- `ConversionRuleDto` record 추가

### 복원 방법

HIST-20260512-006 복원 시:
- `DialectConversionRule.java`, `DialectConversionRuleRepository.java`, `PracticeDataSeeder.java` 삭제
- `PracticeService.java` — `conversionRuleRepository` 주입 제거, `enabledRuleKeys` 캐시 제거, `translateMysql/Oracle()` 원래 하드코딩 방식으로 복원, `translateToPostgres(sql, dialect)` 2-파라미터로 복원
- `AdminPracticeController.java` — `conversionRuleRepository`, `practiceService` 주입 제거, `PATCH toggle` 엔드포인트 제거, `getRules()` → `PracticeRulesResponse.defaults()` 복원, `ConversionRuleDto` 제거
- DB: `DROP TABLE IF EXISTS dialect_conversion_rules`

---

## HIST-20260512-005

- **날짜**: 2026-05-12
- **수정 범위**: 관리자 백엔드 / 연습장
- **수정 개요**: 기록 조회 JPQL null 파라미터 타입 오류 수정 — Specification(Criteria API)으로 교체

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../repository/PracticeHistoryRepository.java` | 수정 | `JpaSpecificationExecutor` 추가, JPQL `findWithFilters` 제거 |
| `backend/.../controller/AdminPracticeController.java` | 수정 | 동적 `Specification` 빌드로 교체, `PageRequest`에 `Sort` 명시 |

### 원인 분석

```
ERROR: function lower(bytea) does not exist
```

Hibernate 6이 null String 파라미터의 JDBC 타입을 추론하지 못하여 PostgreSQL에 `bytea`로 바인딩.
`lower(bytea)` 함수가 존재하지 않아 SQL 오류 발생.

JPQL `@Query`의 `(:param IS NULL OR LOWER(col) LIKE LOWER('%'||:param||'%'))` 패턴에서,
`:param`이 null일 때 Hibernate 6 SQM이 타입 정보 없이 파라미터를 바인딩하여 발생.

### 수정 상세

#### `PracticeHistoryRepository.java`
- 변경 전: JPQL `@Query findWithFilters` + `JpaRepository`만 상속
- 변경 후: `JpaSpecificationExecutor<PracticeHistory>` 추가 상속; `findWithFilters` 삭제

#### `AdminPracticeController.java`
- 변경 전: `findWithFilters(emailParam, sqlParam, typeParam, dialectParam, startDate, endDate, pageable)` 단일 JPQL 호출
- 변경 후: `Specification<PracticeHistory>`를 동적으로 빌드 — 각 필터가 null이 아닐 때만 `Predicate`를 추가, `cb.like/equal/greaterThanOrEqualTo/lessThan` 사용; `PageRequest`에 `Sort.by(DESC, "executedAt")` 명시

### 복원 방법

HIST-20260512-005 복원 시:
- `PracticeHistoryRepository.java` — `JpaSpecificationExecutor` 제거, JPQL `findWithFilters` 복원
- `AdminPracticeController.java` — Specification 빌드 코드 제거, `findWithFilters` 호출 복원, 관련 import 제거

---

## HIST-20260512-004

- **날짜**: 2026-05-12
- **수정 범위**: 공통 백엔드 / 인프라 설정
- **수정 개요**: Docker 프로파일 `ddl-auto: validate → update` 변경 — `dialect` 컬럼 누락으로 인한 500 버그 수정

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/resources/application-docker.yml` | 수정 | `ddl-auto: validate` → `ddl-auto: update` |

### 원인 분석

```
docker compose down  (볼륨 보존 — postgres_data 유지)
  → practice_history 테이블에 dialect 컬럼 없음 (이전 스키마)

docker compose up db --build  (기존 볼륨 그대로 DB 재기동)

Backend 재시작 (SPRING_PROFILES_ACTIVE=docker, ddl-auto: validate)
  → Hibernate: 엔티티에 dialect 있음 / DB 테이블에 dialect 없음
  → SchemaManagementException: missing column [dialect] in table [practice_history]
  → EntityManagerFactory 초기화 실패
  → DispatcherServlet 초기화 실패
  → 모든 /api/** 엔드포인트 500 반환
```

### 수정 상세

- 변경 전: `ddl-auto: validate` — Hibernate가 엔티티와 DB 스키마를 대조하고, 불일치 시 예외를 던짐
- 변경 후: `ddl-auto: update` — Hibernate가 누락 컬럼/테이블을 자동으로 추가함; 기존 컬럼·데이터는 변경하지 않음
- 이유: 개발 단계에서 엔티티 변경 시 DB 스키마가 자동으로 동기화되어야 하며, Flyway 도입 이전까지 `update`가 적합

> **TODO**: 서비스 안정화 후 Flyway를 도입하여 스키마 마이그레이션을 버전 관리하고, Docker 프로파일을 다시 `validate`로 복원할 것

### 복원 방법

HIST-20260512-004 복원 시:
- `application-docker.yml` — `ddl-auto: update` → `validate` 복원
- 단, 복원 전 DB 스키마에 `dialect` 컬럼이 존재하는지 확인 필요

---

## HIST-20260512-003

- **날짜**: 2026-05-12
- **수정 범위**: 관리자 백엔드 / 연습장
- **수정 개요**: 기록 관리 API 필터에 `dialect`(DB 종류) 조건 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../repository/PracticeHistoryRepository.java` | 수정 | `findWithFilters` JPQL에 `dialect` 조건 추가 |
| `backend/.../controller/AdminPracticeController.java` | 수정 | `getHistory()` — `dialect` 요청 파라미터 추가 |

### 수정 상세

#### `PracticeHistoryRepository.java`
- 변경 전: `findWithFilters(email, sqlContent, resultType, startDate, endDate, pageable)` — 5개 필터
- 변경 후: `findWithFilters(email, sqlContent, resultType, dialect, startDate, endDate, pageable)` — `(:dialect IS NULL OR h.dialect = :dialect)` 조건 추가

#### `AdminPracticeController.java`
- 변경 전: `resultType`, `date` 파라미터까지 수신
- 변경 후: `dialect` 파라미터 추가 → `dialectParam` 추출 → `findWithFilters` 호출 시 전달

### 복원 방법

HIST-20260512-003 복원 시:
- `PracticeHistoryRepository.java` — `@Param("dialect")` 제거, JPQL에서 dialect 조건 제거
- `AdminPracticeController.java` — `dialect` 파라미터 및 `dialectParam` 변수 제거, `findWithFilters` 호출부에서 `dialectParam` 제거

---

## HIST-20260512-002

- **날짜**: 2026-05-12
- **수정 범위**: 관리자/사용자 백엔드 / 연습장
- **수정 개요**: `PracticeHistory` 엔티티에 `dialect` 컬럼 추가, 히스토리 기록 및 조회에 반영

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../entity/PracticeHistory.java` | 수정 | `dialect` VARCHAR(20) 컬럼 추가 |
| `backend/.../service/PracticeService.java` | 수정 | `saveAndReturn()` 파라미터에 `dialect` 추가, 모든 호출부 수정 |
| `backend/.../controller/AdminPracticeController.java` | 수정 | `HistoryDto`에 `dialect` 필드 추가, 매핑 반영 |

### 수정 상세

#### `PracticeHistory.java`
- 변경 전: `dialect` 컬럼 없음
- 변경 후: `@Column(name="dialect", length=20)` 추가, Builder 생성자에 `dialect` 파라미터 추가
- 이유: 사용자가 어느 방언(postgresql/mysql/oracle)으로 SQL을 실행했는지 기록하기 위해

#### `PracticeService.java`
- 변경 전: `saveAndReturn(userEmail, sql, result)` 시그니처
- 변경 후: `saveAndReturn(userEmail, sql, dialect, result)` — 9개 호출부 및 `validateDialectSyntax` 내 호출 모두 수정
- 이유: 방언 정보를 히스토리에 영속화

#### `AdminPracticeController.java`
- 변경 전: `HistoryDto(id, userEmail, sqlContent, resultType, rowCount, errorMessage, executedAt)` 7개 필드
- 변경 후: `dialect` 필드 추가 → 8개 필드; null인 경우 "postgresql" 기본값 적용
- 이유: 프론트엔드 기록 테이블에 DB 종류 컬럼 표시

### 복원 방법

HIST-20260512-002 복원 시:
- `PracticeHistory.java` — `dialect` 필드 및 Builder 파라미터 제거
- `PracticeService.java` — `saveAndReturn` 시그니처를 3-파라미터로 복원, 모든 호출부에서 `dialect` 인자 제거
- `AdminPracticeController.java` — `HistoryDto`에서 `dialect` 필드 제거, 매핑에서 `dialect` 라인 제거

---

## HIST-20260512-001

- **날짜**: 2026-05-12
- **수정 범위**: 관리자 백엔드 / 연습장
- **수정 개요**: 기록 관리 API에 SQL 내용·결과 유형·실행 날짜 복합 필터 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../controller/AdminPracticeController.java` | 수정 | `getHistory()` — `sqlContent`, `resultType`, `date` 파라미터 추가 |
| `backend/.../repository/PracticeHistoryRepository.java` | 수정 | `findWithFilters()` JPQL 복합 조건 쿼리 추가 |

### 수정 상세

#### `AdminPracticeController.java`
- 변경 전: `@RequestParam email` 단일 필터만 허용
- 변경 후: `email`, `sqlContent`, `resultType`, `date(yyyy-MM-dd)` 4개 필터 지원; `date`는 `LocalDate.parse()` 후 `startDate / endDate` 범위로 변환
- 이유: 관리자가 특정 SQL 구문, 유형, 날짜별로 기록을 조회할 수 있도록 검색 기능 확장

#### `PracticeHistoryRepository.java`
- 변경 전: `findAllByOrderByExecutedAtDesc`, `findByUserEmailContaining...` 두 메서드만 존재
- 변경 후: `findWithFilters(@Param("email"), @Param("sqlContent"), @Param("resultType"), @Param("startDate"), @Param("endDate"), Pageable)` JPQL 쿼리 추가 — `null`인 파라미터는 조건 생략
- 이유: 복합 필터를 단일 쿼리로 처리

### 복원 방법

HIST-20260512-001 복원 시:
- `AdminPracticeController.java` — `sqlContent`, `resultType`, `date` 파라미터 제거, 기존 단일 email 분기 코드로 복원
- `PracticeHistoryRepository.java` — `findWithFilters()` 메서드 및 관련 import 제거

---

## HIST-20260511-008

- **날짜**: 2026-05-11
- **수정 범위**: 관리자/사용자 백엔드 / 연습장
- **수정 개요**: 연습장 SQL 실행 기록 저장 + 관리자 기록/규칙 조회 API 신규 구현

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../entity/PracticeHistory.java` | 추가 | practice_history 테이블 엔티티 |
| `backend/.../repository/PracticeHistoryRepository.java` | 추가 | 전체·이메일 필터 조회 메서드 |
| `backend/.../service/PracticeService.java` | 수정 | `execute()` 파라미터에 `userEmail` 추가 + `saveAndReturn()` 히스토리 저장 |
| `backend/.../controller/UserPracticeController.java` | 수정 | `@AuthenticationPrincipal String email` 추가, `execute()` 호출 변경 |
| `backend/.../controller/AdminPracticeController.java` | 추가 | `/api/admin/practice/history`, `/api/admin/practice/rules` 엔드포인트 |

### 수정 상세

#### `PracticeHistory.java`
- 테이블: `practice_history`
- 필드: id, user_email, sql_content, result_type, row_count, error_message, executed_at
- `BaseEntity` 미상속 (로그성 엔티티 — 생성자 번호 불필요)

#### `PracticeHistoryRepository.java`
- `findAllByOrderByExecutedAtDesc(Pageable)` — 전체 최신순 페이징
- `findByUserEmailContainingIgnoreCaseOrderByExecutedAtDesc(String, Pageable)` — 이메일 부분 검색

#### `PracticeService.java`
- `execute(String rawSql)` → `execute(String rawSql, String userEmail)` 시그니처 변경
- `saveAndReturn()`: 검증 실패 포함 모든 실행 결과를 `practice_history`에 저장 후 반환
- 히스토리 저장 실패 시 warn 로그만 남기고 정상 응답 유지

#### `UserPracticeController.java`
- `executeSql` 메서드에 `@AuthenticationPrincipal String email` 파라미터 추가
- `practiceService.execute(request.sql(), email)` 호출로 변경

#### `AdminPracticeController.java`
- `GET /api/admin/practice/history?page=0&size=20&email=` → `HistoryPageResponse` 반환
- `GET /api/admin/practice/rules` → 하드코딩된 규칙 정보 반환 (blockedCommands, typoPatterns 등)

### 복원 방법

HIST-20260511-008 복원 시:
- `PracticeHistory.java`, `PracticeHistoryRepository.java`, `AdminPracticeController.java` 삭제
- `PracticeService.execute()` 파라미터를 `(String rawSql)`로 복원, `PracticeHistoryRepository` 주입 제거, `saveAndReturn()` 제거
- `UserPracticeController.executeSql()`에서 `@AuthenticationPrincipal` 파라미터 제거
- DB: `DROP TABLE IF EXISTS practice_history`
