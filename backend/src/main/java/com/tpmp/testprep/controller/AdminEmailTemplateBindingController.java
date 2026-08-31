package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.EmailTemplateBindingRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.EmailTemplateBindingResponse;
import com.tpmp.testprep.entity.EmailTemplateEvent;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.service.EmailTemplateBindingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/admin/email-template-bindings")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminEmailTemplateBindingController {

    private final EmailTemplateBindingService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<EmailTemplateBindingResponse>>> getAllBindings() {
        return ResponseEntity.ok(ApiResponse.success(service.getAllBindings()));
    }

    @PutMapping("/{eventCode}")
    public ResponseEntity<ApiResponse<EmailTemplateBindingResponse>> bind(
            @PathVariable String eventCode,
            @Valid @RequestBody EmailTemplateBindingRequest request,
            Principal principal) {
        EmailTemplateEvent event = findEvent(eventCode);
        return ResponseEntity.ok(ApiResponse.success(
                service.bind(event.name(), request.templateId(), principal.getName())));
    }

    @DeleteMapping("/{eventCode}")
    public ResponseEntity<ApiResponse<EmailTemplateBindingResponse>> unbind(
            @PathVariable String eventCode) {
        EmailTemplateEvent event = findEvent(eventCode);
        return ResponseEntity.ok(ApiResponse.success(service.unbind(event.name())));
    }

    private EmailTemplateEvent findEvent(String eventCode) {
        return EmailTemplateEvent.fromCode(eventCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMAIL_TEMPLATE_EVENT_NOT_FOUND));
    }
}
