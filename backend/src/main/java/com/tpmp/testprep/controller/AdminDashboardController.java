package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.DashboardStatsResponse;
import com.tpmp.testprep.dto.response.DashboardTrendResponse;
import com.tpmp.testprep.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getStats()));
    }

    @GetMapping("/trend")
    public ResponseEntity<ApiResponse<DashboardTrendResponse>> getTrend(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getTrend(days)));
    }
}
