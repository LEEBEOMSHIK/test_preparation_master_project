package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.InquiryRequest;
import com.tpmp.testprep.dto.request.InquiryUpdateRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.request.InquiryMessageRequest;
import com.tpmp.testprep.dto.response.InquiryDetailResponse;
import com.tpmp.testprep.dto.response.InquiryMessageResponse;
import com.tpmp.testprep.dto.response.InquirySummaryResponse;
import com.tpmp.testprep.entity.Inquiry;
import com.tpmp.testprep.service.InquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/user/inquiries")
@RequiredArgsConstructor
public class UserInquiryController {

    private final InquiryService inquiryService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<InquirySummaryResponse>>> getMyInquiries(
            @RequestParam(required = false) Inquiry.Status status,
            Pageable pageable,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(
                inquiryService.getMyInquiries(email, status, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InquiryDetailResponse>> getMyInquiry(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(
                inquiryService.getMyInquiry(id, email)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InquiryDetailResponse>> create(
            @Valid @RequestBody InquiryRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(inquiryService.create(request, email)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<InquiryDetailResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody InquiryUpdateRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(inquiryService.update(id, request, email)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        inquiryService.delete(id, email);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<InquiryMessageResponse>> addMessage(@PathVariable Long id,
            @Valid @RequestBody InquiryMessageRequest request, @AuthenticationPrincipal String email) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(inquiryService.addUserMessage(id, request, email)));
    }

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadImage(
            @RequestPart("image") MultipartFile image, @AuthenticationPrincipal String email) {
        InquiryService.UploadResult result = inquiryService.uploadImage(image, email);
        return ResponseEntity.ok(ApiResponse.success(Map.of("id", result.id(), "url", result.url())));
    }

    @PostMapping(value = "/messages/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadMessageImage(@RequestPart("image") MultipartFile image,
            @AuthenticationPrincipal String email) {
        InquiryService.UploadResult result = inquiryService.uploadMessageImage(image, email);
        return ResponseEntity.ok(ApiResponse.success(Map.of("id", result.id(), "url", result.url())));
    }
}
