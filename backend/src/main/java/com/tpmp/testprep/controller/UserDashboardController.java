package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.UserDashboardResponse;
import com.tpmp.testprep.service.UserDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user/dashboard")
@RequiredArgsConstructor
public class UserDashboardController {

    private final UserDashboardService userDashboardService;

    /**
     * 사용자 통계 대시보드 조회.
     *
     * @param email 현재 인증 사용자 이메일 (JWT에서 추출)
     * @param days  집계 기간 (7·30 → 최근 N일, 0 → 전체)
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<UserDashboardResponse>> getStats(
            @AuthenticationPrincipal String email,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(
                ApiResponse.success(userDashboardService.getDashboard(email, days))
        );
    }
}
