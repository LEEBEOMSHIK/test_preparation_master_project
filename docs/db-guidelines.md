# DB Guidelines — TPMP Database Conventions

이 문서는 TPMP 프로젝트의 데이터베이스 테이블 설계 규칙을 정의합니다.  
신규 테이블 생성 시 반드시 이 가이드를 따릅니다.

---

## 1. DBMS / 기술 스택

| 항목 | 값 |
|------|----|
| DBMS | PostgreSQL 15 |
| ORM | JPA / Hibernate |
| 마이그레이션 | Flyway (향후 도입) |
| 네이밍 | snake_case (테이블, 컬럼 모두) |

---

## 2. 표준 공통 컬럼

모든 테이블(일부 예외 허용)에 아래 공통 컬럼을 포함한다.

| 컬럼명 | 타입 | NOT NULL | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `create_dt` | TIMESTAMP | ✅ | 현재 시각 | 생성 일시 |
| `create_uno` | BIGINT | ✅ | — | 생성 사용자 번호 (users.id FK) |
| `modified_dt` | TIMESTAMP | ✅ | 현재 시각 | 최종 수정 일시 |
| `modified_uno` | BIGINT | ✅ | — | 최종 수정 사용자 번호 (users.id FK) |
| `del_yn` | VARCHAR(1)\* | ✅ | `'N'` | 삭제 여부 (Y: 삭제됨, N: 정상) |
| `use_yn` | VARCHAR(1)\* | ✅ | `'Y'` | 사용 여부 (Y: 사용중, N: 비사용) |

\* **실제 물리 타입은 VARCHAR(1)이다(CHAR(1) 아님)**. `BaseEntity`/`Exam`/`Examination`/`Question`의 `delYn`/`useYn` 필드는 `@Column(columnDefinition` 없이 `length = 1`만 지정하며, Hibernate는 이 경우 `String` 필드를 VARCHAR로 매핑한다. 과거 `exams.del_yn`을 CHAR(1)로 만들었다가 prod `ddl-auto=validate` 기동 실패로 VARCHAR(1)로 되돌린 전례가 있다(`20260701_01_exams_del_yn_char_to_varchar.sql`). 신규 테이블에 del_yn/use_yn 컬럼을 추가하는 마이그레이션 SQL은 반드시 `VARCHAR(1)`로 작성한다.

### UNO (User Number)

`create_uno` / `modified_uno`는 `users` 테이블의 `id`를 참조한다.  
**FK 제약 조건을 DB 레벨에 걸지 않고** 애플리케이션 레벨에서만 보장한다  
(시스템 계정이나 배치 처리 시 유연성을 확보하기 위해).

### DEL_YN vs USE_YN

| 플래그 | 의미 | 조회 필터 |
|--------|------|-----------|
| `DEL_YN = 'N'` | 삭제되지 않은 레코드 | 대부분의 조회에서 `WHERE del_yn = 'N'` 필수 |
| `USE_YN = 'Y'` | 활성화된 레코드 | 사용자 노출 조회에서 추가 필터 |

---

## 3. 컬럼 예외 규칙

아래 상황에서는 일부 공통 컬럼을 생략할 수 있다.

| 상황 | 생략 가능한 컬럼 |
|------|----------------|
| 로그·이력 테이블 (append-only) | `modified_dt`, `modified_uno`, `del_yn`, `use_yn` |
| 단순 코드/분류 테이블 | `create_uno`, `modified_uno` |
| 연결(Junction) 테이블 | `modified_dt`, `modified_uno`, `use_yn` |

---

## 4. 테이블 네이밍 규칙

- 단어 구분: `snake_case` (소문자)
- 복수형 명사 사용: `users`, `exams`, `questions`, `question_bank`
- 연결 테이블: `{table_a}_{table_b}` 순서 (ex: `exam_question`)
- 예약어 회피: `order` → `orders`, `group` → `groups`

---

## 5. 컬럼 네이밍 규칙

