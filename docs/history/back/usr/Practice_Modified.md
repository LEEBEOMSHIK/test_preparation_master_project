## HIST-20260512-006

- **날짜**: 2026-05-12
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: DELIMITER 방언 차단(Oracle/PostgreSQL) 추가, 스텁 중복 생성 방지

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/PracticeService.java` | 수정 | DELIMITER 처리 블록에 방언 분기 추가, 스텁 생성에 `alreadyDefined` 조건 추가 |

### 수정 상세

#### `PracticeService.java`

**문제 1 — PostgreSQL 오류 위치 불일치:**
- DELIMITER 제거 후 줄 번호가 달라져 `BEGIN`이 원본에선 6번째 줄이지만 오류는 4번째 줄로 표시됨
- **수정:** MySQL이 아닌 방언에서 DELIMITER 감지 시 DB 전송 없이 즉시 오류 반환 → 위치 오차 없음

**문제 2 — Oracle에서 DELIMITER SQL이 통과:**
- 기존 코드: DELIMITER 제거 → Oracle 방언 검증 → Oracle 트리거 번역 → 통과
- **수정:** DELIMITER 감지 즉시 방언 확인 → MySQL 외 방언이면 오류 반환 → Oracle 차단

**문제 3 — MySQL 트리거 번역 시 스텁 중복 생성:**
- MySQL/Oracle 트리거 번역 결과에 이미 함수가 포함되어 있어 스텁이 불필요하게 추가됨
- **수정:** `alreadyDefined` 체크로 translatedSql 내 동일 함수 이미 정의 시 스텁 생성 건너뜀

**방언별 최종 동작:**

| 방언 | 동작 |
|------|------|
| MySQL | DELIMITER 제거 → 트리거 번역 → 시뮬레이션 성공 |
| PostgreSQL | 즉시 `DELIMITER는 MySQL 클라이언트 전용` 오류 반환 (위치 없음) |
| Oracle | 즉시 `DELIMITER는 MySQL 클라이언트 전용` 오류 반환 |

### 복원 방법

HIST-20260512-006 복원 시:
- DELIMITER 블록의 방언 분기(`if (!"mysql".equals(dialect))`) 제거 → 기존 제거-전용 방식으로 복원
- 스텁 생성 블록의 `alreadyDefined` 조건 제거

---

## HIST-20260512-005

- **날짜**: 2026-05-12
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: MySQL 클라이언트 전용 DELIMITER 명령어 제거 전처리 추가 — 실제 SQL만 추출 후 정상 처리

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/PracticeService.java` | 수정 | `execute()` 초반에 DELIMITER 제거 전처리 블록 추가 |

### 수정 상세

#### `PracticeService.java`

**테스트 SQL:**
```sql
DELIMITER //
CREATE TRIGGER trg_after_insert
AFTER INSERT ON example_table
FOR EACH ROW
BEGIN
    INSERT INTO prac_departments(name) VALUES ('testNm');
END //
DELIMITER ;
```

**원인:** SQL이 `DELIMITER`로 시작하면 `isDdlStart = false`가 되어 멀티 스테이트먼트 차단 검사 진입, 트리거 본문의 `;`이 감지되어 "여러 SQL 문을 동시에 실행할 수 없습니다" 오류 반환.

**수정 내용:** `execute()` 초반에 DELIMITER 전처리 블록 추가

| 처리 단계 | 내용 |
|-----------|------|
| DELIMITER 라인 제거 | `(?im)^[ \\t]*DELIMITER\\s+\\S+[ \\t]*$` → 빈 줄 |
| 커스텀 구분자 제거 | `(?m)[ \\t]*{customDelim}[ \\t]*$` → 각 줄 끝의 `//` 제거 |
| 결과 | `CREATE TRIGGER ... END` 순수 SQL만 남음 |

**방언별 동작:**

| 방언 | 동작 |
|------|------|
| MySQL | DELIMITER 제거 → 기존 MySQL 트리거 번역 → PG 함수+트리거 시뮬레이션 |
| PostgreSQL | DELIMITER 제거 → 인라인 BEGIN...END 트리거 → PG 자체 문법 오류 (적절) |
| Oracle | DELIMITER 제거 → Oracle 트리거 번역기 매칭 → PG 함수+트리거 시뮬레이션 |

### 복원 방법

HIST-20260512-005 복원 시: `execute()`에서 `DELIMITER` 전처리 블록 제거

---

## HIST-20260512-004

- **날짜**: 2026-05-12
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: CREATE TRIGGER EXECUTE FUNCTION 참조 함수 스텁 자동 생성, MySQL·Oracle에 EXECUTE FUNCTION 차단 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/PracticeService.java` | 수정 | `execute()`에 스텁 자동 생성, `validateDialectSyntax()` MySQL·Oracle 블록에 EXECUTE FUNCTION 검증 추가 |

### 수정 상세

#### `PracticeService.java`

**테스트 SQL:**
```sql
CREATE TRIGGER trg_example
AFTER INSERT ON prac_departments
FOR EACH ROW EXECUTE FUNCTION func_log_changes();
```

| 방언 | 수정 전 | 수정 후 |
|------|---------|---------|
| PostgreSQL | "function func_log_changes() does not exist" 오류 | 스텁 함수 자동 생성 후 트리거 시뮬레이션 성공 |
| MySQL | 검증 없이 PostgreSQL 오류 노출 | `[MySQL 방언] EXECUTE FUNCTION 미지원` 명확 오류 |
| Oracle | 검증 없이 PostgreSQL 오류 노출 | `[Oracle 방언] EXECUTE FUNCTION 미지원` 명확 오류 |

**스텁 자동 생성 원리 (PostgreSQL 모드):**
- `CREATE TRIGGER ... EXECUTE FUNCTION/PROCEDURE func_name()` 패턴 감지
- 동일 트랜잭션 내에 스텁 함수 선행 생성: `CREATE OR REPLACE FUNCTION func_name() RETURNS TRIGGER AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql`
- `---SPLIT---` 마커로 스텁 + 트리거를 순차 실행 후 트랜잭션 전체 롤백
- 실제 DB에는 함수도 트리거도 남지 않음

### 복원 방법

HIST-20260512-004 복원 시:
- `execute()`에서 `CREATE TRIGGER ... EXECUTE FUNCTION` 스텁 생성 블록 제거
- `validateDialectSyntax()` MySQL·Oracle 블록에서 EXECUTE FUNCTION 검사 2줄씩 제거

---

## HIST-20260512-003

- **날짜**: 2026-05-12
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: DDL에서 `$$` 달러 쿼트 미종료 시 `$$ LANGUAGE plpgsql` 자동 완성

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/PracticeService.java` | 수정 | `execute()`에 `$$` 홀수 개 감지 후 자동 완성 로직 추가 |

