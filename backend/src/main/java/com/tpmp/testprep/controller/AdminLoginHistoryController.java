package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.LoginHistoryResponse;
import com.tpmp.testprep.dto.response.PagedResponse;
import com.tpmp.testprep.service.LoginHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/login-history")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminLoginHistoryController {

    private final LoginHistoryService loginHistoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<LoginHistoryResponse>>> getList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "name") String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "loginAt"));
        return ResponseEntity.ok(ApiResponse.success(
                loginHistoryService.getLoginHistories(keyword, type, from, to, pageable)));
    }
}