- `snake_case` 소문자
- PK: `id` (BIGINT, AUTO_INCREMENT)
- FK: `{참조테이블_단수형}_id` 또는 `{의미}_uno` (users 참조 시)
- 불린/플래그: `{의미}_yn` (CHAR(1), Y/N)
- 일시: `{의미}_dt` (TIMESTAMP)
- 코드성 구분값: `{의미}_type` (VARCHAR, ENUM 사용)

---

## 6. Java / JPA 구현 표준

### 6.1 BaseEntity (공통 컬럼 추상 클래스)

모든 엔티티는 `BaseEntity`를 상속받아 공통 컬럼을 자동으로 갖는다.

```java
@MappedSuperclass
public abstract class BaseEntity {
    // createDt, createUno, modifiedDt, modifiedUno, delYn, useYn
    // @PrePersist → initAudit(userNo) 호출
    // @PreUpdate  → updateAudit(userNo) 호출
}
```

서비스 레이어에서 저장 전 `entity.initAudit(adminId)` 또는 `entity.updateAudit(adminId)`를 호출한다.

### 6.2 소프트 삭제 패턴

```java
// 삭제 시 (DB에서 실제 행을 지우지 않음)
entity.softDelete(adminId);   // delYn = 'Y', modifiedDt 갱신

// 조회 시 항상 del_yn = 'N' 필터 적용
repository.findAllByDelYn("N", pageable);
```

### 6.3 타입 매핑

| DB 타입 | Java 타입 |
|---------|-----------|
| `BIGINT` | `Long` |
| `VARCHAR` | `String` |
| `TEXT` | `String` + `@Column(columnDefinition = "TEXT")` |
| `CHAR(1)` | `String` (길이 1로 제한) — del_yn/use_yn은 실제로 `VARCHAR(1)` 사용, §2 각주 참고 |
| `TIMESTAMP` | `LocalDateTime` |
| `JSONB` | `List<?>` + `@JdbcTypeCode(SqlTypes.JSON)` |

---

## 7. 현재 테이블 목록 및 공통 컬럼 적용 현황

| 테이블 | 설명 | 공통 컬럼 적용 | 비고 |
|--------|------|---------------|------|
| `users` | 사용자 계정 | 미적용 (레거시) | email, password, role, name |
| `exams` | 시험지 (문항 묶음) | 부분 적용 (del_yn/use_yn만) | title, order_no, question_mode, created_by FK |
| `questions` | 시험지 내 문항 스냅샷 | 부분 적용 (del_yn/use_yn만) | exam_id FK, nullable source_question_bank_id FK, instruction, content, question_type, options(jsonb), answer(TEXT), explanation, code, language, scheduling_data(jsonb), sql_data(jsonb) |
| `question_bank` | 글로벌 문항 풀 | ✅ **적용** | category_id FK → domain_slave |
| `domain_master` | 도메인 마스터 (분류 그룹) | 미적용 (단순 코드 테이블) | name |
| `domain_slave` | 도메인 슬레이브 (분류 값) | 미적용 (단순 코드 테이블) | master_id FK, name, display_order |
| `examinations` | 시험 이벤트 | 부분 적용 (del_yn/use_yn만) | title, exam_paper_id FK → exams, category_id FK → domain_slave, time_limit, created_by FK, created_at |
| `concept_notes` | 개념 노트 | 미적용 (레거시) | |
| `inquiries` | 문의 | 미적용 (레거시) | status는 PENDING/IN_PROGRESS/ON_HOLD/ANSWERED/COMPLETED/UNABLE_TO_PROCESS 6상태 check |
| `email_templates` | 이메일 템플릿 | 자체 감사 컬럼 적용 | created_at/updated_at, nullable created/updated/deleted_by_admin_id FK → users, deleted_at 소프트 삭제 |
| `email_template_bindings` | 이메일 이벤트별 템플릿 연결 | 자체 감사 컬럼 적용 | event_code PK, template_id FK → email_templates(RESTRICT), nullable created/updated_by_admin_id FK → users |
| `inquiry_email_deliveries` | 문의 이메일 발송 이력 | 로그 테이블 예외 | inquiry/message FK, text body와 nullable html_body 발송 스냅샷 |
| `user_exam_applications` | 사용자 직접 입력 시험 접수 정보 | 미적용 (신규, created_at/updated_at만 자체 관리) | user_id FK → users(CASCADE), exam_info_id nullable FK → exam_info(SET NULL), exam_name 스냅샷 |
| `patch_notes` | 관리자 작성 패치노트 | ✅ 적용 | title, version, content, published_yn, published_dt |

