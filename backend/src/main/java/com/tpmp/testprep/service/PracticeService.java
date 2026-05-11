package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.PracticeHistory;
import com.tpmp.testprep.repository.PracticeHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.DefaultTransactionDefinition;

import java.util.*;
import java.util.regex.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PracticeService {

    private final JdbcTemplate jdbcTemplate;
    private final PracticeHistoryRepository practiceHistoryRepository;
    private final PlatformTransactionManager transactionManager;

    private static final Set<String> DEFAULT_PRAC_TABLES =
            Set.of("prac_departments", "prac_employees", "prac_products", "prac_orders");

    // ── SQL 실행 ────────────────────────────────────────────────────────────

    public SqlResult execute(String rawSql, String userEmail, String dialect) {
        String sql = rawSql == null ? "" : rawSql.trim();
        if (sql.isEmpty()) return SqlResult.error("SQL을 입력해주세요.");

        // MySQL 클라이언트 전용 DELIMITER 명령어 처리
        // MySQL 모드: 제거 후 실제 SQL 추출 / 그 외 모드: DELIMITER 자체가 오류 (오류 반환 시 위치 오차 없음)
        if (sql.toUpperCase().stripLeading().startsWith("DELIMITER")) {
            if (!"mysql".equals(dialect)) {
                String dialectName = "oracle".equals(dialect) ? "Oracle" : "PostgreSQL";
                return saveAndReturn(userEmail, sql, SqlResult.error(
                        "DELIMITER는 MySQL 클라이언트 전용 명령어입니다. " + dialectName + "에서는 지원하지 않습니다.\n" +
                        "→ " + dialectName + "에서는 DELIMITER 없이 트리거·프로시저를 직접 작성하세요."));
            }
            Matcher delimDef = Pattern.compile("(?i)\\bDELIMITER\\s+(\\S+)").matcher(sql);
            String customDelim = delimDef.find() ? delimDef.group(1) : "//";
            String quotedDelim = Pattern.quote(customDelim);
            sql = sql
                    .replaceAll("(?im)^[ \\t]*DELIMITER\\s+\\S+[ \\t]*$", "")  // DELIMITER 라인 제거
                    .replaceAll("(?m)[ \\t]*" + quotedDelim + "[ \\t]*$", "")  // 커스텀 구분자 제거
                    .trim();
        }

        // 멀티 스테이트먼트 차단 — DDL(CREATE/ALTER/DROP)은 함수·프로시저 body에 세미콜론이 허용되므로 제외
        String sqlUpper0 = sql.toUpperCase().stripLeading();
        boolean isDdlStart = sqlUpper0.startsWith("CREATE") || sqlUpper0.startsWith("ALTER") || sqlUpper0.startsWith("DROP");
        if (!isDdlStart) {
            // 단일 따옴표 문자열과 달러 쿼팅($$...$$) 내부 세미콜론을 제외하고 검사
            String withoutStrings = sql.replaceAll("'[^']*'", "''")
                    .replaceAll("(?s)\\$\\$.*?\\$\\$", "\\$\\$\\$\\$");
            if (withoutStrings.contains(";") && withoutStrings.indexOf(";") < withoutStrings.length() - 1) {
                return saveAndReturn(userEmail, sql, SqlResult.error("여러 SQL 문을 동시에 실행할 수 없습니다. 한 번에 하나씩 실행해주세요."));
            }
        }
        if (sql.endsWith(";")) sql = sql.substring(0, sql.length() - 1).trim();

        // $$ 달러 쿼트가 홀수 개(미종료)이면 $$ LANGUAGE plpgsql 자동 완성
        // BEGIN...END 함수·프로시저 작성 시 닫는 $$ LANGUAGE plpgsql 누락 케이스 보정
        if (isDdlStart && (sql.split("\\$\\$", -1).length - 1) % 2 == 1) {
            sql = sql + "\n$$ LANGUAGE plpgsql";
        }

        String upper = sql.toUpperCase();
        boolean isSelect = upper.startsWith("SELECT") || upper.startsWith("WITH");

        // setval()/nextval()은 트랜잭션 롤백 대상이 아닌 비트랜잭션 연산 — 실행 없이 시뮬레이션
        if (isSelect && (upper.contains("SETVAL(") || upper.contains("NEXTVAL("))) {
            return saveAndReturn(userEmail, sql, SqlResult.sim("SETVAL",
                    "시퀀스 함수 시뮬레이션 완료\n화면에서만 실행되며 실제 DB에는 반영되지 않습니다.\n실제 시퀀스 값은 변경되지 않습니다."));
        }
        // DB 관리 함수(pg_terminate_backend 등)는 세션·설정에 영구 영향 — 차단
        if (isSelect && (upper.contains("PG_TERMINATE_BACKEND(") || upper.contains("PG_CANCEL_BACKEND(")
                || upper.contains("PG_RELOAD_CONF(") || upper.contains("PG_ROTATE_LOGFILE("))) {
            return saveAndReturn(userEmail, sql, SqlResult.error(
                    "연습장에서는 DB 관리 함수(pg_terminate_backend 등)를 사용할 수 없습니다."));
        }
        // DO 블록 내 시퀀스 함수 — 비트랜잭션 연산은 트랜잭션 롤백 대상이 아님
        if (!isSelect && sqlUpper0.startsWith("DO") && sqlUpper0.length() > 2
                && !Character.isLetterOrDigit(sqlUpper0.charAt(2))
                && (upper.contains("SETVAL(") || upper.contains("NEXTVAL("))) {
            return saveAndReturn(userEmail, sql, SqlResult.sim("DO",
                    "DO 블록 내 시퀀스 함수 시뮬레이션 완료\n화면에서만 실행되며 실제 DB에는 반영되지 않습니다.\n실제 시퀀스 값은 변경되지 않습니다."));
        }

        // 방언 문법 역검증 — MySQL/Oracle 선택 시 해당 방언에서 유효하지 않은 문법 차단
        SqlResult dialectError = validateDialectSyntax(sql, userEmail, dialect);
        if (dialectError != null) return dialectError;

        // 방언 변환: MySQL/Oracle → PostgreSQL 자동 변환
        String translatedSql = translateToPostgres(sql, dialect);
        // Oracle MODIFY RESTART → SERIAL/IDENTITY 분기 (SERIAL 컬럼은 ALTER SEQUENCE로 교체)
        if ("oracle".equals(dialect)) {
            translatedSql = resolveRestartWith(translatedSql);
        }

        // CREATE TRIGGER ... EXECUTE FUNCTION/PROCEDURE → 참조 함수 스텁 자동 선행 생성
        // 연습 환경에서 트리거 함수는 항상 롤백되어 존재하지 않으므로, 동일 트랜잭션 내에 시뮬레이션용 스텁을 생성한다
        // 단, 동일 translatedSql 내에서 이미 해당 함수를 생성하는 경우(MySQL/Oracle 트리거 번역 결과) 스텁은 불필요
        if (!isSelect) {
            Matcher trigFuncM = Pattern.compile(
                    "(?si)\\bCREATE\\s+(?:OR\\s+REPLACE\\s+)?TRIGGER\\b.*?" +
                    "\\bEXECUTE\\s+(?:FUNCTION|PROCEDURE)\\s+(\\w+)\\s*\\("
            ).matcher(translatedSql);
            if (trigFuncM.find()) {
                String refFunc = trigFuncM.group(1).toLowerCase();
                boolean alreadyDefined = Pattern.compile(
                        "(?i)\\bCREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+" + Pattern.quote(refFunc) + "\\s*\\("
                ).matcher(translatedSql).find();
                if (!alreadyDefined) {
                    String stub = "CREATE OR REPLACE FUNCTION " + refFunc +
                                  "() RETURNS TRIGGER AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql";
                    translatedSql = stub + "\n---SPLIT---\n" + translatedSql;
                }
            }
        }

        // DML/DDL/DCL — 트랜잭션 내 실행 후 롤백 (문법 검증 + 행 수 반환, DB 미반영)
        if (!isSelect) {
            return saveAndReturn(userEmail, sql, simulateDml(translatedSql, upper, dialect));
        }

        // SELECT — prac_* 또는 허용된 시스템 스키마만 조회 가능 (테이블 검증은 원본 SQL 기준)
        Set<String> tables = extractTableNames(sql);
        Set<String> allowedSchemas = Set.of("information_schema", "pg_catalog");
        List<String> invalid = tables.stream()
                .filter(t -> !t.startsWith("prac_") && !allowedSchemas.contains(t))
                .toList();
        if (!invalid.isEmpty()) {
            return saveAndReturn(userEmail, sql, SqlResult.error(
                    "연습장에서는 'prac_' 접두사 테이블 또는 information_schema / pg_catalog만 조회할 수 있습니다.\n" +
                    "잘못된 테이블: " + String.join(", ", invalid) + "\n" +
                    "예) SELECT * FROM prac_employees;"));
        }

        try {
            return saveAndReturn(userEmail, sql, runSelect(translatedSql));
        } catch (Exception e) {
            ErrorInfo info = extractErrorInfo(e);
            return saveAndReturn(userEmail, sql, SqlResult.error(info.message(), info.position()));
        }
    }

    private SqlResult simulateDml(String sql, String upper, String dialect) {
        String type = detectDmlType(upper);
        boolean isDml = type.equals("INSERT") || type.equals("UPDATE") || type.equals("DELETE");
        boolean isDcl = type.equals("GRANT") || type.equals("REVOKE");

        String dialectNote = "postgresql".equals(dialect) || dialect == null ? "" :
                "\n[" + ("mysql".equals(dialect) ? "MySQL" : "Oracle") + " 방언 → PostgreSQL 자동 변환]";

        // DCL(GRANT/REVOKE): 구문 검증 후 롤백, 역할·테이블 부재 오류는 무시 (연습 환경 특성)
        if (isDcl) {
            DefaultTransactionDefinition dcl = new DefaultTransactionDefinition();
            dcl.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
            TransactionStatus txStatus = transactionManager.getTransaction(dcl);
            try {
                jdbcTemplate.execute(sql);
                transactionManager.rollback(txStatus);
            } catch (Exception e) {
                if (!txStatus.isCompleted()) {
                    try { transactionManager.rollback(txStatus); } catch (Exception ignored) {}
                }
                ErrorInfo info = extractErrorInfo(e);
                String errMsg = info.message() != null ? info.message().toLowerCase() : "";
                // 역할·관계(테이블)가 없는 오류는 구문이 올바르므로 시뮬레이션 성공으로 처리
                if (!errMsg.contains("does not exist")) {
                    return SqlResult.error(info.message(), info.position());
                }
            }
            return SqlResult.sim(type, String.format(
                    "%s 문 시뮬레이션 완료\n화면에서만 실행되며 실제 DB에는 반영되지 않습니다.%s", type, dialectNote));
        }

        // DML/DDL: 독립 트랜잭션(REQUIRES_NEW) 내 실행 후 항상 롤백 — 외부 트랜잭션과 격리
        DefaultTransactionDefinition dml = new DefaultTransactionDefinition();
        dml.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        TransactionStatus txStatus = transactionManager.getTransaction(dml);
        try {
            String msg;
            if (isDml) {
                int rows = jdbcTemplate.update(sql);
                msg = String.format(
                        "%s 문 시뮬레이션 완료 (%d행 영향)\n화면에서만 실행되며 실제 DB에는 반영되지 않습니다.\nSELECT로 조회하면 변경 사항이 없음을 확인할 수 있습니다.%s", type, rows, dialectNote);
            } else {
                // 복합 DDL 지원 — MySQL 트리거처럼 함수+트리거 두 문장으로 변환된 경우 순차 실행
                final String SPLIT = "\n---SPLIT---\n";
                if (sql.contains(SPLIT)) {
                    for (String stmt : sql.split(Pattern.quote(SPLIT))) {
                        if (!stmt.isBlank()) jdbcTemplate.execute(stmt.trim());
                    }
                } else {
                    jdbcTemplate.execute(sql);
                }
                msg = String.format(
                        "%s 문 시뮬레이션 완료\n화면에서만 실행되며 실제 DB에는 반영되지 않습니다.\nSELECT로 조회하면 변경 사항이 없음을 확인할 수 있습니다.%s", type, dialectNote);
            }
            transactionManager.rollback(txStatus);
            return SqlResult.sim(type, msg);
        } catch (Exception e) {
            if (!txStatus.isCompleted()) {
                try { transactionManager.rollback(txStatus); } catch (Exception ignored) {}
            }
            ErrorInfo info = extractErrorInfo(e);
            return SqlResult.error(info.message(), info.position());
        }
    }

    private String detectDmlType(String upper) {
        if (upper.startsWith("INSERT"))   return "INSERT";
        if (upper.startsWith("UPDATE"))   return "UPDATE";
        if (upper.startsWith("DELETE"))   return "DELETE";
        if (upper.startsWith("CREATE")) {
            // CREATE OR REPLACE ... 패턴도 처리
            String rest = upper.replaceFirst("^CREATE\\s+(OR\\s+REPLACE\\s+)?", "").stripLeading();
            if (rest.startsWith("INDEX") || rest.startsWith("UNIQUE")) return "CREATE INDEX";
            if (rest.startsWith("VIEW"))      return "CREATE VIEW";
            if (rest.startsWith("FUNCTION"))  return "CREATE FUNCTION";
            if (rest.startsWith("PROCEDURE")) return "CREATE PROCEDURE";
            if (rest.startsWith("TRIGGER"))   return "CREATE TRIGGER";
            return "CREATE TABLE";
        }
        if (upper.startsWith("ALTER"))    return "ALTER";
        if (upper.startsWith("DROP"))     return "DROP";
        if (upper.startsWith("TRUNCATE")) return "TRUNCATE";
        if (upper.startsWith("GRANT"))    return "GRANT";
        if (upper.startsWith("REVOKE"))   return "REVOKE";
        return "SQL";
    }

    // ── 방언 역검증: 선택 방언에서 유효하지 않은 문법 차단 ─────────────────────────

    private SqlResult validateDialectSyntax(String sql, String userEmail, String dialect) {
        if ("postgresql".equals(dialect) || dialect == null) return null;

        // 문자열 리터럴 제거 후 검사 — 'NOW()' 같은 값이 함수 호출로 잘못 감지되는 것 방지
        String cleaned = sql.replaceAll("(?s)'[^']*'", "''");
        String up = cleaned.toUpperCase().stripLeading();
        boolean isDdl = up.startsWith("CREATE") || up.startsWith("ALTER");

        List<String> errors = new ArrayList<>();

        if ("mysql".equals(dialect)) {
            if (up.contains("$$"))
                errors.add("MySQL은 달러 쿼팅($$ ... $$)을 지원하지 않습니다.\n→ 프로시저·함수는 CREATE PROCEDURE ... BEGIN...END 문법을 사용하세요.");
            if (up.matches("(?s).*\\bLANGUAGE\\s+PLPGSQL\\b.*"))
                errors.add("MySQL은 LANGUAGE plpgsql 구문을 지원하지 않습니다.\n→ CREATE PROCEDURE ... BEGIN...END 문법을 사용하세요.");
            if (up.matches("(?s).*\\bRETURNING\\b.*"))
                errors.add("MySQL은 RETURNING 절을 지원하지 않습니다.");
            if (up.matches("(?s).*\\bGENERATED\\s+(?:ALWAYS|BY\\s+DEFAULT)\\s+AS\\s+IDENTITY\\b.*"))
                errors.add("MySQL은 GENERATED [ALWAYS|BY DEFAULT] AS IDENTITY를 지원하지 않습니다.\n→ AUTO_INCREMENT를 사용하세요.");
            if (up.matches("(?s).*\\bILIKE\\b.*"))
                errors.add("MySQL은 ILIKE 연산자를 지원하지 않습니다.\n→ LIKE 또는 LOWER(col) LIKE LOWER('pat')를 사용하세요.");
            // Oracle 전용 타입 (DDL) — MySQL에는 없는 타입
            if (isDdl && up.matches("(?s).*\\bVARCHAR2\\b.*"))
                errors.add("MySQL은 VARCHAR2 타입을 지원하지 않습니다.\n→ VARCHAR를 사용하세요.");
            if (isDdl && up.matches("(?s).*\\bNUMBER\\b.*"))
                errors.add("MySQL은 NUMBER 타입을 지원하지 않습니다.\n→ DECIMAL(p,s) 또는 INT를 사용하세요.");
            // Oracle 전용 함수 — MySQL 미지원
            if (up.matches("(?s).*\\bSYSDATE\\b.*"))
                errors.add("MySQL은 SYSDATE를 지원하지 않습니다.\n→ NOW() 또는 CURRENT_TIMESTAMP를 사용하세요.");
            if (up.matches("(?s).*\\bNVL\\s*\\(.*"))
                errors.add("MySQL은 NVL() 함수를 지원하지 않습니다.\n→ IFNULL(col, value)를 사용하세요.");
            // ALTER COLUMN col TYPE — MySQL은 TYPE 키워드 미지원 (MODIFY COLUMN 사용)
            if (isDdl && up.matches("(?s).*\\bALTER\\s+COLUMN\\s+\\w+\\s+TYPE\\b.*"))
                errors.add("MySQL은 ALTER COLUMN col TYPE 문법을 지원하지 않습니다.\n→ MODIFY COLUMN col new_type을 사용하세요.");
            // ALTER COLUMN col SET/DROP NOT NULL — MySQL 미지원 (MODIFY COLUMN 사용)
            if (isDdl && up.matches("(?s).*\\bALTER\\s+COLUMN\\s+\\w+\\s+(SET|DROP)\\s+NOT\\s+NULL\\b.*"))
                errors.add("MySQL은 ALTER COLUMN col SET/DROP NOT NULL 문법을 지원하지 않습니다.\n→ MODIFY COLUMN col type [NOT NULL | NULL]을 사용하세요.");
            // Oracle 전용 트리거 행 참조(:NEW, :OLD) — MySQL 미지원 (NEW.col / OLD.col 사용)
            if (up.contains(":NEW.") || up.contains(":OLD."))
                errors.add("MySQL은 :NEW / :OLD 트리거 행 참조 문법을 지원하지 않습니다.\n→ NEW.column_name / OLD.column_name을 사용하세요.");
            // Oracle 전용 커서 타입 — MySQL 미지원 (CURSOR + DECLARE 문법 사용)
            if (up.contains("SYS_REFCURSOR"))
                errors.add("MySQL은 SYS_REFCURSOR를 지원하지 않습니다.\n→ DECLARE cursor_name CURSOR FOR select_statement 문법을 사용하세요.");
            // PostgreSQL 전용 EXECUTE FUNCTION/PROCEDURE 트리거 문법 — MySQL 미지원
            if (up.matches("(?s).*\\bEXECUTE\\s+(?:FUNCTION|PROCEDURE)\\s+\\w+\\s*\\(.*"))
                errors.add("MySQL은 EXECUTE FUNCTION 트리거 문법을 지원하지 않습니다.\n→ 트리거 본문을 직접 FOR EACH ROW BEGIN ... END 블록으로 작성하세요.");
        }

        if ("oracle".equals(dialect)) {
            if (up.matches("(?s).*\\bSERIAL\\b.*"))
                errors.add("Oracle은 SERIAL 타입을 지원하지 않습니다.\n→ GENERATED ALWAYS AS IDENTITY 또는 시퀀스(CREATE SEQUENCE)를 사용하세요.");
            if (isDdl && up.matches("(?s).*\\bTEXT\\b.*"))
                errors.add("Oracle은 TEXT 타입을 지원하지 않습니다.\n→ CLOB(대용량) 또는 VARCHAR2(최대 4000자)를 사용하세요.");
            if (isDdl && up.matches("(?s).*\\bBOOLEAN\\b.*"))
                errors.add("Oracle은 BOOLEAN 타입을 지원하지 않습니다. (Oracle 23c 이전)\n→ NUMBER(1) CHECK (col IN (0, 1)) 패턴을 사용하세요.");
            if (up.matches("(?s).*\\bNOW\\s*\\(\\s*\\).*"))
                errors.add("Oracle은 NOW() 함수를 지원하지 않습니다.\n→ SYSDATE 또는 CURRENT_TIMESTAMP를 사용하세요.");
            if (up.matches("(?s).*\\bLIMIT\\s+\\d+.*"))
                errors.add("Oracle은 LIMIT 절을 지원하지 않습니다.\n→ FETCH FIRST N ROWS ONLY 또는 WHERE ROWNUM <= N을 사용하세요.");
            if (up.contains("AUTO_INCREMENT"))
                errors.add("Oracle은 AUTO_INCREMENT를 지원하지 않습니다.\n→ GENERATED ALWAYS AS IDENTITY를 사용하세요.");
            if (up.contains("$$"))
                errors.add("Oracle은 달러 쿼팅($$ ... $$)을 지원하지 않습니다.\n→ PL/SQL은 CREATE OR REPLACE ... AS BEGIN...END; 문법을 사용하세요.");
            if (up.matches("(?s).*\\bLANGUAGE\\s+PLPGSQL\\b.*"))
                errors.add("Oracle은 LANGUAGE plpgsql 구문을 지원하지 않습니다.\n→ PL/SQL(CREATE OR REPLACE ... AS BEGIN...END;) 문법을 사용하세요.");
            if (up.matches("(?s).*\\bILIKE\\b.*"))
                errors.add("Oracle은 ILIKE 연산자를 지원하지 않습니다.\n→ UPPER(col) LIKE UPPER('pat')를 사용하세요.");
            // Oracle은 ALTER COLUMN 문법 자체가 없음 — MODIFY (col new_type) 사용
            if (isDdl && up.matches("(?s).*\\bALTER\\s+COLUMN\\b.*"))
                errors.add("Oracle은 ALTER COLUMN 문법을 지원하지 않습니다.\n→ MODIFY (col new_type) 또는 MODIFY col NOT NULL을 사용하세요.");
            // Oracle은 ADD COLUMN 대신 ADD (col_def) — COLUMN 키워드 미지원
            if (isDdl && up.matches("(?s).*\\bADD\\s+COLUMN\\b.*"))
                errors.add("Oracle은 ADD COLUMN 문법을 지원하지 않습니다.\n→ ADD (col_name type [DEFAULT value])를 사용하세요.");
            // Oracle SQL에서 TRUE/FALSE 리터럴 미지원 (Oracle 23c 이전)
            if (up.matches("(?s).*\\b(TRUE|FALSE)\\b.*"))
                errors.add("Oracle은 TRUE/FALSE 리터럴을 SQL에서 지원하지 않습니다. (Oracle 23c 이전)\n→ 1/0 또는 'Y'/'N'을 사용하세요.");
            // PostgreSQL 전용 EXECUTE FUNCTION/PROCEDURE 트리거 문법 — Oracle 미지원
            if (up.matches("(?s).*\\bEXECUTE\\s+(?:FUNCTION|PROCEDURE)\\s+\\w+\\s*\\(.*"))
                errors.add("Oracle은 EXECUTE FUNCTION 트리거 문법을 지원하지 않습니다.\n→ 트리거 본문을 직접 FOR EACH ROW BEGIN ... END 블록으로 작성하세요.");
        }

        if (!errors.isEmpty()) {
            String dialectName = "mysql".equals(dialect) ? "MySQL" : "Oracle";
            String msg = "[" + dialectName + " 방언] 선택한 방언에서 지원하지 않는 문법이 포함되어 있습니다:\n\n"
                    + errors.stream().map(e -> "• " + e).collect(java.util.stream.Collectors.joining("\n\n"));
            return saveAndReturn(userEmail, sql, SqlResult.error(msg));
        }
        return null;
    }

    // ── 방언 변환: MySQL/Oracle → PostgreSQL ───────────────────────────────────

    private String translateToPostgres(String sql, String dialect) {
        if (dialect == null || "postgresql".equals(dialect)) return sql;
        if ("mysql".equals(dialect))  return translateMysql(sql);
        if ("oracle".equals(dialect)) return translateOracle(sql);
        return sql;
    }

    private String translateMysql(String sql) {
        // 백틱 식별자 → 제거 (PostgreSQL은 큰따옴표를 사용하지만 식별자 유지가 목적)
        sql = sql.replace("`", "");
        // UNIQUE KEY name (cols) → CONSTRAINT name UNIQUE (cols)
        sql = sql.replaceAll("(?i)\\bUNIQUE\\s+KEY\\s+(\\w+)\\s*\\(", "CONSTRAINT $1 UNIQUE (");
        // KEY name (cols) 인덱스 전용 정의 제거 (UNIQUE KEY 치환 후 남은 것)
        sql = sql.replaceAll("(?i),?\\s*\\bKEY\\s+\\w+\\s*\\([^)]*\\)", "");
        // AUTO_INCREMENT → GENERATED ALWAYS AS IDENTITY
        sql = sql.replaceAll("(?i)\\bAUTO_INCREMENT\\b", "GENERATED ALWAYS AS IDENTITY");
        // DATETIME → TIMESTAMP
        sql = sql.replaceAll("(?i)\\bDATETIME\\b", "TIMESTAMP");
        // TINYINT → SMALLINT
        sql = sql.replaceAll("(?i)\\bTINYINT\\b", "SMALLINT");
        // MEDIUMINT → INTEGER
        sql = sql.replaceAll("(?i)\\bMEDIUMINT\\b", "INTEGER");
        // UNSIGNED 제거
        sql = sql.replaceAll("(?i)\\bUNSIGNED\\b", "");
        // CHARACTER SET 제거
        sql = sql.replaceAll("(?i)\\bCHARACTER\\s+SET\\s+\\w+", "");
        // COLLATE 제거
        sql = sql.replaceAll("(?i)\\bCOLLATE\\s+\\S+", "");
        // 컬럼 뒤 COMMENT '...' 제거
        sql = sql.replaceAll("(?i)\\bCOMMENT\\s+'[^']*'", "");
        // CREATE TABLE 끝 테이블 옵션(ENGINE=, DEFAULT CHARSET= 등) 제거
        sql = sql.replaceAll("(?si)(\\))\\s*(ENGINE|DEFAULT\\s+CHARSET|CHARSET|ROW_FORMAT|COLLATE|AUTO_INCREMENT\\s*=|PACK_KEYS|MIN_ROWS|MAX_ROWS)[^;]*", "$1");
        // IFNULL → COALESCE
        sql = sql.replaceAll("(?i)\\bIFNULL\\s*\\(", "COALESCE(");
        // KEY 제거 후 남은 `,)` 정리
        sql = sql.replaceAll(",\\s*\\)", ")");

        // ── MySQL 전용 DDL 변환 ────────────────────────────────────────────────

        // ALTER TABLE t AUTO_INCREMENT = N → ALTER TABLE t ALTER COLUMN id RESTART WITH N (시퀀스 리셋)
        sql = sql.replaceAll(
                "(?i)\\bALTER\\s+TABLE\\s+(\\w+)\\s+AUTO_INCREMENT\\s*=\\s*(\\d+)",
                "ALTER TABLE $1 ALTER COLUMN id RESTART WITH $2");

        // CREATE PROCEDURE (MySQL 인라인 문법) → PostgreSQL 형식
        // MySQL:      CREATE PROCEDURE name(params) BEGIN...END
        // PostgreSQL: CREATE OR REPLACE PROCEDURE name(params) LANGUAGE plpgsql AS $$BEGIN...END;$$
        Matcher procM = Pattern.compile(
                "(?si)\\bCREATE\\s+PROCEDURE\\s+(\\w+)\\s*(\\((?:[^()]|\\([^()]*\\))*\\))\\s*BEGIN(.*?)END\\s*$"
        ).matcher(sql);
        if (procM.find()) {
            sql = "CREATE OR REPLACE PROCEDURE " + procM.group(1) + procM.group(2) + "\n" +
                  "LANGUAGE plpgsql\nAS $$\nBEGIN" + procM.group(3) + "END;\n$$";
        }

        // CREATE TRIGGER (MySQL BEGIN...END 인라인) → PostgreSQL 함수 + 트리거 (SPLIT 마커로 분리)
        // MySQL:      CREATE TRIGGER name AFTER INSERT ON table FOR EACH ROW BEGIN...END
        // PostgreSQL: CREATE FUNCTION func_name() RETURNS TRIGGER + CREATE TRIGGER ... EXECUTE FUNCTION
        Matcher trigM = Pattern.compile(
                "(?si)\\bCREATE\\s+TRIGGER\\s+(\\w+)\\s+(BEFORE|AFTER)\\s+(INSERT|UPDATE|DELETE)\\s+" +
                "ON\\s+(\\w+)\\s+FOR\\s+EACH\\s+ROW\\s+BEGIN(.*?)END\\s*$"
        ).matcher(sql);
        if (trigM.find()) {
            String trigName  = trigM.group(1);
            String timing    = trigM.group(2).toUpperCase();
            String event     = trigM.group(3).toUpperCase();
            String tableName = trigM.group(4);
            String body      = trigM.group(5).trim();
            String funcName  = "func_" + trigName.toLowerCase();
            sql = "CREATE OR REPLACE FUNCTION " + funcName + "() RETURNS TRIGGER AS $$\n" +
                  "BEGIN\n    " + body + "\n    RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql" +
                  "\n---SPLIT---\n" +
                  "CREATE TRIGGER " + trigName + "\n" + timing + " " + event + " ON " + tableName + "\n" +
                  "FOR EACH ROW EXECUTE FUNCTION " + funcName + "()";
        }

        return sql;
    }

    private String translateOracle(String sql) {
        // VARCHAR2 → VARCHAR
        sql = sql.replaceAll("(?i)\\bVARCHAR2\\b", "VARCHAR");
        // NVARCHAR2 → VARCHAR
        sql = sql.replaceAll("(?i)\\bNVARCHAR2\\b", "VARCHAR");
        // NUMBER(p,s) / NUMBER(p) → NUMERIC (정밀도·스케일이 있는 경우 NUMERIC 유지)
        sql = sql.replaceAll("(?i)\\bNUMBER\\b(\\s*\\()", "NUMERIC$1");
        // NUMBER 단독 (괄호 없음) → INTEGER (정수 ID·FK 참조 호환, prac_employees.id 등 SERIAL=INTEGER와 타입 일치)
        sql = sql.replaceAll("(?i)\\bNUMBER\\b", "INTEGER");
        // CLOB → TEXT
        sql = sql.replaceAll("(?i)\\bCLOB\\b", "TEXT");
        // BLOB → BYTEA
        sql = sql.replaceAll("(?i)\\bBLOB\\b", "BYTEA");
        // NCHAR → CHAR
        sql = sql.replaceAll("(?i)\\bNCHAR\\b", "CHAR");
        // SYSDATE → CURRENT_TIMESTAMP
        sql = sql.replaceAll("(?i)\\bSYSDATE\\b", "CURRENT_TIMESTAMP");
        // NVL → COALESCE
        sql = sql.replaceAll("(?i)\\bNVL\\s*\\(", "COALESCE(");
        // FROM DUAL → FROM (SELECT 1) AS dual
        sql = sql.replaceAll("(?i)\\bFROM\\s+DUAL\\b", "FROM (SELECT 1) AS dual");
        // Oracle MODIFY(...) → PostgreSQL ALTER COLUMN 변환
        // MODIFY(col RESTART START WITH n): IDENTITY 시퀀스 재시작 위치 지정
        sql = sql.replaceAll(
                "(?i)\\bMODIFY\\s*\\(\\s*(\\w+)\\s+RESTART\\s+START\\s+WITH\\s+(\\d+)\\s*\\)",
                "ALTER COLUMN $1 RESTART WITH $2");
        // MODIFY(col RESTART): 원래 시작값으로 재시작
        sql = sql.replaceAll(
                "(?i)\\bMODIFY\\s*\\(\\s*(\\w+)\\s+RESTART\\s*\\)",
                "ALTER COLUMN $1 RESTART");
        // MODIFY(col NOT NULL): NOT NULL 제약 추가
        sql = sql.replaceAll(
                "(?i)\\bMODIFY\\s*\\(\\s*(\\w+)\\s+NOT\\s+NULL\\s*\\)",
                "ALTER COLUMN $1 SET NOT NULL");
        // MODIFY(col NULL): NOT NULL 제약 해제
        sql = sql.replaceAll(
                "(?i)\\bMODIFY\\s*\\(\\s*(\\w+)\\s+NULL\\s*\\)",
                "ALTER COLUMN $1 DROP NOT NULL");
        // NUMBER → NUMERIC 변환 후 IDENTITY 컬럼에 NUMERIC이 남으면 PostgreSQL 오류 발생
        // (PostgreSQL identity column은 SMALLINT/INTEGER/BIGINT만 허용)
        sql = sql.replaceAll(
                "(?i)\\b(?:NUMERIC|DECIMAL)\\b(\\s+GENERATED\\b)",
                "INTEGER$1");
        // Oracle 프로시저(IS/AS BEGIN...END) → PostgreSQL (LANGUAGE plpgsql)
        // 파라미터: Oracle name mode type → PostgreSQL mode name type 순서 변환
        // SYS_REFCURSOR OUT → INOUT REFCURSOR 변환
        Matcher oProcM = Pattern.compile(
                "(?si)\\bCREATE\\s+(?:OR\\s+REPLACE\\s+)?PROCEDURE\\s+(\\w+)\\s*" +
                "(\\((?:[^()]|\\([^()]*\\))*\\))\\s*(?:IS|AS)\\s+BEGIN(.*?)END\\s*;?\\s*$"
        ).matcher(sql);
        if (oProcM.find()) {
            String procName = oProcM.group(1);
            String params   = oProcM.group(2);
            String body     = oProcM.group(3);
            // SYS_REFCURSOR → REFCURSOR
            params = params.replaceAll("(?i)\\bSYS_REFCURSOR\\b", "REFCURSOR");
            // Oracle name mode type → PostgreSQL mode name type 순서 변환
            params = params.replaceAll(
                    "(?i)\\b(\\w+)\\s+(IN\\s+OUT|IN|OUT)\\s+(\\w+(?:\\s*\\([^)]*\\))?)",
                    "$2 $1 $3");
            // IN OUT → INOUT
            params = params.replaceAll("(?i)\\bIN\\s+OUT\\b", "INOUT");
            // OUT name REFCURSOR → INOUT name REFCURSOR (PostgreSQL 커서 출력 표준 패턴)
            params = params.replaceAll("(?i)\\bOUT\\s+(\\w+)\\s+REFCURSOR\\b", "INOUT $1 REFCURSOR");
            sql = "CREATE OR REPLACE PROCEDURE " + procName + params + "\n" +
                  "LANGUAGE plpgsql\nAS $$\nBEGIN" + body + "END;\n$$";
        }

        // Oracle 인라인 트리거(BEGIN...END) → PostgreSQL 함수 + 트리거 (SPLIT 마커로 분리)
        // Oracle:      CREATE [OR REPLACE] TRIGGER name BEFORE|AFTER event ON table FOR EACH ROW BEGIN...END;
        // PostgreSQL:  CREATE OR REPLACE FUNCTION func_name() RETURNS TRIGGER + CREATE OR REPLACE TRIGGER
        Matcher oTrigM = Pattern.compile(
                "(?si)\\bCREATE\\s+(?:OR\\s+REPLACE\\s+)?TRIGGER\\s+(\\w+)\\s+" +
                "(BEFORE|AFTER)\\s+(INSERT|UPDATE|DELETE)\\s+" +
                "ON\\s+(\\w+)\\s+FOR\\s+EACH\\s+ROW\\s+BEGIN(.*?)END\\s*;?\\s*$"
        ).matcher(sql);
        if (oTrigM.find()) {
            String trigName  = oTrigM.group(1);
            String timing    = oTrigM.group(2).toUpperCase();
            String event     = oTrigM.group(3).toUpperCase();
            String tableName = oTrigM.group(4);
            String body      = oTrigM.group(5).trim();
            // Oracle 행 참조 :NEW → NEW, :OLD → OLD
            body = body.replaceAll("(?i):NEW\\.", "NEW.");
            body = body.replaceAll("(?i):OLD\\.", "OLD.");
            String funcName  = "func_" + trigName.toLowerCase();
            sql = "CREATE OR REPLACE FUNCTION " + funcName + "() RETURNS TRIGGER AS $$\n" +
                  "BEGIN\n    " + body + "\n    RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql" +
                  "\n---SPLIT---\n" +
                  "CREATE OR REPLACE TRIGGER " + trigName + "\n" + timing + " " + event + " ON " + tableName + "\n" +
                  "FOR EACH ROW EXECUTE FUNCTION " + funcName + "()";
        }
        return sql;
    }

    /**
     * ALTER TABLE t ALTER COLUMN col RESTART [WITH n] 패턴에서
     * 컬럼이 SERIAL이면 ALTER SEQUENCE seq RESTART [WITH n] 으로 재작성한다.
     * IDENTITY 컬럼이거나 테이블/컬럼이 존재하지 않으면 원본 SQL을 그대로 반환한다.
     */
    private String resolveRestartWith(String sql) {
        Pattern p = Pattern.compile(
                "(?i)\\bALTER\\s+TABLE\\s+(\\w+)\\s+ALTER\\s+COLUMN\\s+(\\w+)\\s+RESTART(?:\\s+WITH\\s+(\\d+))?\\b");
        Matcher m = p.matcher(sql);
        if (!m.find()) return sql;

        String table = m.group(1);
        String col   = m.group(2);
        String val   = m.group(3); // null → RESTART without WITH

        try {
            // pg_attribute.attidentity: 'a'=ALWAYS, 'd'=BY DEFAULT, ''=IDENTITY 아님
            List<String> identity = jdbcTemplate.queryForList(
                    "SELECT a.attidentity::text FROM pg_attribute a " +
                    "JOIN pg_class c ON c.oid = a.attrelid " +
                    "WHERE c.relname = ? AND a.attname = ? AND a.attnum > 0",
                    String.class, table, col);

            if (!identity.isEmpty() && !identity.get(0).isEmpty()) {
                return sql; // IDENTITY 컬럼 — ALTER COLUMN RESTART WITH 그대로 사용
            }

            // SERIAL 컬럼 — pg_get_serial_sequence 로 시퀀스 이름 조회
            List<String> seqs = jdbcTemplate.queryForList(
                    "SELECT pg_get_serial_sequence(?, ?)", String.class, table, col);
            if (!seqs.isEmpty() && seqs.get(0) != null) {
                String seqName     = seqs.get(0);
                String restartClause = val != null ? "RESTART WITH " + val : "RESTART";
                return m.replaceFirst(
                        "ALTER SEQUENCE " + Matcher.quoteReplacement(seqName) + " " + restartClause);
            }
        } catch (Exception ignored) {}

        return sql;
    }

    private record ErrorInfo(String message, Integer position) {}

    private ErrorInfo extractErrorInfo(Exception e) {
        // Spring JDBC wraps the real DB error — traverse to root cause
        Throwable cause = e;
        while (cause.getCause() != null) cause = cause.getCause();

        String raw = cause.getMessage();
        if (raw == null || raw.isBlank()) {
            String fallback = e.getMessage();
            if (fallback != null && fallback.contains(";")) {
                fallback = fallback.substring(0, fallback.indexOf(";")).trim();
            }
            return new ErrorInfo(fallback != null ? fallback : "SQL 실행 중 오류가 발생했습니다.", null);
        }

        StringBuilder msg = new StringBuilder();
        Integer position = null;

        for (String line : raw.split("\n")) {
            line = line.trim();
            if (line.isEmpty()) continue;
            if (line.startsWith("ERROR: ")) {
                msg.append(line.substring(7));
            } else if (line.startsWith("DETAIL: ") || line.startsWith("Detail: ")) {
                if (msg.length() > 0) msg.append("\n상세: ").append(line.substring(line.indexOf(": ") + 2));
            } else if (line.startsWith("HINT: ") || line.startsWith("Hint: ")) {
                if (msg.length() > 0) msg.append("\n힌트: ").append(line.substring(line.indexOf(": ") + 2));
            } else if (line.startsWith("Position: ") || line.startsWith("POSITION: ")) {
                try { position = Integer.parseInt(line.substring(line.indexOf(": ") + 2).trim()); }
                catch (NumberFormatException ignored) {}
            } else if (msg.length() == 0) {
                msg.append(line);
            }
        }

        return new ErrorInfo(msg.length() > 0 ? msg.toString() : raw.split("\n")[0], position);
    }

    private SqlResult saveAndReturn(String userEmail, String sql, SqlResult result) {
        try {
            practiceHistoryRepository.save(PracticeHistory.builder()
                    .userEmail(userEmail != null ? userEmail : "unknown")
                    .sqlContent(sql)
                    .resultType(result.type())
                    .rowCount(result.rowCount())
                    .errorMessage(result.success() ? null : result.message())
                    .build());
        } catch (Exception e) {
            log.warn("[Practice] 히스토리 저장 실패: {}", e.getMessage());
        }
        return result;
    }

    private SqlResult runSelect(String sql) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
        if (rows.isEmpty()) return SqlResult.select(List.of(), List.of(), 0);
        List<String> columns = new ArrayList<>(rows.get(0).keySet());
        List<List<String>> data = rows.stream()
                .map(row -> columns.stream()
                        .map(c -> { Object v = row.get(c); return v == null ? "NULL" : v.toString(); })
                        .toList())
                .toList();
        return SqlResult.select(columns, data, rows.size());
    }

    private Set<String> extractTableNames(String sql) {
        Set<String> tables = new LinkedHashSet<>();

        // WITH절 CTE 이름 수집 — 가상 테이블이므로 prac_ 검증 대상에서 제외
        Set<String> cteNames = new HashSet<>();
        Matcher cteM = Pattern.compile(
            "\\b([a-zA-Z_][a-zA-Z0-9_]*)\\s+AS\\s*\\(",
            Pattern.CASE_INSENSITIVE
        ).matcher(sql);
        while (cteM.find()) {
            cteNames.add(cteM.group(1).toLowerCase());
        }

        Matcher m = Pattern.compile(
            "(?:FROM|(?:(?:INNER|LEFT|RIGHT|FULL|CROSS)\\s+)?(?:OUTER\\s+)?JOIN" +
            "|INTO|UPDATE|(?:CREATE|DROP|ALTER)\\s+TABLE(?:\\s+IF\\s+(?:NOT\\s+)?EXISTS)?)\\s+([a-zA-Z_][a-zA-Z0-9_]*)",
            Pattern.CASE_INSENSITIVE
        ).matcher(sql);
        Set<String> reserved = Set.of("select", "where", "set", "values", "on", "as",
                "inner", "outer", "left", "right", "full", "cross", "join", "natural", "exists");
        while (m.find()) {
            String name = m.group(1).toLowerCase();
            if (!reserved.contains(name) && !cteNames.contains(name)) tables.add(name);
        }
        return tables;
    }

    // ── 데이터 초기화 ───────────────────────────────────────────────────────

    public void resetData() {
        // 사용자 생성 prac_ 테이블 제거
        List<String> userCreated = jdbcTemplate.queryForList(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'prac_%'",
                String.class).stream()
                .filter(t -> !DEFAULT_PRAC_TABLES.contains(t))
                .toList();
        for (String t : userCreated) {
            jdbcTemplate.execute("DROP TABLE IF EXISTS " + t + " CASCADE");
            log.info("[Practice] 사용자 생성 테이블 삭제: {}", t);
        }
        // 기본 테이블 초기화
        jdbcTemplate.execute(
                "TRUNCATE TABLE prac_orders, prac_employees, prac_products, prac_departments RESTART IDENTITY CASCADE");
        seedDefaultData();
        log.info("[Practice] 연습 데이터 초기화 완료");
    }

    // ── 시드 데이터 ─────────────────────────────────────────────────────────

    public void seedDefaultData() {
        seedDepartments();
        seedEmployees();
        seedProducts();
        seedOrders();
    }

    public void seedDepartments() {
        String sql = "INSERT INTO prac_departments (name, location, budget) VALUES (?, ?, ?)";
        jdbcTemplate.update(sql, "개발팀",   "서울 강남구",   50000000);
        jdbcTemplate.update(sql, "마케팅팀", "서울 마포구",   30000000);
        jdbcTemplate.update(sql, "인사팀",   "서울 영등포구", 20000000);
        jdbcTemplate.update(sql, "영업팀",   "부산 해운대구", 40000000);
        jdbcTemplate.update(sql, "기획팀",   "서울 강남구",   25000000);
    }

    public void seedEmployees() {
        String sql = "INSERT INTO prac_employees (name, department_id, salary, hire_date, email, job_title) VALUES (?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, "김민준", 1, 5000000, java.sql.Date.valueOf("2023-03-15"), "kim.mj@tpmp.com",  "백엔드 개발자");
        jdbcTemplate.update(sql, "이서연", 1, 4500000, java.sql.Date.valueOf("2022-07-01"), "lee.sy@tpmp.com",  "프론트엔드 개발자");
        jdbcTemplate.update(sql, "박지훈", 2, 4000000, java.sql.Date.valueOf("2021-11-20"), "park.jh@tpmp.com", "마케팅 매니저");
        jdbcTemplate.update(sql, "최수아", 3, 3800000, java.sql.Date.valueOf("2024-01-10"), "choi.sa@tpmp.com", "HR 전문가");
        jdbcTemplate.update(sql, "정유진", 4, 4200000, java.sql.Date.valueOf("2022-05-17"), "jung.yj@tpmp.com", "영업 매니저");
        jdbcTemplate.update(sql, "강도현", 1, 5500000, java.sql.Date.valueOf("2020-08-30"), "kang.dh@tpmp.com", "시니어 개발자");
        jdbcTemplate.update(sql, "윤하은", 5, 3900000, java.sql.Date.valueOf("2023-09-05"), "yoon.he@tpmp.com", "기획자");
        jdbcTemplate.update(sql, "임재현", 2, 3700000, java.sql.Date.valueOf("2024-03-22"), "lim.jh@tpmp.com",  "마케팅 담당자");
        jdbcTemplate.update(sql, "오지수", 4, 4800000, java.sql.Date.valueOf("2021-06-14"), "oh.js@tpmp.com",   "영업부장");
        jdbcTemplate.update(sql, "신예린", 1, 4300000, java.sql.Date.valueOf("2023-11-08"), "shin.yr@tpmp.com", "풀스택 개발자");
    }

    public void seedProducts() {
        String sql = "INSERT INTO prac_products (name, category, price, stock) VALUES (?, ?, ?, ?)";
        jdbcTemplate.update(sql, "Java 완전 정복",       "도서", 35000,  150);
        jdbcTemplate.update(sql, "Python 데이터 분석",   "도서", 28000,  200);
        jdbcTemplate.update(sql, "AWS 자격증 패키지",    "강의", 150000, 50);
        jdbcTemplate.update(sql, "리눅스 마스터 강의",   "강의", 80000,  30);
        jdbcTemplate.update(sql, "정보처리기사 핵심 요약", "도서", 22000, 300);
        jdbcTemplate.update(sql, "SQL 기초부터 실전까지", "도서", 32000,  180);
        jdbcTemplate.update(sql, "클라우드 아키텍처 설계", "강의", 200000, 20);
        jdbcTemplate.update(sql, "네트워크 보안 실습",   "강의", 120000, 40);
    }

    public void seedOrders() {
        String sql = "INSERT INTO prac_orders (customer_name, product_id, quantity, total_amount, order_date) VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, "홍길동", 1, 2, 70000,  java.sql.Date.valueOf("2026-01-15"));
        jdbcTemplate.update(sql, "이몽룡", 3, 1, 150000, java.sql.Date.valueOf("2026-01-20"));
        jdbcTemplate.update(sql, "성춘향", 6, 3, 96000,  java.sql.Date.valueOf("2026-02-03"));
        jdbcTemplate.update(sql, "변학도", 5, 5, 110000, java.sql.Date.valueOf("2026-02-14"));
        jdbcTemplate.update(sql, "홍길동", 2, 2, 56000,  java.sql.Date.valueOf("2026-02-28"));
        jdbcTemplate.update(sql, "김선달", 7, 1, 200000, java.sql.Date.valueOf("2026-03-05"));
        jdbcTemplate.update(sql, "이몽룡", 4, 2, 160000, java.sql.Date.valueOf("2026-03-12"));
        jdbcTemplate.update(sql, "박세리", 1, 1, 35000,  java.sql.Date.valueOf("2026-03-20"));
        jdbcTemplate.update(sql, "최지우", 8, 3, 360000, java.sql.Date.valueOf("2026-04-01"));
        jdbcTemplate.update(sql, "강호동", 5, 2, 44000,  java.sql.Date.valueOf("2026-04-10"));
        jdbcTemplate.update(sql, "유재석", 6, 1, 32000,  java.sql.Date.valueOf("2026-04-15"));
        jdbcTemplate.update(sql, "이효리", 3, 2, 300000, java.sql.Date.valueOf("2026-04-30"));
    }

    // ── Result DTO ──────────────────────────────────────────────────────────

    public record SqlResult(
            String type,
            List<String> columns,
            List<List<String>> rows,
            int rowCount,
            String message,
            boolean success,
            Integer errorPosition,
            boolean simulated
    ) {
        public static SqlResult select(List<String> columns, List<List<String>> rows, int count) {
            return new SqlResult("SELECT", columns, rows, count, count + "개 행 조회됨", true, null, false);
        }
        public static SqlResult error(String message) {
            return new SqlResult("ERROR", List.of(), List.of(), 0, message, false, null, false);
        }
        public static SqlResult error(String message, Integer position) {
            return new SqlResult("ERROR", List.of(), List.of(), 0, message, false, position, false);
        }
        public static SqlResult sim(String type, String message) {
            return new SqlResult(type, List.of(), List.of(), 0, message, true, null, true);
        }
    }
}
