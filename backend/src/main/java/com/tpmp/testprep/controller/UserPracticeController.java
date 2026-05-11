package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.service.PracticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/practice")
@RequiredArgsConstructor
public class UserPracticeController {

    private final PracticeService practiceService;

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

    public record SqlRequest(String sql, String dialect) {}
    public record TableInfo(String tableName, String description, List<String> columns) {}
}