### 적용 기준

- `question_bank`: BaseEntity 상속 → 소프트 삭제(del_yn) 포함 완전 적용
- `domain_master` / `domain_slave`: 단순 코드/분류 테이블 — 가이드라인 §3 예외 적용 (공통 컬럼 생략 허용)
- `exams` / `examinations` / `questions`: BaseEntity 완전 전환 대신 `del_yn`(exams는 기존 보유, examinations/questions는 신규)·`use_yn`(3개 테이블 모두 신규) 두 컬럼만 개별 추가(2026-07-22, `20260722_02_add_audit_flags_exam_examination_question.sql`). create_dt/create_uno/modified_dt/modified_uno는 미적용 상태 유지.
- 나머지 레거시 테이블: Flyway 마이그레이션 도입 시 공통 컬럼 추가 예정

### 향후 계획

1. Flyway 마이그레이션 도입 후 레거시 테이블에 create_dt/create_uno/modified_dt/modified_uno 공통 컬럼 ALTER TABLE 적용
2. `Examination`, `DomainMaster`, `DomainSlave` 엔티티를 BaseEntity 또는 경량 감사 추상 클래스로 전환

---

## 8. 주요 테이블 ERD

### question_bank

```
question_bank
─────────────────────────────────────────────────────────
id             BIGINT          PK, AUTO_INCREMENT
title          VARCHAR(200)    NULLABLE  — 문항 제목(관리용)
exam_year      INT             NULLABLE  — 시험 연도
exam_round     INT             NULLABLE  — 시험 회차
question_no    INT             NULLABLE  — 원본 시험 문항번호(양수, 그룹 완전 시 자동부여 가능)
instruction    TEXT            NULLABLE  — 발문(지시문)
content        TEXT            NOT NULL  — 문항 내용
question_type  VARCHAR(30)     NOT NULL  — MULTIPLE_CHOICE|SHORT_ANSWER|OX|CODE|SCHEDULING|SQL
category_id    BIGINT          NULLABLE  — FK → domain_slave.id (문제 유형)
exam_type_id   BIGINT          NULLABLE  — FK → domain_slave.id (시험 유형)
options        JSONB           NULLABLE  — 객관식 보기 목록
answer         TEXT            NULLABLE  — 정답
code           TEXT            NULLABLE  — 코드 문항의 코드 본문
language       VARCHAR(50)     NULLABLE  — 코드 언어 (javascript, python ...)
explanation    TEXT            NULLABLE  — 해설
scheduling_data JSONB          NULLABLE  — CPU 스케줄링 구조화 데이터 (SCHEDULING 유형, {algorithm,timeQuantum?,processes[]})
sql_data       JSONB           NULLABLE  — SQL 구조화 데이터 (SQL 유형, {tables:[{name,columns:[{name,dataType?,primaryKey}],rows?}]})
─────────────────────────────────────────────────────────
create_dt      TIMESTAMP       NOT NULL  — 생성 일시
create_uno     BIGINT          NOT NULL  — 생성자 (users.id)
modified_dt    TIMESTAMP       NOT NULL  — 수정 일시
modified_uno   BIGINT          NOT NULL  — 수정자 (users.id)
del_yn         CHAR(1)         NOT NULL  DEFAULT 'N'
use_yn         CHAR(1)         NOT NULL  DEFAULT 'Y'
```

### domain_master / domain_slave

```
domain_master
──────────────────────────────
id     BIGINT   PK
name   VARCHAR(100)  NOT NULL

domain_slave
──────────────────────────────────────────
id             BIGINT       PK
master_id      BIGINT       NOT NULL FK → domain_master.id
name           VARCHAR(100) NOT NULL
display_order  INT          NOT NULL
```

### examinations

