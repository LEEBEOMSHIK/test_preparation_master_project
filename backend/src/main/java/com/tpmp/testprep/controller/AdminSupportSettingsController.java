package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.SupportSettingsRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.SupportSettingsResponse;
import com.tpmp.testprep.service.SupportSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/support-settings")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminSupportSettingsController {

    private final SupportSettingsService supportSettingsService;

    @GetMapping
    public ResponseEntity<ApiResponse<SupportSettingsResponse>> get() {
        return ResponseEntity.ok(ApiResponse.success(supportSettingsService.get()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<SupportSettingsResponse>> update(
            @Valid @RequestBody SupportSettingsRequest request) {
        return ResponseEntity.ok(ApiResponse.success(supportSettingsService.update(request)));
    }
}
