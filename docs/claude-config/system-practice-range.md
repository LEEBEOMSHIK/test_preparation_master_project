# 연습장 (System Practice Range) 설계 문서

> **위치**: `/user/practice`  
> **스택**: Next.js 14 + Spring Boot 3 + PostgreSQL  
> **목적**: SQL 문법을 안전한 가상 환경에서 실습

---

## 1. 기능 개요

| 탭 | 방식 | 실행 환경 |
|----|------|----------|
| SQL 연습 | SELECT 실제 실행 / DML·DDL·DCL 시뮬레이션 | 백엔드 API → `prac_*` 테이블 |
| OS 명령어 | 완전 시뮬레이션 | 프론트엔드 가상 파일시스템 |
| 사용 가이드 | 정적 문서 | 프론트엔드만 |

---

## 2. SQL 연습

### 2-1. 연습 테이블 구조

모든 연습 테이블은 `prac_` 접두사를 사용한다.

```
prac_departments   부서 (5행)
  columns: id SERIAL PK, name VARCHAR(100), location VARCHAR(100), budget NUMERIC(15,2)

prac_employees     직원 (10행, department_id FK→prac_departments)
  columns: id SERIAL PK, name VARCHAR(100), department_id INT, salary NUMERIC(10,2),
           hire_date DATE, email VARCHAR(100), job_title VARCHAR(100)

prac_products      상품 (8행)
  columns: id SERIAL PK, name VARCHAR(200), category VARCHAR(100),
           price NUMERIC(10,2), stock INT

prac_orders        주문 (12행, product_id FK→prac_products)
  columns: id SERIAL PK, customer_name VARCHAR(100), product_id INT,
           quantity INT, total_amount NUMERIC(10,2), order_date DATE
```

#### 기본 시드 데이터 요약

| 테이블 | 주요 데이터 |
|--------|------------|
| prac_departments | 개발팀(서울 강남구), 마케팅팀(서울 마포구), 인사팀(서울 영등포구), 영업팀(부산 해운대구), 기획팀(서울 강남구) |
| prac_employees | 김민준·이서연·강도현·신예린(개발팀), 박지훈·임재현(마케팅팀), 최수아(인사팀), 정유진·오지수(영업팀), 윤하은(기획팀) |
| prac_products | 도서 4종 (Java, Python, 정보처리기사, SQL), 강의 4종 (AWS, 리눅스, 클라우드, 네트워크 보안) |
| prac_orders | 2026-01-15 ~ 2026-04-30 주문 12건, 고객: 홍길동·이몽룡·성춘향·변학도·김선달 등 |

---

### 2-2. 지원 DB 방언

| 방언 | 처리 방식 | 비고 |
|------|----------|------|
| PostgreSQL | 원문 그대로 백엔드 실행 | SELECT만 실제 DB 반영 |
| MySQL | 자동 변환 후 PostgreSQL 실행 | 방언 배지 `MySQL → PostgreSQL 자동 변환` 표시 |
| Oracle | 자동 변환 후 PostgreSQL 실행 | 방언 배지 `Oracle → PostgreSQL 자동 변환` 표시 |

#### MySQL → PostgreSQL 자동 변환 규칙

| MySQL 문법 | PostgreSQL 변환 결과 |
|-----------|-------------------|
| 백틱 `` `col` `` | 제거 |
| `AUTO_INCREMENT` (컬럼 정의) | `GENERATED ALWAYS AS IDENTITY` |
| `ALTER TABLE t AUTO_INCREMENT = N` | `ALTER TABLE t ALTER COLUMN id RESTART WITH N` |
| `UNIQUE KEY name (col)` | `CONSTRAINT name UNIQUE (col)` |
| `KEY name (col)` (인덱스 전용) | 제거 |
| `DATETIME` | `TIMESTAMP` |
| `TINYINT` | `SMALLINT` |
| `MEDIUMINT` | `INTEGER` |
| `UNSIGNED` | 제거 |
| `CHARACTER SET utf8mb4` | 제거 |
| `COLLATE ...` | 제거 |
| `COMMENT '...'` (컬럼 뒤) | 제거 |
| `ENGINE=InnoDB DEFAULT CHARSET=...` | 제거 |
| `IFNULL(a, b)` | `COALESCE(a, b)` |
| `CREATE PROCEDURE name(p) BEGIN...END` | `CREATE OR REPLACE PROCEDURE name(p) LANGUAGE plpgsql AS $$BEGIN...END;$$` |
| `CREATE TRIGGER name ... FOR EACH ROW BEGIN...END` | 함수 생성(`func_트리거명`) + 트리거 생성으로 분리 (SPLIT 실행) |
| `DELIMITER //` / `DELIMITER ;` | 제거 (클라이언트 전용 명령) — MySQL 모드에서만 허용, 타 방언은 오류 반환 |

#### Oracle → PostgreSQL 자동 변환 규칙

