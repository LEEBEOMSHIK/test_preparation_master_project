package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.LoginRequest;
import com.tpmp.testprep.dto.request.SignupRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.LoginResponse;
import com.tpmp.testprep.dto.response.UserResponse;
import com.tpmp.testprep.security.jwt.RefreshTokenCookieProvider;
import com.tpmp.testprep.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Void>> signup(@Valid @RequestBody SignupRequest request) {
        authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success());
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response,
            HttpServletRequest httpRequest) {
        LoginResponse loginResponse = authService.login(request, response, httpRequest);
        return ResponseEntity.ok(ApiResponse.success(loginResponse));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(
            @CookieValue(name = RefreshTokenCookieProvider.COOKIE_NAME_USER, required = false) String userRefreshToken,
            @CookieValue(name = RefreshTokenCookieProvider.COOKIE_NAME_ADMIN, required = false) String adminRefreshToken,
            @RequestParam(name = "scope", defaultValue = "user") String scope) {
        // 레거시 refresh_token 쿠키는 오염 경로(관리자 로그인이 사용자 세션을 덮어쓰던 버그)의
        // 원인이었으므로 fallback으로 절대 사용하지 않는다.
        String refreshToken = "admin".equals(scope) ? adminRefreshToken : userRefreshToken;
        return ResponseEntity.ok(ApiResponse.success(authService.refresh(refreshToken)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(authService.me(email)));
    }
}