### 수정 상세

#### `PracticeService.java`

**테스트 SQL:**
```sql
CREATE OR REPLACE FUNCTION func_log_changes() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO prac_departments(name) VALUES ('Change detected');
    RETURN NEW;
END;
```

**원인:** `execute()`가 끝의 `;`를 제거하면 `END;` → `END`가 되는데, 닫는 `$$ LANGUAGE plpgsql`이 없어 PostgreSQL이 "Unterminated dollar quote" 오류를 반환.

| 방언 | 수정 전 | 수정 후 |
|------|---------|---------|
| PostgreSQL | "Unterminated dollar quote" JDBC 오류 | `$$ LANGUAGE plpgsql` 자동 완성 → 정상 시뮬레이션 |
| MySQL | `[MySQL 방언] 달러 쿼팅 미지원` 오류 (이미 적절) | 동일 (변경 없음) |
| Oracle | `[Oracle 방언] 달러 쿼팅 미지원` 오류 (이미 적절) | 동일 (변경 없음) |

**동작 원리:** `sql.split("\\$\\$", -1).length - 1`로 `$$` 토큰 개수를 세어 홀수이면 미종료로 판단, `\n$$ LANGUAGE plpgsql`을 자동 추가. MySQL/Oracle은 `$$` 자체를 방언 검증에서 차단하므로 자동 완성이 개입하지 않음.

- 변경 전: 세미콜론 제거 직후 바로 `upper` 선언
- 변경 후: `$$` 홀수 개 감지 블록 추가 후 `upper` 선언

### 복원 방법

HIST-20260512-003 복원 시: `execute()`에서 `$$` 자동 완성 블록(isDdlStart && dollarCount % 2 == 1) 3줄 제거

---

## HIST-20260512-002

- **날짜**: 2026-05-12
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: Oracle 프로시저 문법 지원 — IS/AS BEGIN...END 구조 + SYS_REFCURSOR 번역, MySQL에 SYS_REFCURSOR 차단 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/PracticeService.java` | 수정 | `translateOracle()`에 프로시저 변환 추가, `validateDialectSyntax()` MySQL 블록에 SYS_REFCURSOR 검증 추가 |

### 수정 상세

#### `PracticeService.java`

**테스트 SQL:**
```sql
CREATE OR REPLACE PROCEDURE proc_get_user(p_id IN NUMBER, p_cursor OUT SYS_REFCURSOR)
IS
BEGIN
    OPEN p_cursor FOR SELECT * FROM example_table WHERE id = p_id;
END;
```

| 방언 | 동작 | 사유 |
|------|------|------|
| PostgreSQL | 오류 | NUMBER, SYS_REFCURSOR 미지원 → PostgreSQL 자체 오류 (적절) |
| MySQL | 명확한 방언 오류 | `[MySQL 방언] SYS_REFCURSOR 미지원` 메시지 출력 |
| Oracle | 정상 시뮬레이션 | PostgreSQL PROCEDURE로 변환 후 실행 |

**Oracle 번역 과정:**
1. `NUMBER` → `INTEGER` (기존 규칙)
2. Oracle 파라미터 순서 변환: `name mode type` → `mode name type`
   - `p_id IN INTEGER` → `IN p_id INTEGER`
   - `p_cursor OUT SYS_REFCURSOR` → SYS_REFCURSOR→REFCURSOR → `OUT p_cursor REFCURSOR` → `INOUT p_cursor REFCURSOR`
3. `IS BEGIN...END` → `LANGUAGE plpgsql AS $$ BEGIN...END; $$`

**번역 결과:**
```sql
CREATE OR REPLACE PROCEDURE proc_get_user(IN p_id INTEGER, INOUT p_cursor REFCURSOR)
LANGUAGE plpgsql
AS $$
BEGIN
    OPEN p_cursor FOR SELECT * FROM example_table WHERE id = p_id;
END;
$$
```

- `validateDialectSyntax()` MySQL 블록에 `SYS_REFCURSOR` 포함 시 오류 반환 추가
- `translateOracle()` 트리거 변환 직전에 Oracle 프로시저 Matcher 블록 추가

### 복원 방법

HIST-20260512-002 복원 시:
- `validateDialectSyntax()` MySQL 블록에서 `SYS_REFCURSOR` 검사 2줄 제거
- `translateOracle()` 에서 Oracle 프로시저 Matcher 블록(oProcM) 제거

---

## HIST-20260512-001

- **날짜**: 2026-05-12
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: Oracle 트리거 문법 지원 — Oracle BEGIN...END 트리거 → PG 함수+트리거 변환, MySQL에 :NEW/:OLD 차단 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/PracticeService.java` | 수정 | `translateOracle()`에 트리거 변환 추가, `validateDialectSyntax()` MySQL 블록에 `:NEW`/`:OLD` 검증 추가 |

### 수정 상세

#### `PracticeService.java`

**테스트 SQL 동작 기대값:**

```sql
CREATE OR REPLACE TRIGGER trg_before_update
BEFORE UPDATE ON prac_employees
FOR EACH ROW
BEGIN
    :NEW.hire_date := SYSDATE;
END;
```

| 방언 | 기대 동작 | 수정 전 | 수정 후 |
|------|----------|---------|---------|
| PostgreSQL | 오류 (Oracle 전용 문법) | `:` 문법 오류 → 적절 (변경 없음) | 동일 |
| MySQL | 오류 (Oracle 전용 `:NEW`/`:OLD`) | 오류 발생하나 방언 검증 메시지 없이 PG 오류 노출 | `[MySQL 방언] :NEW/:OLD 미지원` 명확 오류 |
| Oracle | 정상 시뮬레이션 | `:NEW`, BEGIN...END 미변환 → PG 실행 오류 | 함수+트리거로 변환 후 정상 시뮬레이션 |

**`validateDialectSyntax()` MySQL 블록 추가:**
- 변경 전: `:NEW.`/`:OLD.` 검사 없음
- 변경 후: `up.contains(":NEW.") || up.contains(":OLD.")` → MySQL 오류 메시지 반환

**`translateOracle()` 끝에 Oracle 트리거 변환 추가:**
- 패턴: `CREATE [OR REPLACE] TRIGGER name BEFORE|AFTER event ON table FOR EACH ROW BEGIN...END;`
- 변환 1: `:NEW.` → `NEW.`, `:OLD.` → `OLD.` (Oracle 행 참조 → PostgreSQL 행 참조)
- 변환 2: Oracle 인라인 본문 → `CREATE OR REPLACE FUNCTION func_name() RETURNS TRIGGER ... $$ LANGUAGE plpgsql` + `---SPLIT---` + `CREATE OR REPLACE TRIGGER ... EXECUTE FUNCTION func_name()`
- `SYSDATE` 등 타입/함수 치환은 이 변환 이전에 이미 완료되므로 본문 내에서 자동 반영됨