```
examinations
──────────────────────────────────────────────────────────
id             BIGINT       PK, AUTO_INCREMENT
title          VARCHAR(200) NOT NULL
exam_paper_id  BIGINT       NOT NULL FK → exams.id (사용 시험지)
category_id    BIGINT       NOT NULL FK → domain_slave.id (시험 유형)
time_limit     INT          NOT NULL  — 제한 시간 (분)
exam_year      INT          NULLABLE  — 시험 연도
exam_round     INT          NULLABLE  — 시험 회차
is_ai_custom   BOOLEAN      NOT NULL DEFAULT false  — AI 커스텀 문항 시험 여부
created_by     BIGINT       NOT NULL FK → users.id
created_at     TIMESTAMP    NOT NULL
del_yn         VARCHAR(1)   NOT NULL  DEFAULT 'N'
use_yn         VARCHAR(1)   NOT NULL  DEFAULT 'Y'
```

### user_exam_applications

```
user_exam_applications
──────────────────────────────────────────────────────────
id                BIGINT       PK, AUTO_INCREMENT
user_id           BIGINT       NOT NULL FK → users.id (ON DELETE CASCADE)
exam_info_id      BIGINT       NULLABLE FK → exam_info.id (ON DELETE SET NULL)
exam_name         VARCHAR(200) NOT NULL  — 저장 시점 시험명 스냅샷
application_date  DATE         NULLABLE  — 접수일(신청일)
exam_date         DATE         NULLABLE  — 시험일
memo              VARCHAR(300) NULLABLE
created_at        TIMESTAMP    NOT NULL  DEFAULT now()
updated_at        TIMESTAMP    NULLABLE
```

---

## 9. 테이블·컬럼 코멘트 관리

관리자 DB 조회 화면(`/admin/tables/data`)은 각 테이블·컬럼의 한국어 설명과 FK 참조 정보를  
`frontend/src/data/tableComments.ts` 파일에서 읽어 표시한다.

> **원칙**: 이 문서(§9)가 코멘트의 사람이 읽는 기준이고,  
> `tableComments.ts`가 런타임 소스다. 새 테이블·컬럼 추가 시 **둘 다** 업데이트한다.

### 9.1 테이블별 코멘트

| 테이블 | 한국어 설명 |
|--------|------------|
| `users` | 사용자 계정 |
| `exams` | 시험지 (문항 묶음) |
| `questions` | 시험지 내 문항 |
| `question_bank` | 글로벌 문항 풀 |
| `domain_master` | 도메인 마스터 (분류 그룹) |
| `domain_slave` | 도메인 슬레이브 (분류 값) |
| `examinations` | 시험 이벤트 |
| `quotes` | 명언 |
| `concept_notes` | 개념 노트 |
| `inquiries` | 문의 |
| `email_templates` | 이메일 템플릿 |
| `email_template_bindings` | 이메일 이벤트별 템플릿 연결 |
| `inquiry_email_deliveries` | 문의·요청 이메일 발송·실패·재시도 이력 |
| `user_exam_applications` | 사용자 직접 입력 시험 접수 정보 |

### 9.2 주요 컬럼 코멘트 (FK 포함)

#### `exams`
| 컬럼 | 설명 |
|------|------|
| `created_by` | FK → users.id (생성자) |
| `del_yn` | 삭제 여부 (Y/N) |
| `use_yn` | 사용 여부 (Y/N) |

#### `questions`
| 컬럼 | 설명 |
|------|------|
| `exam_id` | FK → exams.id (시험지) |
| `source_question_bank_id` | nullable FK → question_bank.id (원본 문항, 자동 전파 없는 스냅샷 연결) |
| `instruction` | 시험지 문항 발문(지시문) 스냅샷 |
| `question_type` | MULTIPLE_CHOICE / SHORT_ANSWER / OX / CODE / SCHEDULING / SQL |
| `scheduling_data` | CPU 스케줄링 구조화 데이터 스냅샷 (JSONB, nullable) |
| `sql_data` | SQL 테이블·기대 결과 구조화 데이터 스냅샷 (JSONB, nullable) |
| `del_yn` | 삭제 여부 (Y/N) — 원본 question_bank와 독립 관리(자동 전파 없음) |
| `use_yn` | 사용 여부 (Y/N) — 원본 question_bank와 독립 관리(자동 전파 없음) |