| Oracle 문법 | PostgreSQL 변환 결과 | 비고 |
|------------|-------------------|------|
| `VARCHAR2(n)` | `VARCHAR(n)` | |
| `NVARCHAR2(n)` | `VARCHAR(n)` | |
| `NUMBER` (괄호 없음) | `INTEGER` | 정수 ID·FK 호환 |
| `NUMBER(p,s)` / `NUMBER(p)` | `NUMERIC(p,s)` / `NUMERIC(p)` | 정밀도 유지 |
| `CLOB` | `TEXT` | |
| `BLOB` | `BYTEA` | |
| `NCHAR` | `CHAR` | |
| `SYSDATE` | `CURRENT_TIMESTAMP` | |
| `NVL(a, b)` | `COALESCE(a, b)` | |
| `FROM DUAL` | `FROM (SELECT 1) AS dual` | |
| `SYS_REFCURSOR` (OUT 파라미터) | `REFCURSOR` (INOUT) | 프로시저 파라미터 변환 |
| `MODIFY(col RESTART START WITH n)` | `ALTER COLUMN col RESTART WITH n` | SERIAL 컬럼은 ALTER SEQUENCE로 자동 분기 |
| `MODIFY(col RESTART)` | `ALTER COLUMN col RESTART` | |
| `MODIFY(col NOT NULL)` | `ALTER COLUMN col SET NOT NULL` | |
| `MODIFY(col NULL)` | `ALTER COLUMN col DROP NOT NULL` | |
| `:NEW.col` / `:OLD.col` (트리거 본문) | `NEW.col` / `OLD.col` | |
| `CREATE [OR REPLACE] TRIGGER ... FOR EACH ROW BEGIN...END;` | 함수 생성(`func_트리거명`) + 트리거 생성으로 분리 | |
| `CREATE [OR REPLACE] PROCEDURE name(p IN t, c OUT SYS_REFCURSOR) IS BEGIN...END` | `CREATE OR REPLACE PROCEDURE name(IN p t, INOUT c REFCURSOR) LANGUAGE plpgsql AS $$BEGIN...END;$$` | 파라미터 순서 `name mode type` → `mode name type` 변환 |
| `NUMERIC/DECIMAL GENERATED AS IDENTITY` | `INTEGER GENERATED AS IDENTITY` | PG identity 컬럼 타입 제한 보정 |

---

### 2-3. SQL 실행 규칙 (백엔드)

| SQL 종류 | 처리 방식 | DB 반영 |
|----------|----------|---------|
| SELECT, WITH (CTE) | 실제 PostgreSQL 실행 | prac_* 또는 information_schema / pg_catalog 읽기 |
| `SELECT setval(...)` / `SELECT nextval(...)` | **실행 없이 시뮬레이션** | **없음** (시퀀스 영구 변경 방지) |
| DO 블록 내 `setval()` / `nextval()` | **실행 없이 시뮬레이션** | **없음** |
| `pg_terminate_backend()` 등 DB 관리 함수 | **차단** (오류 반환) | **없음** |
| INSERT, UPDATE, DELETE | 트랜잭션 내 실행 후 롤백 (행 수 반환) | **없음** |
| CREATE TABLE | 트랜잭션 내 실행 후 롤백 | **없음** |
| CREATE INDEX | 트랜잭션 내 실행 후 롤백 | **없음** |
| CREATE VIEW | 트랜잭션 내 실행 후 롤백 | **없음** |
| CREATE FUNCTION | 트랜잭션 내 실행 후 롤백 | **없음** |
| CREATE PROCEDURE | 트랜잭션 내 실행 후 롤백 | **없음** |
| CREATE TRIGGER | 트랜잭션 내 실행 후 롤백 | **없음** |
| ALTER TABLE | 트랜잭션 내 실행 후 롤백 | **없음** |
| DROP TABLE / DROP INDEX / DROP VIEW 등 | 트랜잭션 내 실행 후 롤백 | **없음** |
| TRUNCATE | 트랜잭션 내 실행 후 롤백 | **없음** |
| GRANT, REVOKE | 구문 검증 후 롤백 (역할·테이블 부재 오류 무시) | **없음** |

#### 특수 처리 규칙

| 규칙 | 내용 |
|------|------|
| **트랜잭션 격리** | 모든 DML·DDL은 `PROPAGATION_REQUIRES_NEW` 독립 트랜잭션으로 실행 후 항상 롤백 |
| **`$$` 자동 완성** | DDL에서 `$$` 달러 쿼트가 홀수 개(미종료)이면 `$$ LANGUAGE plpgsql` 자동 추가 |
| **CREATE TRIGGER 스텁** | `EXECUTE FUNCTION func_name()` 참조 시, 해당 함수가 동일 SQL 내에 없으면 시뮬레이션용 스텁 함수를 트랜잭션 내 자동 생성 (롤백으로 미반영) |
| **SERIAL RESTART 분기** | Oracle `MODIFY(col RESTART START WITH n)` 번역 결과가 SERIAL 컬럼이면 `ALTER SEQUENCE seq RESTART WITH n`으로 자동 재작성 |
| **DELIMITER 처리** | `DELIMITER //` 구문은 MySQL 모드에서만 허용 (제거 후 내부 SQL 추출), PostgreSQL·Oracle 모드에서는 오류 반환 |

**SELECT 허용 범위:**
- `prac_` 접두사 테이블 (기본 제공 + 사용자 생성)
- `information_schema.*` (권한 정보, 스키마 정보 조회)
- `pg_catalog.*` (PostgreSQL 시스템 카탈로그 메타데이터)

**멀티 스테이트먼트 제한:**
- 비-DDL SQL(SELECT, DML, DCL)은 중간 세미콜론 감지 시 차단
- DDL(CREATE/ALTER/DROP)은 함수·프로시저 body 내부 세미콜론 허용

#### 방언 역검증 (MySQL/Oracle 선택 시)

방언 변환(MySQL/Oracle→PG) 이전에, 선택 방언에서 유효하지 않은 문법을 실행 전 차단한다.