### 복원 방법

HIST-20260512-001 복원 시:
- `validateDialectSyntax()` MySQL 블록에서 `:NEW`/`:OLD` 검사 2줄 제거
- `translateOracle()` 끝의 Oracle 트리거 Matcher 블록 제거

---

## HIST-20260511-031

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: Oracle MODIFY RESTART 번역 시 SERIAL 컬럼 대응 — ALTER SEQUENCE로 자동 재작성

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/PracticeService.java` | 수정 | `resolveRestartWith()` 메서드 추가, `execute()`에서 Oracle 방언 시 호출 |

### 수정 상세

#### `PracticeService.java`

**원인**: Oracle `MODIFY(col RESTART START WITH n)` → `ALTER COLUMN col RESTART WITH n`으로 번역되지만, PostgreSQL에서 이 문법은 `GENERATED AS IDENTITY` 컬럼에만 동작한다. `prac_employees.id` 등 `SERIAL` 타입 컬럼에 사용하면 "column is not an identity column" 오류가 발생한다.

**변경 전**: 번역된 `ALTER COLUMN col RESTART WITH n`을 그대로 실행 → SERIAL 컬럼에서 오류

**변경 후**: `resolveRestartWith()` 메서드가 번역 직후 다음 로직으로 재작성:
1. `pg_attribute.attidentity`로 IDENTITY 여부 확인
2. IDENTITY 컬럼이면 원본 SQL 그대로 사용
3. SERIAL 컬럼이면 `pg_get_serial_sequence()`로 시퀀스명 조회 후 `ALTER SEQUENCE seq RESTART WITH n`으로 교체
4. 테이블/컬럼 미존재(조회 불가)면 원본 SQL 유지 → PostgreSQL 자체 오류 반환

- 변경 전: `execute()` 내 `translatedSql = translateToPostgres(sql, dialect)` 후 바로 `simulateDml` 호출
- 변경 후: Oracle 방언 시 `translatedSql = resolveRestartWith(translatedSql)` 추가 처리 후 호출

### 복원 방법

HIST-20260511-031 복원 시:
- `execute()`에서 `resolveRestartWith` 호출 블록 제거
- `resolveRestartWith()` 메서드 전체 제거

---

## HIST-20260511-030

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: Oracle MODIFY(...) → PostgreSQL ALTER COLUMN 자동 변환 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/src/main/java/com/tpmp/testprep/service/PracticeService.java` | 수정 | `translateOracle()`에 MODIFY 구문 4가지 변환 규칙 추가 |

### 수정 상세

#### `PracticeService.java`

- 변경 전: `translateOracle()`에 MODIFY 변환 없음 → Oracle 방언에서 `ALTER TABLE t MODIFY(col RESTART START WITH n)` 실행 시 PostgreSQL 문법 오류 발생
- 변경 후: 아래 4가지 MODIFY 패턴을 PostgreSQL 동등 구문으로 변환

| Oracle MODIFY 패턴 | 변환 후 PostgreSQL |
|--------------------|--------------------|
| `MODIFY(col RESTART START WITH n)` | `ALTER COLUMN col RESTART WITH n` |
| `MODIFY(col RESTART)` | `ALTER COLUMN col RESTART` |
| `MODIFY(col NOT NULL)` | `ALTER COLUMN col SET NOT NULL` |
| `MODIFY(col NULL)` | `ALTER COLUMN col DROP NOT NULL` |

- 이유: `ALTER TABLE t MODIFY(id RESTART START WITH 1000)`은 Oracle에서 IDENTITY 컬럼의 시퀀스 재시작을 위한 유효한 DDL이나, PostgreSQL에는 MODIFY 키워드가 없어 번역 없이 실행하면 오류 발생

### 복원 방법

HIST-20260511-030 복원 시: `translateOracle()`에서 MODIFY 관련 4개 `replaceAll` 블록을 제거한다.

---

## HIST-20260511-029

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: Oracle 번역 NUMBER 분기 — 괄호 없는 NUMBER → INTEGER(FK 타입 호환), NUMBER(p,s) → NUMERIC

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/PracticeService.java` | 수정 | `translateOracle()` NUMBER 번역 규칙 분기 |
| `docs/claude-config/system-practice-range.md` | 수정 | Oracle→PG 변환 표 NUMBER 항목 분리 |

### 수정 상세

#### `PracticeService.java` — `translateOracle()`

**문제**: `ref_id NUMBER` → `ref_id NUMERIC`. PostgreSQL FK 제약 시 `NUMERIC ≠ INTEGER(SERIAL)` → "foreign key constraint cannot be implemented" 오류

**변경 전:**
```java
// NUMBER → NUMERIC
sql = sql.replaceAll("(?i)\\bNUMBER\\b", "NUMERIC");
```

**변경 후:**
```java
// NUMBER(p,s) / NUMBER(p) → NUMERIC (정밀도 있는 경우)
sql = sql.replaceAll("(?i)\\bNUMBER\\b(\\s*\\()", "NUMERIC$1");
// NUMBER 단독 → INTEGER (정수 ID·FK 참조 호환)
sql = sql.replaceAll("(?i)\\bNUMBER\\b", "INTEGER");
```

**근거**: Oracle에서 `NUMBER`(괄호 없음)는 정수 ID·FK 참조용으로 주로 사용. prac_employees.id는 SERIAL=INTEGER이므로 FK 참조 컬럼도 INTEGER여야 타입 일치. `NUMBER(p,s)`는 소수점이 있는 금액 등에 사용되므로 NUMERIC 유지.

**부수 효과**: `id NUMBER GENERATED BY DEFAULT AS IDENTITY` → `id INTEGER GENERATED BY DEFAULT AS IDENTITY` — 이전 HIST-028의 NUMERIC→INTEGER for IDENTITY 안전망 규칙과 동일 결과를 더 근본적인 방식으로 해결.

**PostgreSQL 모드 오류 ('type number does not exist')**: Oracle 전용 타입을 PostgreSQL 모드에서 사용한 정상 오류 — 수정 대상 아님.

### 복원 방법

HIST-20260511-029 복원 시:
- `translateOracle()` NUMBER 번역 2줄 → `sql = sql.replaceAll("(?i)\\\\bNUMBER\\\\b", "NUMERIC");` 단일 줄로 복원
- `system-practice-range.md` Oracle 변환 표에서 NUMBER 분기 2줄 → 1줄로 복원

---

## HIST-20260511-028

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: Oracle IDENTITY 컬럼 타입 오류 수정 + MySQL 방언 검증에 Oracle 전용 타입·함수 차단 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/PracticeService.java` | 수정 | `translateOracle()` NUMERIC→INTEGER for IDENTITY, `validateDialectSyntax()` MySQL 검증 확장 |
| `docs/claude-config/system-practice-range.md` | 수정 | 방언 역검증 표 MySQL 항목 추가 |