#### `exam_history_details`
| 컬럼 | 설명 |
|------|------|
| `question_bank_id` | 제출 시점 원본 문제은행 ID 스냅샷 (BIGINT, FK 없음, 원본 연결이 없으면 nullable) |
| `title` | 제출 시점 원본 문항 제목 스냅샷 (VARCHAR(200), 원본 연결이 없으면 nullable) |
| `instruction` | 제출 시점 발문(지시문) 스냅샷 |
| `scheduling_data` | 제출 시점 CPU 스케줄링 구조화 데이터 스냅샷 (JSONB, nullable) |
| `sql_data` | 제출 시점 SQL 구조화 데이터 스냅샷 (JSONB, nullable) |

#### `question_bank`
| 컬럼 | 설명 |
|------|------|
| `category_id` | FK → domain_slave.id (문제 유형) |
| `exam_type_id` | FK → domain_slave.id (시험 유형) |
| `question_no` | 원본 시험 문항번호. 활성 문항에서 `exam_type_id + exam_year + exam_round + question_no` 조합은 중복 불가 |
| `scheduling_data` | CPU 스케줄링 구조화 데이터 (JSONB, SCHEDULING 유형 전용, nullable) |
| `sql_data` | SQL 구조화 데이터 (JSONB, SQL 유형 전용, nullable) |
| `create_uno` | FK → users.id (생성자) |
| `modified_uno` | FK → users.id (수정자) |
| `del_yn` | 삭제 여부 (Y/N) |
| `use_yn` | 사용 여부 (Y/N) |

#### `domain_slave`
| 컬럼 | 설명 |
|------|------|
| `master_id` | FK → domain_master.id (상위 분류) |

#### `examinations`
| 컬럼 | 설명 |
|------|------|
| `exam_paper_id` | FK → exams.id (사용 시험지) |
| `category_id` | FK → domain_slave.id (시험 유형) |
| `exam_year` | 시험 연도 — 레거시 데이터는 title 파싱 백필, NULL 가능 |
| `exam_round` | 시험 회차 — 레거시 데이터는 title 파싱 백필, NULL 가능 |
| `is_ai_custom` | AI 커스텀 문항 시험 여부 — 레거시 데이터는 title 파싱 백필 |
| `created_by` | FK → users.id (생성자) |
| `del_yn` | 삭제 여부 (Y/N) |
| `use_yn` | 사용 여부 (Y/N) |

#### `user_exam_applications`
| 컬럼 | 설명 |
|------|------|
| `user_id` | FK → users.id (접수 정보 소유자, ON DELETE CASCADE) |
| `exam_info_id` | nullable FK → exam_info.id (연결된 시험 정보, ON DELETE SET NULL) |
| `exam_name` | 시험명 스냅샷 (저장 시점 exam_info.title 또는 자유 입력값) |

#### `inquiries`
| 컬럼 | 설명 |
|------|------|
| `status` | PENDING / IN_PROGRESS / ON_HOLD / ANSWERED / COMPLETED / UNABLE_TO_PROCESS 6상태 check |

#### `email_templates`
| 컬럼 | 설명 |
|------|------|
| `scope` | INQUIRY_STATUS만 허용하는 check |
| `subject_template` | 변수 치환 전 메일 제목 템플릿 |
| `html_body` | 변수 치환 전 HTML 본문 템플릿 |
| `text_body` | 변수 치환 전 일반 텍스트 본문 템플릿 |
| `system_key` | 기본 시스템 템플릿 식별자 (nullable, unique) |
| `created_by_admin_id` | nullable FK → users.id (등록 관리자) |
| `updated_by_admin_id` | nullable FK → users.id (최종 수정 관리자) |
| `deleted_at` | 소프트 삭제 일시 (nullable) |
| `deleted_by_admin_id` | nullable FK → users.id (삭제 관리자) |