| 방언 | 차단 문법 | 대안 |
|------|----------|------|
| MySQL | `$$ ... $$` 달러 쿼팅 | `BEGIN...END` |
| MySQL | `LANGUAGE plpgsql` | `BEGIN...END` |
| MySQL | `RETURNING` 절 | — |
| MySQL | `GENERATED [ALWAYS\|BY DEFAULT] AS IDENTITY` | `AUTO_INCREMENT` |
| MySQL | `VARCHAR2` 타입 (DDL) | `VARCHAR` |
| MySQL | `NUMBER` 타입 (DDL) | `DECIMAL(p,s)` 또는 `INT` |
| MySQL | `SYSDATE` | `NOW()` / `CURRENT_TIMESTAMP` |
| MySQL | `NVL()` 함수 | `IFNULL(col, value)` |
| MySQL | `ILIKE` | `LIKE` / `LOWER()` |
| MySQL | `ALTER COLUMN col TYPE new_type` (DDL) | `MODIFY COLUMN col new_type` |
| MySQL | `ALTER COLUMN col SET/DROP NOT NULL` (DDL) | `MODIFY COLUMN col type [NOT NULL\|NULL]` |
| MySQL | `:NEW.col` / `:OLD.col` (Oracle 트리거 행 참조) | `NEW.col` / `OLD.col` |
| MySQL | `SYS_REFCURSOR` | `DECLARE cursor_name CURSOR FOR select_stmt` |
| MySQL | `EXECUTE FUNCTION/PROCEDURE` (트리거 문법) | `FOR EACH ROW BEGIN...END` |
| Oracle | `SERIAL` 타입 | `GENERATED ALWAYS AS IDENTITY` |
| Oracle | `TEXT` 타입 (DDL) | `CLOB` / `VARCHAR2` |
| Oracle | `BOOLEAN` 타입 (DDL) | `NUMBER(1) CHECK (col IN (0,1))` |
| Oracle | `NOW()` 함수 | `SYSDATE` / `CURRENT_TIMESTAMP` |
| Oracle | `LIMIT N` 절 | `FETCH FIRST N ROWS ONLY` |
| Oracle | `AUTO_INCREMENT` | `GENERATED ALWAYS AS IDENTITY` |
| Oracle | `$$ ... $$` 달러 쿼팅 | `BEGIN...END` (PL/SQL) |
| Oracle | `LANGUAGE plpgsql` | PL/SQL 문법 |
| Oracle | `ILIKE` | `UPPER(col) LIKE UPPER('pat')` |
| Oracle | `ALTER COLUMN ...` (DDL) | `MODIFY (col new_type)` / `MODIFY col NOT NULL` |
| Oracle | `ADD COLUMN` (DDL) | `ADD (col_name type [DEFAULT value])` |
| Oracle | `TRUE` / `FALSE` 리터럴 | `1`/`0` 또는 `'Y'`/`'N'` |
| Oracle | `EXECUTE FUNCTION/PROCEDURE` (트리거 문법) | `FOR EACH ROW BEGIN...END` |

---

### 2-4. 오타 감지 (프론트엔드)

실행 전 클라이언트 측에서 정규식으로 감지. 팝업에서 수정 후 재실행 또는 그대로 실행 선택 가능.

| 오타 패턴 | 올바른 표현 |
|-----------|------------|
| `CREATE TALBE` | `CREATE TABLE` |
| `SLECT`, `SELCT` | `SELECT` |
| `FORM` (FROM 위치) | `FROM` |
| `INSERT INOT` | `INSERT INTO` |
| `UPDTAE`, `UPDTE` | `UPDATE` |
| `DELETE FORM` | `DELETE FROM` |
| `GRUOP BY`, `GROP BY` | `GROUP BY` |
| `ORDRER BY`, `OREDER BY` | `ORDER BY` |
| `WHER` (WHERE 위치) | `WHERE` |
| `JION` | `JOIN` |

---

### 2-5. 데이터 초기화

"데이터 초기화" 버튼 → `POST /api/user/practice/sql/reset` → 기본 prac_ 테이블 TRUNCATE + 재시딩. 사용자가 생성한 추가 prac_ 테이블은 DROP 처리.

DML이 시뮬레이션이므로 SELECT 결과는 항상 기본 데이터 상태. 초기화 버튼은 테이블 구조가 변경된 경우 복원 용도.

---

### 2-6. 실습 가능 SQL 예제

> **범례**  
> `[PG]` = PostgreSQL 전용 · `[MY]` = MySQL 전용 (자동 변환) · `[OR]` = Oracle 전용 (자동 변환) · `[공통]` = 방언 무관

---

#### SELECT 기본 [공통]

```sql
-- 전체 조회
SELECT * FROM prac_departments;
SELECT * FROM prac_employees;

-- 조건 조회
SELECT name, salary FROM prac_employees WHERE salary >= 4500000;
SELECT name, location FROM prac_departments WHERE location LIKE '%서울%';

-- 정렬
SELECT name, salary FROM prac_employees ORDER BY salary DESC;

-- LIMIT / OFFSET
SELECT * FROM prac_products ORDER BY price DESC LIMIT 3;
SELECT * FROM prac_employees ORDER BY salary DESC LIMIT 5 OFFSET 2;
```

---

#### WHERE + 복합 조건 [공통]

```sql
-- AND / OR
SELECT * FROM prac_employees
WHERE salary BETWEEN 4000000 AND 5000000
  AND department_id IN (1, 2);

-- NULL 처리
SELECT name FROM prac_employees WHERE email IS NOT NULL;

-- 날짜 필터
SELECT * FROM prac_orders WHERE order_date >= '2026-03-01';
```

---

#### JOIN [공통]

```sql
-- INNER JOIN
SELECT e.name, d.name AS dept, e.salary
FROM prac_employees e
JOIN prac_departments d ON e.department_id = d.id;

-- LEFT JOIN
SELECT d.name AS dept, COUNT(e.id) AS emp_count
FROM prac_departments d
LEFT JOIN prac_employees e ON d.id = e.department_id
GROUP BY d.name;

-- 3-table JOIN
SELECT o.customer_name, p.name AS product, o.total_amount
FROM prac_orders o
JOIN prac_products p ON o.product_id = p.id
ORDER BY o.order_date DESC;
```