### 수정 상세

#### `PracticeService.java`

**문제**: Oracle 모드에서 `NUMBER GENERATED BY DEFAULT AS IDENTITY` → `NUMERIC GENERATED BY DEFAULT AS IDENTITY`로 변환됨. PostgreSQL은 IDENTITY 컬럼에 SMALLINT/INTEGER/BIGINT만 허용하므로 "identity column type must be smallint, integer, or bigint" 오류 발생.

**`translateOracle()` 수정:**
```java
// NUMBER→NUMERIC 변환 후 IDENTITY 컬럼에 NUMERIC이 남으면 PG 오류
// NUMERIC/DECIMAL GENERATED ... → INTEGER GENERATED ...
sql = sql.replaceAll("(?i)\\b(?:NUMERIC|DECIMAL)\\b(\\s+GENERATED\\b)", "INTEGER$1");
```
- 적용 위치: 기존 NUMBER→NUMERIC 변환 이후 마지막 단계로 추가
- 결과: `NUMBER GENERATED ALWAYS AS IDENTITY` → `NUMERIC GENERATED ALWAYS AS IDENTITY` → `INTEGER GENERATED ALWAYS AS IDENTITY`

**`validateDialectSyntax()` MySQL 블록 수정:**
- `GENERATED ALWAYS AS IDENTITY` 체크 → `GENERATED [ALWAYS|BY DEFAULT] AS IDENTITY` 로 확장
- Oracle 전용 타입 차단(DDL): `VARCHAR2`, `NUMBER`
- Oracle 전용 함수 차단: `SYSDATE`, `NVL(`

### 주의 사항

Oracle 모드에서 `REFERENCES parent_table(id)` 형태의 외래키는 연습장에 `parent_table`이 없어 런타임 오류 발생. `prac_` 접두사 테이블을 참조하거나 FK 절을 제거해야 함.

### 복원 방법

HIST-20260511-028 복원 시:
- `translateOracle()`: NUMERIC/DECIMAL GENERATED 변환 2줄 삭제
- `validateDialectSyntax()` MySQL 블록: GENERATED 체크를 `ALWAYS`만으로 복원, VARCHAR2/NUMBER/SYSDATE/NVL 체크 8줄 삭제
- `system-practice-range.md`: MySQL 역검증 표에서 5줄 삭제

---

## HIST-20260511-027

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: 방언 역검증 — Oracle 모드에서 ADD COLUMN, TRUE/FALSE 리터럴 차단 추가

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/PracticeService.java` | 수정 | Oracle: `ADD COLUMN`, `TRUE`/`FALSE` 리터럴 차단 추가 |
| `docs/claude-config/system-practice-range.md` | 수정 | 방언 역검증 표에 ADD COLUMN·TRUE/FALSE 항목 추가 |

### 수정 상세

**배경**: `ALTER TABLE prac_employees ADD COLUMN is_remote BOOLEAN DEFAULT false` 실행 시
- `BOOLEAN` → 기존 규칙으로 Oracle 모드에서 차단됨
- `ADD COLUMN` → Oracle은 `ADD (col type)` 사용, `COLUMN` 키워드 미지원, 미차단 상태였음
- `false` → Oracle SQL에서 TRUE/FALSE 리터럴 미지원(23c 이전), 미차단 상태였음

**추가 규칙 (`validateDialectSyntax()` Oracle 블록):**
- `isDdl && ADD\s+COLUMN` 패턴 → `ADD (col_name type [DEFAULT value])` 안내
- `\b(TRUE|FALSE)\b` 패턴 (문자열 리터럴 제거 후) → `1/0` 또는 `'Y'/'N'` 안내

**TRUE/FALSE 차단 범위**: DDL뿐 아니라 DML·SELECT 포함 전체 SQL — Oracle SQL에서 TRUE/FALSE 리터럴은 어디서도 유효하지 않음

### 복원 방법

HIST-20260511-027 복원 시:
- `validateDialectSyntax()` 내 Oracle `ADD COLUMN` 체크 2줄, `TRUE|FALSE` 체크 2줄 삭제
- `system-practice-range.md` 역검증 표에서 ADD COLUMN, TRUE/FALSE 2줄 삭제

---

## HIST-20260511-026

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: 방언 역검증 — ALTER COLUMN 관련 PostgreSQL 전용 문법 MySQL/Oracle 모드에서 차단

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/PracticeService.java` | 수정 | MySQL: `ALTER COLUMN TYPE`, `ALTER COLUMN SET/DROP NOT NULL` 차단 / Oracle: `ALTER COLUMN` 전체 차단 |
| `docs/claude-config/system-practice-range.md` | 수정 | 방언 역검증 표에 ALTER COLUMN 항목 추가 |

### 수정 상세

#### `PracticeService.java` — `validateDialectSyntax()`

**추가 규칙 (MySQL):**
- `ALTER COLUMN col TYPE new_type` → `MODIFY COLUMN col new_type` 안내
- `ALTER COLUMN col SET NOT NULL` / `ALTER COLUMN col DROP NOT NULL` → `MODIFY COLUMN col type [NOT NULL|NULL]` 안내
- MySQL은 `ALTER TABLE t ALTER [COLUMN] col SET/DROP DEFAULT`는 지원하므로 `ALTER COLUMN` 전체 차단 대신 TYPE·NOT NULL 패턴만 차단

**추가 규칙 (Oracle):**
- `ALTER COLUMN` (DDL 컨텍스트) 전체 차단 → Oracle은 `ALTER COLUMN` 키워드 자체가 없음, `MODIFY (col ...)` 사용

### 복원 방법

HIST-20260511-026 복원 시:
- `validateDialectSyntax()` 내 MySQL ALTER COLUMN TYPE 체크 2줄 삭제
- Oracle ALTER COLUMN 체크 1줄 삭제
- `system-practice-range.md` 역검증 표에서 ALTER COLUMN 3줄 삭제

---

