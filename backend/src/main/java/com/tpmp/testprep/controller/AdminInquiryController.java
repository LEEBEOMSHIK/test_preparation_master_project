package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.AdminInquiryMessageRequest;
import com.tpmp.testprep.dto.request.InquiryStatusUpdateRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.InquiryDetailResponse;
import com.tpmp.testprep.dto.response.InquiryMessageResponse;
import com.tpmp.testprep.dto.response.InquirySummaryResponse;
import com.tpmp.testprep.dto.response.InquiryStatusUpdateResponse;
import com.tpmp.testprep.entity.Inquiry;
import com.tpmp.testprep.service.InquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/inquiries")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminInquiryController {

    private final InquiryService inquiryService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<InquirySummaryResponse>>> getAll(
            @RequestParam(required = false) Inquiry.Status status, @RequestParam(required = false) Inquiry.RequestType requestType,
            @RequestParam(required = false) String targetArea,
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                inquiryService.adminGetAll(status, requestType, targetArea, keyword, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InquiryDetailResponse>> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(inquiryService.adminGetOne(id)));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<InquiryMessageResponse>> addMessage(
            @PathVariable Long id,
            @Valid @RequestBody AdminInquiryMessageRequest request, @AuthenticationPrincipal String email) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success(inquiryService.addAdminMessage(id, request, email)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<InquiryStatusUpdateResponse>> updateStatus(@PathVariable Long id,
            @Valid @RequestBody InquiryStatusUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(inquiryService.updateStatus(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        inquiryService.adminDelete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
