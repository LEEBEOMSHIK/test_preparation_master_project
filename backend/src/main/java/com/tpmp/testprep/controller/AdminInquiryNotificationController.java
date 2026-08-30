package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.InquiryNotificationSettingsRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.InquiryNotificationSettingsResponse;
import com.tpmp.testprep.service.InquiryNotificationSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/inquiry-notification-settings")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminInquiryNotificationController {
    private final InquiryNotificationSettingsService settingsService;

    @GetMapping
    public ResponseEntity<ApiResponse<InquiryNotificationSettingsResponse>> get() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.get()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<InquiryNotificationSettingsResponse>> update(
            @Valid @RequestBody InquiryNotificationSettingsRequest request) {
        return ResponseEntity.ok(ApiResponse.success(settingsService.update(request)));
    }
}