## HIST-20260511-025

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: 방언 역검증 추가 — MySQL/Oracle 선택 시 해당 DB에서 유효하지 않은 PostgreSQL 전용 문법 실행 전 차단

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/PracticeService.java` | 수정 | `validateDialectSyntax()` 추가, `execute()`에 호출 삽입 |
| `docs/claude-config/system-practice-range.md` | 수정 | 방언 역검증 표 추가(2-3절), DDL 예제 [공통]→[PG] 태그 수정 |

### 수정 상세

#### `PracticeService.java`

**배경**: MySQL/Oracle 방언 선택 시 PostgreSQL 전용 문법(`SERIAL`, `TEXT`, `$$`, `NOW()` 등)을 입력해도 번역 없이 PostgreSQL에서 실행되어 성공했음. 실제 해당 DB에서는 오류가 발생하는 문법인데 연습장이 무조건 통과시키는 모순 존재.

**추가 메서드: `validateDialectSyntax(sql, userEmail, dialect)`**

- `postgresql` 또는 `null` → 검증 건너뜀
- 문자열 리터럴(`'...'`) 제거 후 검사하여 false positive 방지
- MySQL 방언 차단 목록: `$$`, `LANGUAGE plpgsql`, `RETURNING`, `GENERATED ALWAYS AS IDENTITY`, `ILIKE`
- Oracle 방언 차단 목록: `SERIAL`, `TEXT`(DDL), `BOOLEAN`(DDL), `NOW()`, `LIMIT N`, `AUTO_INCREMENT`, `$$`, `LANGUAGE plpgsql`, `ILIKE`
- 오류 발생 시 모든 위반 항목을 `•` 목록으로 반환, 대안 문법 안내

**호출 위치 (`execute()`):**
```
// DO 블록 시퀀스 차단 이후, translateToPostgres() 호출 이전
SqlResult dialectError = validateDialectSyntax(sql, userEmail, dialect);
if (dialectError != null) return dialectError;
```

#### `system-practice-range.md`

- 2-3절: 방언 역검증 표 추가 (차단 문법 + 대안)
- DDL 예제 섹션: `[공통]` 태그 제거, CREATE TABLE·ALTER TABLE → `[PG]` 명시, DROP TABLE만 `[공통]` 유지

### 복원 방법

HIST-20260511-025 복원 시:
- `validateDialectSyntax()` 메서드 전체 삭제
- `execute()` 내 `dialectError` 호출 2줄 삭제
- `system-practice-range.md`: 방언 역검증 표 삭제, DDL 섹션을 원래 `[공통]` 태그로 복원

---

## HIST-20260511-024

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: 비트랜잭션 연산(nextval 등) DB 영구 반영 차단 + 관리 함수 차단 + 트랜잭션 격리(REQUIRES_NEW)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/PracticeService.java` | 수정 | nextval 차단, 관리함수 차단, DO블록 시퀀스 차단, PROPAGATION_REQUIRES_NEW |

### 수정 상세

#### `PracticeService.java`

**문제 1: `SELECT nextval(...)` — DB 영구 반영 (확정 버그)**
- `nextval()`은 PostgreSQL 비트랜잭션 시퀀스 함수로, 트랜잭션 롤백 후에도 시퀀스 카운터가 영구 증가함
- 기존에는 `SETVAL(` 만 차단하고 `NEXTVAL(` 은 미차단 → SELECT 경로로 실제 실행됨
- 변경 전: `if (isSelect && upper.contains("SETVAL("))`
- 변경 후: `if (isSelect && (upper.contains("SETVAL(") || upper.contains("NEXTVAL(")))`

**문제 2: DB 관리 함수 무차단**
- `SELECT pg_terminate_backend(pid)` 등 관리 함수가 SELECT 경로에서 실제 실행 가능했음
- 변경 후: `PG_TERMINATE_BACKEND(`, `PG_CANCEL_BACKEND(`, `PG_RELOAD_CONF(`, `PG_ROTATE_LOGFILE(` 포함 SELECT 차단(에러 반환)

**문제 3: DO 블록 내 시퀀스 함수**
- `DO $$ BEGIN PERFORM nextval('seq'); END; $$` — 외부 트랜잭션은 롤백되지만 내부 nextval/setval은 비트랜잭션 연산으로 영구 반영
- 변경 후: `DO`로 시작하는 SQL에 `SETVAL(`/`NEXTVAL(` 포함 시 실행 없이 시뮬레이션 반환

**문제 4: 트랜잭션 전파 방식 개선**
- 기존 `new DefaultTransactionDefinition()` → `PROPAGATION_REQUIRED` (기본값) — 외부 트랜잭션이 있으면 JOIN하여 rollback() 호출 시 외부 트랜잭션이 rollback-only로 표시될 위험
- 변경 후: DCL 경로와 DML/DDL 경로 모두 `PROPAGATION_REQUIRES_NEW` 적용 → 항상 독립 트랜잭션으로 격리

**추가 import:**
- `import org.springframework.transaction.TransactionDefinition;`

### 복원 방법

HIST-20260511-024 복원 시:
- `TransactionDefinition` import 제거
- `NEXTVAL(` 차단 제거: `upper.contains("SETVAL(") || upper.contains("NEXTVAL(")` → `upper.contains("SETVAL(")`
- DB 관리 함수 차단 블록 제거 (3줄)
- DO 블록 시퀀스 차단 블록 제거 (5줄)
- `PROPAGATION_REQUIRES_NEW` 설정 제거: `new DefaultTransactionDefinition()` 복원 (DCL, DML/DDL 각 1곳)

---