---

#### GROUP BY / HAVING / 집계 [공통]

```sql
-- 부서별 평균 급여
SELECT d.name AS dept, ROUND(AVG(e.salary)) AS avg_salary
FROM prac_employees e
JOIN prac_departments d ON e.department_id = d.id
GROUP BY d.name
ORDER BY avg_salary DESC;

-- HAVING (평균 4000000 초과 부서)
SELECT department_id, AVG(salary) AS avg_sal
FROM prac_employees
GROUP BY department_id
HAVING AVG(salary) > 4000000;
```

---

#### 서브쿼리 [공통]

```sql
-- 평균 급여보다 높은 직원
SELECT name, salary FROM prac_employees
WHERE salary > (SELECT AVG(salary) FROM prac_employees);

-- 주문이 가장 많은 상품
SELECT name FROM prac_products
WHERE id = (
  SELECT product_id FROM prac_orders
  GROUP BY product_id
  ORDER BY SUM(quantity) DESC
  LIMIT 1
);
```

---

#### WITH (CTE) [공통]

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

---

#### 윈도우 함수 [PG/공통]

```sql
-- 급여 순위
SELECT name, salary,
       RANK() OVER (ORDER BY salary DESC) AS salary_rank,
       DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rank
FROM prac_employees;

-- 부서 내 급여 순위
SELECT name, department_id, salary,
       ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS dept_rank
FROM prac_employees;
```

---

#### DML 시뮬레이션 (DB 미반영) [공통]

> 실제 DB에는 반영되지 않으며, 영향 행 수가 결과에 표시된다.

```sql
-- INSERT
INSERT INTO prac_departments (name, location, budget)
VALUES ('데이터팀', '서울 성동구', 35000000);

-- UPDATE
UPDATE prac_employees
SET salary = salary * 1.1
WHERE department_id = 1;

-- DELETE
DELETE FROM prac_orders
WHERE order_date < '2026-02-01';
```

---

#### DDL 시뮬레이션 — CREATE TABLE (방언별)

> CREATE/ALTER/DROP은 트랜잭션 롤백으로 DB에 반영되지 않는다.  
> MySQL/Oracle 방언에서 해당 DB가 지원하지 않는 문법 사용 시 **오류 반환** (실행 전 차단).

**[PG] PostgreSQL**
```sql
-- SERIAL, TEXT, NOW() — Oracle/MySQL 방언 선택 시 오류
CREATE TABLE prac_my_table (
  id       SERIAL PRIMARY KEY,
  name     VARCHAR(100) NOT NULL,
  score    INTEGER DEFAULT 0 CHECK (score >= 0),
  memo     TEXT,
  created  TIMESTAMP DEFAULT NOW()
);
```

**[MY] MySQL → PostgreSQL 자동 변환**
```sql
-- AUTO_INCREMENT, DATETIME, UNIQUE KEY, ENGINE 자동 변환됨
CREATE TABLE prac_my_table (
  id         INT NOT NULL AUTO_INCREMENT,
  user_code  VARCHAR(20) NOT NULL,
  email      VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_code (user_code),
  KEY idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
> 변환: `AUTO_INCREMENT`→`GENERATED ALWAYS AS IDENTITY`, `DATETIME`→`TIMESTAMP`, `UNIQUE KEY`→`CONSTRAINT ... UNIQUE`, `KEY` 제거, `ENGINE=...` 제거

**[OR] Oracle → PostgreSQL 자동 변환**
```sql
-- IDENTITY, VARCHAR2, NUMBER, SYSDATE 자동 변환됨
CREATE TABLE prac_my_table (
  id         NUMBER GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1),
  user_code  VARCHAR2(20) NOT NULL,
  email      VARCHAR2(100),
  ref_id     NUMBER,
  CONSTRAINT pk_my PRIMARY KEY (id),
  CONSTRAINT uk_code UNIQUE (user_code),
  CONSTRAINT fk_ref FOREIGN KEY (ref_id) REFERENCES prac_employees(id)
);
```
> 변환: `NUMBER` (괄호 없음)→`INTEGER`, `VARCHAR2`→`VARCHAR`, IDENTITY 컬럼 타입 자동 보정

---

#### DDL 시뮬레이션 — ALTER TABLE (방언별)

**[PG] PostgreSQL**
```sql
-- 컬럼 추가: BOOLEAN — Oracle 23c 이전 미지원
ALTER TABLE prac_employees ADD COLUMN is_remote BOOLEAN DEFAULT false;

-- 컬럼 타입 변경: ALTER COLUMN ... TYPE — PG 전용 문법
ALTER TABLE prac_employees ALTER COLUMN job_title TYPE VARCHAR(200);

-- NOT NULL 제약: ALTER COLUMN ... SET NOT NULL — PG 전용
ALTER TABLE prac_products ALTER COLUMN stock SET NOT NULL;
```

**[OR] Oracle → PostgreSQL 자동 변환 (MODIFY)**
```sql
-- IDENTITY 시퀀스 재시작: MODIFY(col RESTART START WITH n)
ALTER TABLE prac_employees MODIFY(id RESTART START WITH 1000);

-- NOT NULL 추가: MODIFY(col NOT NULL)
ALTER TABLE prac_employees MODIFY(salary NOT NULL);

