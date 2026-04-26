package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.OnboardingRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.ExamInfoResponse;
import com.tpmp.testprep.dto.response.UserResponse;
import com.tpmp.testprep.service.ExamInfoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserExamInfoController {

    private final ExamInfoService examInfoService;

    @GetMapping("/exam-info")
    public ResponseEntity<ApiResponse<List<ExamInfoResponse>>> getExamInfo(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(examInfoService.getForUser(email)));
    }

    @PostMapping("/onboarding")
    public ResponseEntity<ApiResponse<UserResponse>> completeOnboarding(
            @Valid @RequestBody OnboardingRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(
                examInfoService.completeOnboarding(email, request)));
    }

    @PutMapping("/exam-info/interests")
    public ResponseEntity<ApiResponse<UserResponse>> updateInterests(
            @Valid @RequestBody OnboardingRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(
                examInfoService.updateInterests(email, request)));
    }
}