## HIST-20260511-023

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: INDEX·VIEW·FUNCTION·PROCEDURE·TRIGGER 시뮬레이션 지원 + SELECT setval() 안전 처리 + 멀티 스테이트먼트 검사 개선 + MySQL DDL 자동 변환 확장

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/PracticeService.java` | 수정 | `execute()` 개선, `simulateDml()` 복합 DDL 지원, `detectDmlType()` 세분화, `translateMysql()` 확장 |

### 수정 상세

#### `PracticeService.java`

**`execute()` — 멀티 스테이트먼트 차단 개선:**
- 변경 전: 모든 SQL에서 중간 세미콜론 무조건 차단 → `CREATE FUNCTION/PROCEDURE`의 body 세미콜론도 차단됨
- 변경 후: DDL(CREATE/ALTER/DROP)은 검사 제외 (함수·프로시저 body에 세미콜론 허용)
- 비DDL은 단일 따옴표 + `$$...$$` 달러 쿼팅 내부 세미콜론을 제외하고 검사

**`execute()` — `SELECT setval()` 안전 처리:**
- `SELECT setval(...)` 감지 시 실제 실행 없이 시뮬레이션 반환
- 이유: PostgreSQL 시퀀스 연산은 롤백되지 않아 실제 DB에 영구 변경이 발생할 수 있음

**`simulateDml()` — 복합 DDL 지원:**
- DDL 경로에 SPLIT 마커(`\n---SPLIT---\n`) 처리 추가
- MySQL 트리거처럼 함수+트리거 두 문장으로 변환된 경우, 각 문장을 동일 트랜잭션 내에서 순차 실행 후 롤백

**`detectDmlType()` — CREATE 세부 타입 분류:**

| 입력 키워드 | 반환값 (변경 전) | 반환값 (변경 후) |
|-------------|----------------|----------------|
| `CREATE INDEX ...` | `"CREATE"` | `"CREATE INDEX"` |
| `CREATE OR REPLACE VIEW ...` | `"CREATE"` | `"CREATE VIEW"` |
| `CREATE OR REPLACE FUNCTION ...` | `"CREATE"` | `"CREATE FUNCTION"` |
| `CREATE OR REPLACE PROCEDURE ...` | `"CREATE"` | `"CREATE PROCEDURE"` |
| `CREATE TRIGGER ...` | `"CREATE"` | `"CREATE TRIGGER"` |
| `CREATE TABLE ...` | `"CREATE"` | `"CREATE TABLE"` (기존 유지) |

**`translateMysql()` — 신규 변환 규칙 추가:**

1. **시퀀스 리셋:**
   - `ALTER TABLE t AUTO_INCREMENT = 1000` → `ALTER TABLE t ALTER COLUMN id RESTART WITH 1000`

2. **MySQL PROCEDURE → PostgreSQL 형식:**
   ```
   CREATE PROCEDURE name(params) BEGIN...END
   → CREATE OR REPLACE PROCEDURE name(params) LANGUAGE plpgsql AS $$ BEGIN...END; $$
   ```

3. **MySQL TRIGGER (BEGIN...END 인라인) → PostgreSQL 함수 + 트리거:**
   ```
   CREATE TRIGGER trg AFTER INSERT ON tbl FOR EACH ROW BEGIN...END
   → CREATE OR REPLACE FUNCTION func_trg() RETURNS TRIGGER AS $$ BEGIN...END; $$ LANGUAGE plpgsql
     ---SPLIT---
     CREATE TRIGGER trg AFTER INSERT ON tbl FOR EACH ROW EXECUTE FUNCTION func_trg()
   ```

### 지원 SQL 테스트 목록

| SQL 종류 | PostgreSQL 모드 | MySQL 모드 |
|---------|----------------|-----------|
| `ALTER TABLE t ALTER COLUMN id RESTART WITH N` | ✅ 시뮬레이션 | ✅ 그대로 실행 |
| `ALTER TABLE t AUTO_INCREMENT = N` | ❌ 문법 오류 | ✅ → RESTART WITH N 변환 |
| `SELECT setval(pg_get_serial_sequence(...), N, false)` | ✅ 시뮬레이션(실행 없음) | ✅ 시뮬레이션 |
| `CREATE INDEX idx ON tbl(col)` | ✅ 시뮬레이션 | ✅ 동일 |
| `CREATE OR REPLACE VIEW ...` | ✅ 시뮬레이션 | ✅ 동일 |
| `CREATE OR REPLACE FUNCTION ... $$ ... $$ LANGUAGE plpgsql` | ✅ 시뮬레이션 | N/A |
| `CREATE TRIGGER ... EXECUTE FUNCTION ...` | ✅ 시뮬레이션 | N/A |
| `CREATE TRIGGER ... FOR EACH ROW BEGIN...END` (MySQL 인라인) | ❌ 문법 오류 | ✅ → 함수+트리거 변환 |
| `CREATE OR REPLACE PROCEDURE ... LANGUAGE plpgsql AS $$...$$` | ✅ 시뮬레이션 | N/A |
| `CREATE PROCEDURE name(params) BEGIN...END` (MySQL) | ❌ 문법 오류 | ✅ → PostgreSQL 형식 변환 |

### 복원 방법

HIST-20260511-023 복원 시:
- `execute()`: DDL 예외 처리(`isDdlStart`) 제거, `withoutStrings` 한 줄로 복원, `SELECT setval()` 감지 블록 제거
- `simulateDml()`: SPLIT 마커 처리 블록 제거, `jdbcTemplate.execute(sql)` 단일 호출로 복원
- `detectDmlType()`: `CREATE` 분기를 `return "CREATE"`로 단순화
- `translateMysql()`: AUTO_INCREMENT 리셋 규칙, `procM` Matcher 블록, `trigM` Matcher 블록 제거

---

## HIST-20260511-022

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: 권한 쿼리(information_schema) SELECT 허용 + GRANT/REVOKE 시뮬레이션 개선 (역할 부재 오류 무시)

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/PracticeService.java` | 수정 | `execute()`에 `information_schema` / `pg_catalog` 화이트리스트 추가, `simulateDml()`에 DCL 분기 추가 |

### 수정 상세

#### `PracticeService.java`

**`execute()` — SELECT 테이블 검증 완화:**
- 변경 전: `prac_` 접두사 테이블만 허용
- 변경 후: `information_schema`, `pg_catalog` 스키마 추가 허용 (권한 조회 목적)

```java
Set<String> allowedSchemas = Set.of("information_schema", "pg_catalog");
List<String> invalid = tables.stream()
    .filter(t -> !t.startsWith("prac_") && !allowedSchemas.contains(t))
    .toList();
```

허용되는 권한 조회 쿼리 예시:
```sql
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'username';
```

**`simulateDml()` — DCL(GRANT/REVOKE) 분기 신규 추가:**
- 변경 전: GRANT/REVOKE도 DML/DDL과 동일하게 `jdbcTemplate.execute()` 실행 → 역할 부재 시 오류 반환
- 변경 후: DCL 전용 분기 — 실행 후 항상 롤백, `does not exist` 오류(역할·테이블 없음)는 무시하고 시뮬레이션 성공 반환

동작 케이스:
| 입력 | 결과 |
|------|------|
| `GRANT SELECT ON prac_departments TO someuser` | 시뮬레이션 완료 (역할 없어도 성공) |
| `REVOKE INSERT ON prac_employees FROM someuser` | 시뮬레이션 완료 |
| `GRNAT SELECT ON prac_departments TO user` (오타) | 문법 오류 반환 |
| `GRANT INVALID_PRIV ON prac_departments TO user` | 오류 반환 (unrecognized privilege) |

### 복원 방법

HIST-20260511-022 복원 시:
- `execute()`에서 `allowedSchemas` 제거, 필터 조건을 `!t.startsWith("prac_")`으로 복원
- `simulateDml()`에서 `isDcl` 분기 및 DCL 전용 처리 블록 제거