-- NOT NULL 해제: MODIFY(col NULL)
ALTER TABLE prac_employees MODIFY(email NULL);
```
> MODIFY RESTART 변환 시 SERIAL 컬럼이면 `ALTER SEQUENCE seq RESTART WITH n`으로 자동 분기

**[공통] DROP TABLE**
```sql
DROP TABLE IF EXISTS prac_my_table;
```

---

#### DDL 시뮬레이션 — 시퀀스 / Auto-Increment 리셋

**[PG] SERIAL 시퀀스 값 변경 (실행 없이 시뮬레이션)**
```sql
-- setval()·nextval()은 시퀀스를 영구 변경하므로 연습장에서는 실행 없이 시뮬레이션 처리됨
SELECT setval(pg_get_serial_sequence('prac_departments', 'id'), 100, false);
```

**[PG] Identity 컬럼 리셋**
```sql
ALTER TABLE prac_departments ALTER COLUMN id RESTART WITH 100;
```

**[MY] MySQL → PostgreSQL 자동 변환**
```sql
-- AUTO_INCREMENT = N → ALTER COLUMN id RESTART WITH N 으로 변환됨
ALTER TABLE prac_departments AUTO_INCREMENT = 100;
```

---

#### DDL 시뮬레이션 — 인덱스 [공통]

```sql
-- 일반 인덱스
CREATE INDEX idx_emp_salary ON prac_employees(salary);

-- 복합 인덱스
CREATE INDEX idx_emp_dept_hire ON prac_employees(department_id, hire_date);

-- 유니크 인덱스
CREATE UNIQUE INDEX idx_emp_email ON prac_employees(email);

-- 인덱스 삭제
DROP INDEX IF EXISTS idx_emp_salary;
```

---

#### DDL 시뮬레이션 — 뷰(VIEW) [공통]

```sql
-- 고급 직원 뷰 (급여 4,500,000 이상)
CREATE OR REPLACE VIEW view_high_salary AS
SELECT e.name, e.salary, e.job_title, d.name AS dept
FROM prac_employees e
JOIN prac_departments d ON e.department_id = d.id
WHERE e.salary >= 4500000;
```

```sql
-- 카테고리별 상품 요약 뷰
CREATE OR REPLACE VIEW view_product_summary AS
SELECT category,
       COUNT(*)   AS product_count,
       MIN(price) AS min_price,
       MAX(price) AS max_price,
       SUM(stock) AS total_stock
FROM prac_products
GROUP BY category;
```

```sql
DROP VIEW IF EXISTS view_high_salary;
```

---

#### DDL 시뮬레이션 — 함수(FUNCTION)

> 함수 body 내 세미콜론은 DDL로 분류되어 멀티 스테이트먼트 차단에서 제외된다.  
> `$$` 달러 쿼트 닫는 부분(`$$ LANGUAGE plpgsql`)을 생략해도 자동 완성된다.

**[PG] PostgreSQL**
```sql
-- 부서별 직원 수 반환 함수
CREATE OR REPLACE FUNCTION func_emp_count(dept_id INT)
RETURNS INT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM prac_employees
        WHERE department_id = dept_id
    );
END;
$$ LANGUAGE plpgsql;
```

```sql
-- 직원 평균 급여 반환 함수 ($$ LANGUAGE plpgsql 생략 시 자동 완성)
CREATE OR REPLACE FUNCTION func_avg_salary(dept_id INT)
RETURNS NUMERIC AS $$
DECLARE
    avg_sal NUMERIC;
BEGIN
    SELECT AVG(salary)
    INTO avg_sal
    FROM prac_employees
    WHERE department_id = dept_id;
    RETURN COALESCE(avg_sal, 0);
END;
```

---

#### DDL 시뮬레이션 — 트리거(TRIGGER)

**[PG] Step 1 — 트리거 함수 생성 (먼저 실행)**
```sql
CREATE OR REPLACE FUNCTION func_log_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO prac_departments(name) VALUES ('Change detected');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**[PG] Step 2 — 트리거 생성 (참조 함수 없어도 스텁 자동 생성으로 시뮬레이션 가능)**
```sql
-- 참조 함수 func_log_changes()가 없어도 연습장이 시뮬레이션용 스텁을 자동 생성함
CREATE TRIGGER trg_example
AFTER INSERT ON prac_departments
FOR EACH ROW EXECUTE FUNCTION func_log_changes();
```

**[MY] MySQL — DELIMITER 포함 인라인 트리거**
```sql
-- DELIMITER 명령은 MySQL 모드에서만 허용 (Oracle/PostgreSQL 모드에서는 오류)
-- 함수+트리거로 자동 분리 변환됨
DELIMITER //
CREATE TRIGGER trg_after_insert
AFTER INSERT ON prac_employees
FOR EACH ROW
BEGIN
    INSERT INTO prac_departments(name) VALUES ('testNm');
END //
DELIMITER ;
```
> 변환: `func_trg_after_insert()` 함수 자동 생성 + `CREATE TRIGGER ... EXECUTE FUNCTION func_trg_after_insert()` 순차 실행 후 전체 롤백

**[OR] Oracle — :NEW/:OLD 행 참조 트리거**
```sql
-- :NEW.col → NEW.col 자동 변환, SYSDATE → CURRENT_TIMESTAMP 자동 변환
CREATE OR REPLACE TRIGGER trg_before_update
BEFORE UPDATE ON prac_employees
FOR EACH ROW
BEGIN
    :NEW.hire_date := SYSDATE;
END;
```
> 변환: `:NEW.hire_date`→`NEW.hire_date`, `SYSDATE`→`CURRENT_TIMESTAMP`, 함수+트리거로 분리

---

#### DDL 시뮬레이션 — 프로시저(PROCEDURE)

**[PG] PostgreSQL**
```sql
CREATE OR REPLACE PROCEDURE proc_raise_salary(dept_id INT, pct NUMERIC)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE prac_employees
    SET salary = salary * (1 + pct / 100)
    WHERE department_id = dept_id;
    COMMIT;
END;
$$;
```

