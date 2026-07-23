package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.SupportSettingsResponse;
import com.tpmp.testprep.service.SupportSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 로그인 사용자용 후원 링크 조회. `/user/support` 페이지 자체가 로그인 사용자 전용 라우트이므로
 * 인증만 요구하고 관리자 권한은 요구하지 않는다(SecurityConfig의 /api/user/** authenticated() 규칙 적용).
 */
@RestController
@RequestMapping("/api/user/support-settings")
@RequiredArgsConstructor
public class UserSupportSettingsController {

    private final SupportSettingsService supportSettingsService;

    @GetMapping
    public ResponseEntity<ApiResponse<SupportSettingsResponse>> get() {
        return ResponseEntity.ok(ApiResponse.success(supportSettingsService.get()));
    }
}
