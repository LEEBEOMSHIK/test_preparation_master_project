package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/db-tables")
@RequiredArgsConstructor
public class AdminDbTableController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<ApiResponse<List<String>>> listTables() {
        List<String> tables = jdbcTemplate.queryForList(
            "SELECT table_name FROM information_schema.tables " +
            "WHERE table_schema = 'public' AND table_type = 'BASE TABLE' " +
            "ORDER BY table_name",
            String.class
        );
        return ResponseEntity.ok(ApiResponse.success(tables));
    }

    @GetMapping("/{tableName}/columns")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getColumns(
            @PathVariable String tableName) {
        validateTableName(tableName);
        List<Map<String, Object>> columns = jdbcTemplate.queryForList(
            "SELECT column_name, data_type, is_nullable, column_default " +
            "FROM information_schema.columns " +
            "WHERE table_schema = 'public' AND table_name = ? " +
            "ORDER BY ordinal_position",
            tableName
        );
        return ResponseEntity.ok(ApiResponse.success(columns));
    }

    @GetMapping("/{tableName}/rows")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRows(
            @PathVariable String tableName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        validateTableName(tableName);
        String quoted = "\"" + tableName + "\"";
        Long total = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + quoted, Long.class);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT * FROM " + quoted + " ORDER BY 1 LIMIT ? OFFSET ?",
            size, (long) page * size
        );
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", rows);
        result.put("totalElements", total != null ? total : 0L);
        result.put("page", page);
        result.put("size", size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/{tableName}/rows")
    public ResponseEntity<ApiResponse<Void>> insertRow(
            @PathVariable String tableName,
            @RequestBody Map<String, Object> row) {
        validateTableName(tableName);
        if (row.isEmpty()) throw new BusinessException(ErrorCode.INVALID_INPUT);
        validateColumnNames(tableName, row.keySet());

        String cols = row.keySet().stream().map(k -> "\"" + k + "\"").collect(Collectors.joining(", "));
        String placeholders = row.keySet().stream().map(k -> "?").collect(Collectors.joining(", "));
        jdbcTemplate.update(
            "INSERT INTO \"" + tableName + "\" (" + cols + ") VALUES (" + placeholders + ")",
            row.values().toArray()
        );
        return ResponseEntity.ok(ApiResponse.success());
    }

    @PutMapping("/{tableName}/rows/{pk}")
    public ResponseEntity<ApiResponse<Void>> updateRow(
            @PathVariable String tableName,
            @PathVariable String pk,
            @RequestBody Map<String, Object> row) {
        validateTableName(tableName);
        if (row.isEmpty()) throw new BusinessException(ErrorCode.INVALID_INPUT);
        validateColumnNames(tableName, row.keySet());

        String setClause = row.keySet().stream().map(k -> "\"" + k + "\" = ?").collect(Collectors.joining(", "));
        Object[] params = new Object[row.size() + 1];
        int i = 0;
        for (Object v : row.values()) params[i++] = v;
        params[i] = pk;
        jdbcTemplate.update(
            "UPDATE \"" + tableName + "\" SET " + setClause + " WHERE id = ?",
            params
        );
        return ResponseEntity.ok(ApiResponse.success());
    }

    @DeleteMapping("/{tableName}/rows/{pk}")
    public ResponseEntity<ApiResponse<Void>> deleteRow(
            @PathVariable String tableName,
            @PathVariable String pk) {
        validateTableName(tableName);
        jdbcTemplate.update("DELETE FROM \"" + tableName + "\" WHERE id = ?", pk);
        return ResponseEntity.ok(ApiResponse.success());
    }

    private List<String> fetchTableNames() {
        return jdbcTemplate.queryForList(
            "SELECT table_name FROM information_schema.tables " +
            "WHERE table_schema = 'public' AND table_type = 'BASE TABLE'",
            String.class
        );
    }

    private void validateTableName(String tableName) {
        if (tableName == null || !tableName.matches("[a-zA-Z0-9_]+")) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        if (!fetchTableNames().contains(tableName)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }

    private void validateColumnNames(String tableName, Set<String> columnNames) {
        List<String> validCols = jdbcTemplate.queryForList(
            "SELECT column_name FROM information_schema.columns " +
            "WHERE table_schema = 'public' AND table_name = ?",
            String.class, tableName
        );
        for (String col : columnNames) {
            if (!validCols.contains(col)) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }
        }
    }
}