**[MY] MySQL → PostgreSQL 자동 변환**
```sql
CREATE PROCEDURE proc_raise_salary(dept_id INT, pct DECIMAL(5,2))
BEGIN
    UPDATE prac_employees
    SET salary = salary * (1 + pct / 100)
    WHERE department_id = dept_id;
END;
```
> 변환: `CREATE OR REPLACE PROCEDURE ... LANGUAGE plpgsql AS $$BEGIN...END;$$`

**[OR] Oracle — IS/AS BEGIN...END + SYS_REFCURSOR**
```sql
-- IS/AS BEGIN...END 구조 자동 변환
-- 파라미터 순서: Oracle name mode type → PostgreSQL mode name type
-- SYS_REFCURSOR OUT → REFCURSOR INOUT 자동 변환
CREATE OR REPLACE PROCEDURE proc_get_user(p_id IN NUMBER, p_cursor OUT SYS_REFCURSOR)
IS
BEGIN
    OPEN p_cursor FOR SELECT * FROM prac_employees WHERE id = p_id;
END;
```
> 변환 결과:
> ```sql
> CREATE OR REPLACE PROCEDURE proc_get_user(IN p_id INTEGER, INOUT p_cursor REFCURSOR)
> LANGUAGE plpgsql AS $$
> BEGIN
>     OPEN p_cursor FOR SELECT * FROM prac_employees WHERE id = p_id;
> END;
> $$
> ```

---

#### DCL 시뮬레이션 — 권한 부여 / 회수 (방언별)

> 역할(사용자)이 실제로 존재하지 않아도 시뮬레이션 성공으로 처리된다.  
> 문법 오류는 실제 오류로 반환된다.

**[PG] PostgreSQL**
```sql
-- 읽기 권한 부여
GRANT SELECT ON prac_employees TO readonly_user;

-- 복수 권한 부여
GRANT SELECT, INSERT, UPDATE ON prac_employees TO app_user;

-- 특정 권한 회수
REVOKE INSERT, UPDATE ON prac_employees FROM app_user;

-- 전체 권한 회수
REVOKE ALL PRIVILEGES ON prac_employees FROM readonly_user;
```

**[MY] MySQL 방언**
```sql
-- MySQL GRANT 문법 (방언 선택 시 PG-호환 형식으로 작성)
-- ※ MySQL 고유 'user'@'host' 호스트 지정자는 지원하지 않음
GRANT SELECT ON prac_employees TO readonly_user;
GRANT SELECT, INSERT ON prac_employees TO app_user;
REVOKE SELECT ON prac_employees FROM readonly_user;
```

**[OR] Oracle 방언**
```sql
-- Oracle GRANT/REVOKE 문법 (PG와 동일한 형식)
GRANT SELECT ON prac_employees TO readonly_user;
GRANT SELECT, INSERT ON prac_employees TO app_user;
REVOKE SELECT ON prac_employees FROM readonly_user;
```

---

#### SELECT — 권한·스키마 조회 (information_schema 실제 조회)

> `information_schema`와 `pg_catalog`는 SELECT 허용 대상이므로 실제 DB 데이터가 반환된다.  
> MySQL/Oracle 방언에서도 PostgreSQL `information_schema` 형식으로 조회한다.

**[PG] 권한 조회**
```sql
-- prac_ 테이블에 부여된 권한 조회
SELECT grantee, table_name, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_name LIKE 'prac_%'
ORDER BY table_name, privilege_type;
```

```sql
-- 특정 역할의 권한 조회 (결과: grantee가 없으면 빈 행)
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'readonly_user';
```

**[PG] 스키마·컬럼 구조 조회**
```sql
-- public 스키마의 prac_ 테이블 목록
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'prac_%'
ORDER BY table_name;
```

```sql
-- prac_employees 컬럼 정보
SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'prac_employees'
ORDER BY ordinal_position;
```

**[MY] MySQL 방언 — 동등 참고 문법 (연습장에서는 위 PG 형식으로 조회)**
```sql
-- MySQL 원문 참고: SHOW GRANTS FOR 'user'@'host';
-- MySQL 원문 참고: SELECT * FROM information_schema.TABLE_PRIVILEGES WHERE TABLE_NAME LIKE 'prac_%';
-- ※ 연습장은 항상 PostgreSQL information_schema 형식으로 조회한다
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_name LIKE 'prac_%';
```

**[OR] Oracle 방언 — 동등 참고 문법 (연습장에서는 위 PG 형식으로 조회)**
```sql
-- Oracle 원문 참고: SELECT * FROM ALL_TAB_PRIVS WHERE TABLE_NAME LIKE 'PRAC_%';
-- Oracle 원문 참고: SELECT * FROM USER_TAB_PRIVS WHERE TABLE_NAME LIKE 'PRAC_%';
-- ※ 연습장은 항상 PostgreSQL information_schema 형식으로 조회한다
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_name LIKE 'prac_%';
```

---

#### TRUNCATE 시뮬레이션 (DB 미반영) [PG]

```sql
-- 단일 테이블 TRUNCATE (RESTART IDENTITY: 시퀀스도 초기화)
TRUNCATE TABLE prac_orders RESTART IDENTITY;

-- CASCADE: 참조 테이블까지 함께 비움
TRUNCATE TABLE prac_departments CASCADE;
```

---

### 2-7. 테스트 가능 항목 목록

> 사용 가이드에 표시되는 지원 범위. 아래 목록에 없는 SQL은 오류가 발생하거나 지원하지 않는다.

#### 조회 (SELECT)

