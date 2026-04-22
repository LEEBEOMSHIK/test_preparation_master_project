package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.InquiryRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.InquiryResponse;
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
    public ResponseEntity<ApiResponse<Page<InquiryResponse>>> getMyInquiries(
            @RequestParam(required = false) Inquiry.Status status,
            Pageable pageable,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(
                inquiryService.getMyInquiries(email, status, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InquiryResponse>> getMyInquiry(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(
                inquiryService.getMyInquiry(id, email)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InquiryResponse>> create(
            @Valid @RequestBody InquiryRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(inquiryService.create(request, email)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        inquiryService.delete(id, email);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(
            @RequestPart("image") MultipartFile image) {
        String url = inquiryService.uploadImage(image);
        return ResponseEntity.ok(ApiResponse.success(Map.of("url", url)));
    }
}