---

## HIST-20260511-021

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: MySQL/Oracle 방언 지원 — dialect 파라미터 수신 후 PostgreSQL 문법으로 자동 변환 후 실행

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../controller/UserPracticeController.java` | 수정 | `SqlRequest`에 `dialect` 필드 추가, `execute()` 호출 시 전달 |
| `backend/.../service/PracticeService.java` | 수정 | `execute()` · `simulateDml()` 시그니처에 `dialect` 추가, `translateToPostgres()` · `translateMysql()` · `translateOracle()` 메서드 추가 |

### 수정 상세

#### `UserPracticeController.java`

- `SqlRequest(String sql)` → `SqlRequest(String sql, String dialect)`
- `practiceService.execute(request.sql(), email)` → `practiceService.execute(request.sql(), email, request.dialect())`

#### `PracticeService.java`

**`execute()` 변경:**
- `execute(String rawSql, String userEmail)` → `execute(String rawSql, String userEmail, String dialect)`
- DML/DDL 실행 전 `translateToPostgres(sql, dialect)` 호출, 변환된 SQL로 시뮬레이션 실행
- SELECT 실행 전 동일하게 변환 적용 (테이블 검증은 원본 SQL 기준 유지)

**`simulateDml()` 변경:**
- 파라미터: `(String sql, String upper)` → `(String sql, String upper, String dialect)`
- 성공 메시지에 방언 변환 메모 추가: `[MySQL 방언 → PostgreSQL 자동 변환]`

**`translateToPostgres()` 신규:**
- dialect가 `postgresql`이거나 null이면 원본 반환
- `mysql` → `translateMysql()`, `oracle` → `translateOracle()` 위임

**`translateMysql()` 신규:**
| 변환 전 | 변환 후 |
|--------|--------|
| 백틱 `` `name` `` | 제거 |
| `AUTO_INCREMENT` | `GENERATED ALWAYS AS IDENTITY` |
| `UNIQUE KEY name (col)` | `CONSTRAINT name UNIQUE (col)` |
| `KEY name (col)` (인덱스 전용) | 제거 |
| `DATETIME` | `TIMESTAMP` |
| `TINYINT` | `SMALLINT` |
| `MEDIUMINT` | `INTEGER` |
| `UNSIGNED` | 제거 |
| `CHARACTER SET utf8mb4` | 제거 |
| `COLLATE ...` | 제거 |
| `COMMENT '...'` (컬럼 뒤) | 제거 |
| `ENGINE=InnoDB DEFAULT CHARSET=...` (테이블 옵션) | 제거 |
| `IFNULL(a, b)` | `COALESCE(a, b)` |

**`translateOracle()` 신규:**
| 변환 전 | 변환 후 |
|--------|--------|
| `VARCHAR2(n)` | `VARCHAR(n)` |
| `NVARCHAR2(n)` | `VARCHAR(n)` |
| `NUMBER` | `NUMERIC` |
| `CLOB` | `TEXT` |
| `BLOB` | `BYTEA` |
| `NCHAR` | `CHAR` |
| `SYSDATE` | `CURRENT_TIMESTAMP` |
| `NVL(a, b)` | `COALESCE(a, b)` |
| `FROM DUAL` | `FROM (SELECT 1) AS dual` |

**테스트 케이스 (MySQL 방언):**
```sql
CREATE TABLE example_table (
    id INT NOT NULL AUTO_INCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_email (email),
    KEY idx_ref (ref_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
- 변경 전: `syntax error at or near "AUTO_INCREMENT"`
- 변경 후: `CREATE 문 시뮬레이션 완료 [MySQL 방언 → PostgreSQL 자동 변환]`

### 복원 방법

HIST-20260511-021 복원 시:
- `UserPracticeController.java`: `SqlRequest(String sql, String dialect)` → `SqlRequest(String sql)`, `execute()` 호출에서 `request.dialect()` 제거
- `PracticeService.java`: `execute()` · `simulateDml()` 시그니처에서 `dialect` 제거, `dialectNote` 제거, `translateToPostgres()` · `translateMysql()` · `translateOracle()` 메서드 제거

---

## HIST-20260511-020

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: DML/DDL 시뮬레이션을 트랜잭션 롤백 방식으로 전환 — 문법 오류 반환 및 영향 행 수 표시

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/PracticeService.java` | 수정 | `simulateDml()` 트랜잭션 롤백 방식으로 재구성, `detectDmlType()` 분리, `PlatformTransactionManager` 주입 추가 |

### 수정 상세

#### `PracticeService.java`

**`PlatformTransactionManager` 의존성 추가:**
- import 추가: `PlatformTransactionManager`, `TransactionStatus`, `DefaultTransactionDefinition`
- 필드 추가: `private final PlatformTransactionManager transactionManager;`

**`simulateDml(String upper)` → `simulateDml(String sql, String upper)` 재구성:**
- 변경 전: DB 접근 없이 즉시 "시뮬레이션 완료" 반환 → 문법 오류 무시
- 변경 후: 트랜잭션 내에서 실제 실행 후 항상 롤백
  - INSERT/UPDATE/DELETE: `jdbcTemplate.update()` → 영향 행 수 포함 메시지 반환
  - DDL/DCL: `jdbcTemplate.execute()` → 실행 성공 시 완료 메시지 반환
  - 예외 발생 시: `extractErrorInfo()`로 PostgreSQL 실제 에러 반환 (위치 정보 포함)

**`detectDmlType(String upper)` 메서드 분리:**
- 기존 `simulateDml()` 내 if-else 체인을 별도 메서드로 추출

**수정 대상 케이스 (테스트 SQL):**
```sql
INSERT INT prac_departments (name, location, budget)
VALUES ('Data Team', 'Seongdong-gu, Seoul', 35000000);
```
- 변경 전: "INSERT 문 시뮬레이션 완료" (오류 없음, 오답)
- 변경 후: `syntax error at or near "INT"` + errorPosition 반환

**정상 INSERT 동작:**
```sql
INSERT INTO prac_departments (name, location, budget)
VALUES ('Data Team', '서울 성동구', 35000000);
```
- 변경 후: "INSERT 문 시뮬레이션 완료 (1행 영향)\n화면에서만 실행되며 실제 DB에는 반영되지 않습니다."

### 복원 방법

HIST-20260511-020 복원 시:
- `PlatformTransactionManager` import 3개 제거
- `transactionManager` 필드 제거
- `simulateDml(String sql, String upper)` → `simulateDml(String upper)` 이전 구조로 복원 (DB 접근 없이 즉시 반환)
- `detectDmlType()` 메서드 제거
- `execute()` 내 호출부 `simulateDml(sql, upper)` → `simulateDml(upper)` 복원

---

## HIST-20260511-018

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: CTE(WITH절) 사용 시 prac_ 테이블 검증 오탐 수정 — CTE 이름을 실제 테이블로 잘못 인식하던 버그 해결

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/PracticeService.java` | 수정 | `extractTableNames()`에 CTE 이름 수집 로직 추가, prac_ 검증 시 CTE 이름 제외 |

### 수정 상세

#### `PracticeService.java`

**`extractTableNames()` 수정:**

- 변경 전: `FROM dept_salary` 등 CTE 참조를 실제 테이블로 인식 → `prac_` 접두사 없음 오류 반환
- 변경 후: `name AS (` 패턴으로 CTE 이름을 먼저 수집하고, 기존 테이블 추출 시 CTE 이름은 건너뜀

추가된 CTE 수집 로직:
```java
Set<String> cteNames = new HashSet<>();
Matcher cteM = Pattern.compile(
    "\\b([a-zA-Z_][a-zA-Z0-9_]*)\\s+AS\\s*\\(",
    Pattern.CASE_INSENSITIVE
).matcher(sql);
while (cteM.find()) {
    cteNames.add(cteM.group(1).toLowerCase());
}
```
테이블 추출 필터 조건:
- 변경 전: `!reserved.contains(name)`
- 변경 후: `!reserved.contains(name) && !cteNames.contains(name)`

**수정 대상 케이스 (테스트 SQL):**
```sql
WITH dept_salary AS (
  SELECT department_id, SUM(salary) AS total
  FROM prac_employees
  GROUP BY department_id
)
SELECT d.name, ds.total
FROM dept_salary ds
JOIN prac_departments d ON d.id = ds.department_id
ORDER BY ds.total DESC;
```
- 변경 전: `dept_salary` → prac_ 없음 → "연습장에서는 'prac_' 접두사 테이블만 조회할 수 있습니다." 오류
- 변경 후: `dept_salary` → CTE 이름으로 인식 → 건너뜀 → `prac_employees`, `prac_departments`만 검증 → 통과

### 복원 방법

HIST-20260511-018 복원 시:
- `extractTableNames()`에서 CTE 이름 수집 블록(`cteNames` 관련 코드) 제거
- 테이블 필터 조건을 `!reserved.contains(name)`으로 복원

---

## HIST-20260511-013

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: SQL DML/DDL/DCL 화면 시뮬레이션화 — 실제 DB 미반영, SELECT만 실제 DB 조회

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/PracticeService.java` | 수정 | `execute()` 재구성, `simulateDml()` 추가, `SqlResult`에 `simulated` 필드 추가, `runDml()` 제거 |

### 수정 상세

#### `PracticeService.java`

**`execute()` 재구성:**
- 변경 전: SELECT/DML/DDL 모두 실제 PostgreSQL 실행 (prac_* 테이블 제한)
- 변경 후: SELECT만 실제 DB 조회 (prac_* 제한 유지), 나머지는 `simulateDml()` 호출

**`simulateDml()` 신규 추가:**
- INSERT/UPDATE/DELETE/CREATE/ALTER/DROP/TRUNCATE/GRANT/REVOKE → `SqlResult.sim()` 반환
- DB 접근 없이 즉시 응답

**`SqlResult` 레코드 변경:**
- `boolean simulated` 필드 추가 (마지막 위치)
- `sim(String type, String message)` 팩토리 추가 (simulated=true)
- 기존 `select()`, `error()` 팩토리는 simulated=false로 유지
- `dml()` 팩토리 및 `runDml()` 메서드 제거 (미사용)

### 복원 방법

HIST-20260511-013 복원 시:
- `execute()`를 이전 구조로 복원 (시스템 명령 차단 + prac_ 전체 검증 + runDml 호출)
- `simulateDml()` 제거
- `SqlResult`에서 `simulated` 필드와 `sim()` 팩토리 제거
- `runDml()` 메서드 복원
- `dml()` 팩토리 복원

---

## HIST-20260511-012

- **날짜**: 2026-05-11
- **수정 범위**: 사용자 백엔드 / 연습장
- **수정 개요**: SQL 에러 메시지 개선 — Spring JDBC 래퍼 메시지 대신 PostgreSQL 실제 에러와 위치 정보 반환

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `backend/.../service/PracticeService.java` | 수정 | `SqlResult`에 `errorPosition` 필드 추가, `extractErrorInfo()` 메서드 추가, catch 블록 개선 |

### 수정 상세

#### `PracticeService.java`

**`SqlResult` 레코드 변경:**
- `Integer errorPosition` 필드 추가 (마지막 위치)
- `error(String message, Integer position)` 오버로드 팩토리 추가
- 기존 `select()`, `dml()`, `error(String)` 팩토리는 `errorPosition=null`로 유지

**`ErrorInfo` private record 추가:**
```java
private record ErrorInfo(String message, Integer position) {}
```

**`extractErrorInfo(Exception e)` 메서드 추가:**
- 예외 체인을 루트 원인까지 순회 (`getCause()` 반복)
- PostgreSQL JDBC 에러 포맷 파싱:
  - `ERROR: ...` → 에러 메시지 본문
  - `Position: N` → 에러 발생 문자 위치 (1-based)
  - `DETAIL: ...` → `\n상세: ...`로 변환 후 메시지에 추가
  - `HINT: ...` → `\n힌트: ...`로 변환 후 메시지에 추가

**catch 블록 변경:**
- 변경 전: `e.getMessage()` 첫 줄만 반환 (Spring JDBC 래퍼 메시지)
- 변경 후: `extractErrorInfo(e)` 로 실제 PostgreSQL 에러 + 위치 추출 후 반환

**효과 (예시):**
- 변경 전: `StatementCallback; bad SQL grammar [SELECT * FROM prac_departments A WHERE A.LOCATION LIK '%영등%']`
- 변경 후: `syntax error at or near "LIK"` + `errorPosition: 51`

### 복원 방법

HIST-20260511-012 복원 시:
- `SqlResult` 레코드에서 `errorPosition` 필드 제거, 관련 `error(String, Integer)` 오버로드 제거
- `ErrorInfo` record 제거
- `extractErrorInfo()` 메서드 제거
- catch 블록을 기존 방식으로 복원:
  ```java
  String msg = e.getMessage();
  if (msg != null && msg.contains("\n")) msg = msg.substring(0, msg.indexOf("\n"));
  return saveAndReturn(userEmail, sql, SqlResult.error(msg != null ? msg : "SQL 실행 중 오류가 발생했습니다."));
  ```