| 항목 | 비고 |
|------|------|
| 기본 SELECT / WHERE / ORDER BY | 방언 무관 |
| LIMIT / OFFSET | Oracle은 `FETCH FIRST N ROWS ONLY` 사용 |
| INNER / LEFT / RIGHT / FULL OUTER / CROSS JOIN | 방언 무관 |
| GROUP BY / HAVING / 집계 함수 (COUNT, SUM, AVG, MAX, MIN) | 방언 무관 |
| 스칼라 서브쿼리 / IN / EXISTS 서브쿼리 | 방언 무관 |
| WITH (CTE) / WITH RECURSIVE | 방언 무관 |
| CASE WHEN THEN ELSE END | 방언 무관 |
| 윈도우 함수 (ROW_NUMBER, RANK, DENSE_RANK, NTILE, LAG, LEAD) | PostgreSQL 방언 권장 |
| COALESCE / NULLIF / NVL (Oracle→COALESCE 자동 변환) | |
| CAST / 타입 변환 | |
| information_schema 조회 (테이블 목록, 컬럼 정보, 권한 정보) | 실제 DB 반환 |
| pg_catalog 조회 (인덱스, 시퀀스, 함수 등 메타데이터) | 실제 DB 반환 |

#### DML 시뮬레이션

| 항목 | 비고 |
|------|------|
| INSERT INTO ... VALUES | prac_* 테이블 대상 |
| INSERT INTO ... SELECT | |
| INSERT ... ON CONFLICT (PostgreSQL) | |
| UPDATE ... SET ... WHERE | |
| UPDATE ... FROM (PostgreSQL) | |
| DELETE FROM ... WHERE | |
| TRUNCATE TABLE | 롤백으로 미반영 |

#### DDL 시뮬레이션

| 항목 | 비고 |
|------|------|
| CREATE TABLE (+ PK/FK/UNIQUE/CHECK/DEFAULT 제약) | 방언별 타입 자동 변환 |
| ALTER TABLE ADD COLUMN | |
| ALTER TABLE DROP COLUMN | |
| ALTER TABLE ALTER/MODIFY COLUMN (타입 변경, NOT NULL) | 방언별 문법 차이 있음 |
| ALTER TABLE ADD/DROP CONSTRAINT | |
| DROP TABLE / DROP TABLE IF EXISTS | |
| CREATE INDEX / UNIQUE INDEX | |
| DROP INDEX | |
| CREATE VIEW / CREATE OR REPLACE VIEW | |
| DROP VIEW | |
| CREATE FUNCTION (PG: `$$...$$`) | `$$` 미종료 시 자동 완성 |
| CREATE PROCEDURE | MySQL·Oracle 인라인 문법 자동 변환 |
| CREATE TRIGGER | MySQL·Oracle 인라인 문법 자동 변환 / 참조 함수 없어도 스텁 자동 생성 |
| DROP FUNCTION / DROP PROCEDURE / DROP TRIGGER | |
| CREATE SEQUENCE (PostgreSQL) | |

#### DCL 시뮬레이션

| 항목 | 비고 |
|------|------|
| GRANT (SELECT, INSERT, UPDATE, DELETE, ALL PRIVILEGES) | 역할 미존재 오류 무시 |
| REVOKE | 역할 미존재 오류 무시 |

#### 방언별 특수 문법

| 항목 | 방언 | 비고 |
|------|------|------|
| AUTO_INCREMENT | MySQL | GENERATED ALWAYS AS IDENTITY로 변환 |
| DATETIME, TINYINT, UNSIGNED 등 | MySQL | PG 호환 타입으로 변환 |
| DELIMITER // ... END // DELIMITER ; | MySQL | DELIMITER 제거 후 내부 SQL 처리 |
| BEGIN...END 인라인 트리거/프로시저 | MySQL | 함수+트리거로 자동 분리 |
| NUMBER, VARCHAR2, CLOB, SYSDATE, NVL 등 | Oracle | PG 호환 타입/함수로 변환 |
| IS/AS BEGIN...END 프로시저 | Oracle | LANGUAGE plpgsql AS $$...$$로 변환 |
| :NEW.col / :OLD.col 트리거 | Oracle | NEW.col / OLD.col로 변환 |
| MODIFY(col RESTART START WITH n) | Oracle | ALTER COLUMN/ALTER SEQUENCE로 변환 |
| FROM DUAL | Oracle | FROM (SELECT 1) AS dual로 변환 |

---

### 2-8. 테스트 불가 항목 (차단)

> 아래 항목은 시스템 보안, 데이터 무결성, 또는 운영 환경 보호를 위해 차단된다.

| 분류 | 차단 항목 | 사유 |
|------|----------|------|
| **트랜잭션 명시 제어** | BEGIN / COMMIT / ROLLBACK / SAVEPOINT / SET TRANSACTION | 연습장 자체가 트랜잭션 시뮬레이션 방식으로 동작 — 명시적 제어 불가 |
| **시퀀스 함수 직접 실행** | `SELECT setval(...)` / `SELECT nextval(...)` | 비트랜잭션 연산으로 롤백 불가 — 시뮬레이션 메시지만 반환 |
| **DO 블록 내 시퀀스 함수** | `DO $$ ... setval/nextval ...$$` | 동일 사유 — 시뮬레이션 메시지만 반환 |
| **DB 관리 함수** | `pg_terminate_backend()` / `pg_cancel_backend()` / `pg_reload_conf()` / `pg_rotate_logfile()` | 세션 종료·서버 설정 변경 등 운영 영향 |
| **계정·역할 관리 DDL** | `CREATE USER` / `ALTER USER` / `DROP USER` / `CREATE ROLE` / `ALTER ROLE` / `DROP ROLE` | 실제 DB 계정 변경 방지 |
| **데이터베이스·스키마 관리** | `CREATE DATABASE` / `DROP DATABASE` / `CREATE SCHEMA` / `DROP SCHEMA` | 연습용 스키마 외 영역 변경 방지 |
| **확장 관리** | `CREATE EXTENSION` / `DROP EXTENSION` | 서버 수준 설정 변경 |
| **prac_ 외 테이블 DML** | `INSERT/UPDATE/DELETE` 대상이 `prac_*` 아닌 경우 | 시스템 테이블 보호 |
| **DELIMITER (MySQL 외 방언)** | PostgreSQL·Oracle 모드에서 `DELIMITER //` 사용 | MySQL 클라이언트 전용 명령 |
| **비-DDL 멀티 스테이트먼트** | SELECT·DML·DCL에서 세미콜론으로 분리된 여러 문장 동시 실행 | 실행 범위 제한 |

