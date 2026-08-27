package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.InquiryEmailDeliveryResponse;
import com.tpmp.testprep.entity.InquiryEmailDelivery;
import com.tpmp.testprep.service.InquiryEmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/inquiry-email-deliveries")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminInquiryEmailDeliveryController {
    private final InquiryEmailService emailService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<InquiryEmailDeliveryResponse>>> get(
            @RequestParam(required = false) Long inquiryId,
            @RequestParam(required = false) InquiryEmailDelivery.Status status,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(emailService.getDeliveries(inquiryId, status, pageable)));
    }

    @PostMapping("/{id}/retry")
    public ResponseEntity<ApiResponse<Void>> retry(@PathVariable Long id) {
        emailService.retry(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
