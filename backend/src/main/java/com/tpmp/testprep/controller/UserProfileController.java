package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.NicknameUpdateRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.UserResponse;
import com.tpmp.testprep.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/me")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @PatchMapping("/nickname")
    public ResponseEntity<ApiResponse<UserResponse>> updateNickname(
            @Valid @RequestBody NicknameUpdateRequest request,
            @AuthenticationPrincipal String email
    ) {
        return ResponseEntity.ok(ApiResponse.success(userProfileService.updateNickname(email, request)));
    }
}
