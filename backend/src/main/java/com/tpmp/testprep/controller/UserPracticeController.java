package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.entity.DialectConversionRule;
import com.tpmp.testprep.repository.DialectConversionRuleRepository;
import com.tpmp.testprep.service.PracticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user/practice")
@RequiredArgsConstructor
public class UserPracticeController {

    private final PracticeService practiceService;
    private final DialectConversionRuleRepository conversionRuleRepository;

    /** SQL 실행 — prac_* 테이블만 허용 */
    @PostMapping("/sql/execute")
    public ResponseEntity<ApiResponse<PracticeService.SqlResult>> executeSql(
            @AuthenticationPrincipal String email,
            @RequestBody SqlRequest request) {
        return ResponseEntity.ok(ApiResponse.success(practiceService.execute(request.sql(), email, request.dialect())));
    }

    /** 연습 데이터 초기화 — 기본 prac_* 테이블을 원래 상태로 복원 */
    @PostMapping("/sql/reset")
    public ResponseEntity<ApiResponse<String>> resetData() {
        practiceService.resetData();
        return ResponseEntity.ok(ApiResponse.success("연습 데이터가 초기화되었습니다."));
    }

    /** 연습 테이블 스키마 정보 조회 */
    @GetMapping("/sql/tables")
    public ResponseEntity<ApiResponse<List<TableInfo>>> getTables() {
        List<TableInfo> tables = List.of(
            new TableInfo("prac_departments", "부서",
                List.of("id SERIAL PK", "name VARCHAR(100)", "location VARCHAR(100)", "budget NUMERIC(15,2)")),
            new TableInfo("prac_employees", "직원",
                List.of("id SERIAL PK", "name VARCHAR(100)", "department_id INT FK→prac_departments",
                        "salary NUMERIC(10,2)", "hire_date DATE", "email VARCHAR(100)", "job_title VARCHAR(100)")),
            new TableInfo("prac_products", "상품",
                List.of("id SERIAL PK", "name VARCHAR(200)", "category VARCHAR(100)",
                        "price NUMERIC(10,2)", "stock INT")),
            new TableInfo("prac_orders", "주문",
                List.of("id SERIAL PK", "customer_name VARCHAR(100)", "product_id INT FK→prac_products",
                        "quantity INT", "total_amount NUMERIC(10,2)", "order_date DATE"))
        );
        return ResponseEntity.ok(ApiResponse.success(tables));
    }

    /** 연습장 운영 규칙 조회 (변환 규칙 활성화 상태 포함) */
    @GetMapping("/rules")
    public ResponseEntity<ApiResponse<PracticeRules>> getRules() {
        List<DialectConversionRule> all = conversionRuleRepository.findAllByOrderByDialectAscDisplayOrderAsc();
        List<ConversionRuleDto> mysql = all.stream()
                .filter(r -> "mysql".equals(r.getDialect()))
                .map(ConversionRuleDto::from).collect(Collectors.toList());
        List<ConversionRuleDto> oracle = all.stream()
                .filter(r -> "oracle".equals(r.getDialect()))
                .map(ConversionRuleDto::from).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(PracticeRules.of(mysql, oracle)));
    }

    public record SqlRequest(String sql, String dialect) {}
    public record TableInfo(String tableName, String description, List<String> columns) {}

    public record TypoPattern(String typo, String correction) {}

    public record ConversionRuleDto(
            Long id, String dialect, String ruleKey,
            String userLabel, boolean enabled, boolean complex) {

        public static ConversionRuleDto from(DialectConversionRule r) {
            return new ConversionRuleDto(r.getId(), r.getDialect(), r.getRuleKey(),
                    r.getUserLabel(), r.isEnabled(), r.isComplex());
        }
    }

    public record PracticeRules(
            List<String> blockedCommands,
            String allowedTablePrefix,
            String multiStatementRule,
            List<TypoPattern> typoPatterns,
            List<ConversionRuleDto> mysqlConversionRules,
            List<ConversionRuleDto> oracleConversionRules) {

        public static PracticeRules of(List<ConversionRuleDto> mysql, List<ConversionRuleDto> oracle) {
            return new PracticeRules(
                    List.of("DROP DATABASE", "DROP SCHEMA", "TRUNCATE"),
                    "prac_",
                    "하나의 SQL 문만 실행 가능 (멀티 스테이트먼트 불가)",
                    List.of(
                            new TypoPattern("CREATE TALBE", "CREATE TABLE"),
                            new TypoPattern("SLECT / SELCT", "SELECT"),
                            new TypoPattern("SELECT ... FORM", "FROM"),
                            new TypoPattern("INSERT INOT / ITNO", "INSERT INTO"),
                            new TypoPattern("UPDTAE / UPDTE", "UPDATE"),
                            new TypoPattern("DELETE FORM / DELTE", "DELETE FROM / DELETE"),
                            new TypoPattern("GRUOP BY / GROP BY", "GROUP BY"),
                            new TypoPattern("ORDRER BY", "ORDER BY"),
                            new TypoPattern("WHER (E 누락)", "WHERE"),
                            new TypoPattern("JION", "JOIN")
                    ),
                    mysql,
                    oracle
            );
        }
    }
}
