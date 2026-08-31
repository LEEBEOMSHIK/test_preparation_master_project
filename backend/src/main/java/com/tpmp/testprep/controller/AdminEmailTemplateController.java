package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.EmailTemplateCreateRequest;
import com.tpmp.testprep.dto.request.EmailTemplatePreviewRequest;
import com.tpmp.testprep.dto.request.EmailTemplateUpdateRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.EmailTemplateDetailResponse;
import com.tpmp.testprep.dto.response.EmailTemplatePreviewResponse;
import com.tpmp.testprep.dto.response.EmailTemplateSummaryResponse;
import com.tpmp.testprep.dto.response.EmailTemplateTestSendResponse;
import com.tpmp.testprep.entity.EmailTemplate;
import com.tpmp.testprep.service.EmailTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/admin/email-templates")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminEmailTemplateController {

    private final EmailTemplateService service;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<EmailTemplateSummaryResponse>>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) EmailTemplate.Scope scope,
            @RequestParam(required = false) Boolean active,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                service.getAll(keyword, scope, active, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmailTemplateDetailResponse>> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getOne(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EmailTemplateDetailResponse>> create(
            @Valid @RequestBody EmailTemplateCreateRequest request,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.create(request, principal.getName())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmailTemplateDetailResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody EmailTemplateUpdateRequest request,
            Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                service.update(id, request, principal.getName())));
    }

    @PostMapping("/{id}/clone")
    public ResponseEntity<ApiResponse<EmailTemplateDetailResponse>> cloneTemplate(
            @PathVariable Long id,
            Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                service.cloneTemplate(id, principal.getName())));
    }

    @PostMapping("/{id}/reset-default")
    public ResponseEntity<ApiResponse<EmailTemplateDetailResponse>> resetDefault(
            @PathVariable Long id,
            Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                service.resetDefault(id, principal.getName())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            Principal principal) {
        service.delete(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success());
    }

    @PostMapping("/preview")
    public ResponseEntity<ApiResponse<EmailTemplatePreviewResponse>> preview(
            @Valid @RequestBody EmailTemplatePreviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.preview(request)));
    }

    @PostMapping("/{id}/test-send")
    public ResponseEntity<ApiResponse<EmailTemplateTestSendResponse>> testSend(
            @PathVariable Long id,
            Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                service.testSend(id, principal.getName())));
    }
}
