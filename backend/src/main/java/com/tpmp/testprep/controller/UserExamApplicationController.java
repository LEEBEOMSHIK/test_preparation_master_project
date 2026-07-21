package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.UserExamApplicationRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.UserExamApplicationResponse;
import com.tpmp.testprep.service.UserExamApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/exam-applications")
@RequiredArgsConstructor
public class UserExamApplicationController {

    private final UserExamApplicationService userExamApplicationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserExamApplicationResponse>>> getMine(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(userExamApplicationService.getMine(email)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserExamApplicationResponse>> create(
            @Valid @RequestBody UserExamApplicationRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(userExamApplicationService.create(email, request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserExamApplicationResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UserExamApplicationRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(userExamApplicationService.update(email, id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        userExamApplicationService.delete(email, id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