#### `email_template_bindings`
| 컬럼 | 설명 |
|------|------|
| `event_code` | PK, INQUIRY_ANSWERED / INQUIRY_COMPLETED / INQUIRY_UNABLE_TO_PROCESS 이벤트 코드 |
| `template_id` | FK → email_templates.id (ON DELETE RESTRICT) |
| `created_by_admin_id` | nullable FK → users.id (연결 관리자) |
| `updated_by_admin_id` | nullable FK → users.id (최종 변경 관리자) |

#### `inquiry_email_deliveries`
| 컬럼 | 설명 |
|------|------|
| `inquiry_id` | FK → inquiries.id (ON DELETE CASCADE) |
| `inquiry_message_id` | nullable FK → inquiry_messages.id (ON DELETE SET NULL) |
| `body` | 발송 시점 일반 텍스트 본문 스냅샷 |
| `html_body` | 발송 시점 정화된 HTML 본문 스냅샷. 기존 NEW_INQUIRY / USER_MESSAGE / ADMIN_MESSAGE 평문 발송은 NULL |

### 9.3 코멘트 추가 방법

1. 이 문서 §9 테이블에 새 행 추가
2. `frontend/src/data/tableComments.ts`의 `TABLE_COMMENTS` 배열에서 해당 테이블 항목 업데이트
   - 새 테이블이면 `TableComment` 객체를 배열에 추가
   - FK 관계가 있으면 `fkRelations` 배열에 `{ column, foreignTable, foreignColumn, displayColumn }` 추가
   - `displayColumn`은 참조 테이블에서 레이블로 보여줄 컬럼명 (보통 `name` 또는 `title`)

---

## 10. 수동 마이그레이션

Flyway/Liquibase 미사용 프로젝트이므로 스키마 변경(ALTER TABLE, CREATE TABLE 등) 시 `docs/db-migration/{YYYYMMDD}_{순번}_{설명}.sql` 파일로 SQL을 남기고, 운영·스테이징·로컬 각 환경에 수동으로 적용한다. 파일 상단에 목적·적용 대상·롤백 방법을 주석으로 명시한다.

### 베이스라인 스키마

`docs/db-migration/00000000_00_baseline_schema.sql`은 **33개 테이블 전체 정의**를 담은 스키마 기준점이다(2026-08-02 기준 `pg_dump --schema-only`).

- **신규(빈) DB는 이 파일을 먼저 적용한 뒤, `20260826_01` 이후의 신규 델타 마이그레이션만 날짜순으로 적용한다.** `20260802_01`까지의 과거 델타는 베이스라인에 이미 반영되어 있고 일부는 빈 DB에서 실행할 수 없다.
- **일부 스키마만 있는 기존 로컬에도 그대로 적용 가능하다.** 없는 테이블·컬럼·제약·인덱스만 채워 넣고, 기존 데이터는 건드리지 않는다(재실행 안전).
- 새 스키마 변경은 지금까지처럼 델타 파일로 추가하고, 베이스라인은 손대지 않는다.
- 자세한 절차: [`docs/sql/README.md`](sql/README.md)

> `ddl-auto` 주의: local/dev 프로필은 `update`라 백엔드 기동만으로 스키마가 생기지만, prod은 `validate`라 스키마가 없으면 기동 자체가 실패한다. 운영과 동일한 스키마를 보장하려면 로컬에서도 베이스라인을 적용하는 편이 안전하다.

### 이메일 템플릿 관리 운영 적용 순서

`email_templates`, `email_template_bindings`, `inquiry_email_deliveries.html_body`, 문의 6상태 check는 `docs/db-migration/20260831_01_admin_email_template_management.sql`로 반영한다. 이 SQL은 기본 시스템 템플릿·이벤트 연결을 최초 한 번만 만들며, 관리자가 연결을 해제한 뒤 애플리케이션 재기동만으로 binding을 복구하지 않는다.

> **운영 필수 순서: SQL → 애플리케이션.** 운영의 `spring.jpa.hibernate.ddl-auto=validate`는 누락된 테이블·컬럼을 생성하지 않으므로, 위 SQL을 먼저 적용하지 않고 신규 애플리케이션을 기동하면 스키마 검증에서 실패한다.
