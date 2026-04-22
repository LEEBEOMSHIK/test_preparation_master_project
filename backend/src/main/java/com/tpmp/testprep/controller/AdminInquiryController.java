package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.InquiryReplyRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.InquiryResponse;
import com.tpmp.testprep.entity.Inquiry;
import com.tpmp.testprep.service.InquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/inquiries")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminInquiryController {

    private final InquiryService inquiryService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<InquiryResponse>>> getAll(
            @RequestParam(required = false) Inquiry.Status status,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                inquiryService.adminGetAll(status, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InquiryResponse>> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(inquiryService.adminGetOne(id)));
    }

    @PutMapping("/{id}/reply")
    public ResponseEntity<ApiResponse<InquiryResponse>> reply(
            @PathVariable Long id,
            @Valid @RequestBody InquiryReplyRequest request) {
        return ResponseEntity.ok(ApiResponse.success(inquiryService.adminReply(id, request)));
    }

    @PatchMapping("/{id}/hold")
    public ResponseEntity<ApiResponse<InquiryResponse>> toggleHold(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(inquiryService.adminToggleHold(id)));
    }
}
