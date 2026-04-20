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
| `del_yn` | CHAR(1) | ✅ | `'N'` | 삭제 여부 (Y: 삭제됨, N: 정상) |
| `use_yn` | CHAR(1) | ✅ | `'Y'` | 사용 여부 (Y: 사용중, N: 비사용) |

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
| `CHAR(1)` | `String` (길이 1로 제한) |
| `TIMESTAMP` | `LocalDateTime` |
| `JSONB` | `List<?>` + `@JdbcTypeCode(SqlTypes.JSON)` |

---

## 7. 현재 테이블 목록 및 공통 컬럼 적용 현황

| 테이블 | 설명 | 공통 컬럼 적용 | 비고 |
|--------|------|---------------|------|
| `users` | 사용자 계정 | 미적용 (레거시) | email, password, role, name |
| `exams` | 시험지 (문항 묶음) | 미적용 (레거시) | title, order_no, question_mode, created_by FK |
| `questions` | 시험지 내 문항 | 미적용 (레거시) | exam_id FK, seq, content, question_type, options(jsonb), answer, explanation, code, language |
| `question_bank` | 글로벌 문항 풀 | ✅ **적용** | category_id FK → domain_slave |
| `domain_master` | 도메인 마스터 (분류 그룹) | 미적용 (단순 코드 테이블) | name |
| `domain_slave` | 도메인 슬레이브 (분류 값) | 미적용 (단순 코드 테이블) | master_id FK, name, display_order |
| `examinations` | 시험 이벤트 | 미적용 | title, exam_paper_id FK → exams, category_id FK → domain_slave, time_limit, created_by FK, created_at |
| `concept_notes` | 개념 노트 | 미적용 (레거시) | |
| `inquiries` | 문의 | 미적용 (레거시) | |

### 적용 기준

- `question_bank`: BaseEntity 상속 → 소프트 삭제(del_yn) 포함 완전 적용
- `domain_master` / `domain_slave`: 단순 코드/분류 테이블 — 가이드라인 §3 예외 적용 (공통 컬럼 생략 허용)
- `examinations`: 신규 테이블이지만 created_at + created_by로 최소 감사 컬럼만 적용; Flyway 도입 시 BaseEntity 마이그레이션 예정
- 나머지 레거시 테이블: Flyway 마이그레이션 도입 시 공통 컬럼 추가 예정

### 향후 계획

1. Flyway 마이그레이션 도입 후 레거시 테이블에 공통 컬럼 ALTER TABLE 적용
2. `Examination`, `DomainMaster`, `DomainSlave` 엔티티를 BaseEntity 또는 경량 감사 추상 클래스로 전환

---

## 8. 주요 테이블 ERD

### question_bank

```
question_bank
─────────────────────────────────────────────────────────
id             BIGINT          PK, AUTO_INCREMENT
content        TEXT            NOT NULL  — 문항 내용
question_type  VARCHAR(30)     NOT NULL  — MULTIPLE_CHOICE|SHORT_ANSWER|OX|CODE
category_id    BIGINT          NULLABLE  — FK → domain_slave.id (문제 유형)
options        JSONB           NULLABLE  — 객관식 보기 목록
answer         TEXT            NULLABLE  — 정답
code           TEXT            NULLABLE  — 코드 문항의 코드 본문
language       VARCHAR(50)     NULLABLE  — 코드 언어 (javascript, python ...)
explanation    TEXT            NULLABLE  — 해설
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
created_by     BIGINT       NOT NULL FK → users.id
created_at     TIMESTAMP    NOT NULL
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

### 9.2 주요 컬럼 코멘트 (FK 포함)

#### `exams`
| 컬럼 | 설명 |
|------|------|
| `created_by` | FK → users.id (생성자) |

#### `questions`
| 컬럼 | 설명 |
|------|------|
| `exam_id` | FK → exams.id (시험지) |
| `question_type` | MULTIPLE_CHOICE / SHORT_ANSWER / OX / CODE |

#### `question_bank`
| 컬럼 | 설명 |
|------|------|
| `category_id` | FK → domain_slave.id (문제 유형) |
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
| `created_by` | FK → users.id (생성자) |

### 9.3 코멘트 추가 방법

1. 이 문서 §9 테이블에 새 행 추가
2. `frontend/src/data/tableComments.ts`의 `TABLE_COMMENTS` 배열에서 해당 테이블 항목 업데이트
   - 새 테이블이면 `TableComment` 객체를 배열에 추가
   - FK 관계가 있으면 `fkRelations` 배열에 `{ column, foreignTable, foreignColumn, displayColumn }` 추가
   - `displayColumn`은 참조 테이블에서 레이블로 보여줄 컬럼명 (보통 `name` 또는 `title`)