---

## 3. OS 명령어 연습

### 3-1. 가상 파일시스템 초기 구조

**Linux/Mac:**
```
/
├── home/
│   └── user/
│       ├── documents/
│       │   ├── readme.txt   ("TPMP 연습장에 오신 것을 환영합니다!")
│       │   └── notes.md     ("# 메모 - 연습 파일입니다.")
│       ├── downloads/
│       └── Desktop/
├── var/
│   └── log/
│       └── system.log       (시스템 로그 3줄)
└── etc/
    ├── hosts                (127.0.0.1 localhost)
    └── passwd               (root, user 계정 2행)
```

**Windows:**
```
C:\
├── Users\
│   └── user\
│       ├── Documents\
│       │   └── readme.txt   ("TPMP 연습장에 오신 것을 환영합니다!")
│       ├── Downloads\
│       └── Desktop\
├── Windows\
│   └── System32\
└── Program Files\
```

### 3-2. 파일 탐색기 (UI)

- OS 탭 좌측 패널에 가상 파일시스템 트리 구조 표시
- 폴더 클릭으로 열기/닫기 (기본값: 모두 닫힘)
- 현재 디렉토리(`cwd`) 하이라이트
- 터미널 명령으로 파일시스템 변경 시 즉시 반영

### 3-3. 지원 명령어

**Linux / Mac:**

| 명령어 | 설명 |
|--------|------|
| `ls`, `ls -l`, `ls -la` | 디렉토리 목록 |
| `pwd` | 현재 경로 출력 |
| `mkdir [name]`, `mkdir -p [path]` | 디렉토리 생성 |
| `cd [path]`, `cd ..`, `cd ~` | 디렉토리 이동 |
| `touch [file]` | 빈 파일 생성 |
| `cat [file]` | 파일 내용 출력 |
| `echo [text]`, `echo [text] > [file]`, `echo [text] >> [file]` | 텍스트 출력/파일 쓰기/추가 |
| `rm [file]`, `rm -r [dir]`, `rm -rf [dir]` | 삭제 |
| `cp [src] [dst]` | 복사 |
| `mv [src] [dst]` | 이동/이름변경 |
| `chmod [perms] [file]` | 권한 변경 |
| `grep [pattern] [file]` | 패턴 검색 |
| `find [path] -name [pattern]` | 파일 찾기 |
| `whoami`, `hostname`, `date`, `uname` | 시스템 정보 |
| `ps`, `df -h` | 프로세스/디스크 정보 (시뮬레이션) |
| `history` | 명령어 히스토리 |
| `clear` / `cls` | 화면 초기화 |
| `man [cmd]`, `help` | 도움말 |

**Windows:**

| 명령어 | 설명 |
|--------|------|
| `dir`, `dir /a` | 목록 조회 |
| `mkdir [name]`, `md [name]` | 폴더 생성 |
| `cd [path]`, `cd ..` | 폴더 이동 |
| `type [file]` | 파일 내용 출력 |
| `echo [text]`, `echo [text] > [file]` | 텍스트 출력/파일 쓰기 |
| `del [file]` | 파일 삭제 |
| `rmdir [dir]`, `rd /s /q [dir]` | 폴더 삭제 |
| `copy [src] [dst]` | 복사 |
| `move [src] [dst]` | 이동 |
| `cls` | 화면 초기화 |
| `ver`, `whoami`, `hostname` | 시스템 정보 |
| `ipconfig`, `systeminfo`, `tasklist` | 네트워크/시스템 (시뮬레이션) |
| `help` | 도움말 |

### 3-4. 동작 원칙

- **파일/디렉토리 생성·삭제는 가상 상태에만 반영** (실제 OS에 아무 영향 없음)
- 위/아래 화살표로 명령어 히스토리 탐색
- "초기화" 버튼으로 파일시스템 원래 상태로 복원
- OS 전환(Linux ↔ Windows) 시 각 가상 FS는 독립 유지

---

## 4. API 엔드포인트

| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/user/practice/sql/execute` | SQL 실행 (body: `{ sql, dialect }`) |
| POST | `/api/user/practice/sql/reset` | 연습 데이터 초기화 |
| GET  | `/api/user/practice/sql/tables` | 연습 테이블 스키마 정보 조회 |

**`dialect` 값**: `"postgresql"` (기본) / `"mysql"` / `"oracle"`

---

## 5. 구현 파일 목록

| 파일 | 유형 |
|------|------|
| `backend/.../controller/UserPracticeController.java` | 신규 |
| `backend/.../service/PracticeService.java` | 신규 |
| `backend/.../config/DataInitializer.java` | 수정 (practice 테이블/메뉴 추가) |
| `frontend/src/services/practiceService.ts` | 신규 |
| `frontend/src/app/user/practice/page.tsx` | 신규 |
| `frontend/src/components/layout/UserLayoutShell.tsx` | 수정 (practice 아이콘 추가) |
