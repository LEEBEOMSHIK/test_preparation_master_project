package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.EmailTemplate;

import java.time.LocalDateTime;
import java.util.List;

public record EmailTemplateDetailResponse(
        Long id,
        String name,
        EmailTemplate.Scope scope,
        String subjectTemplate,
        String htmlBody,
        String textBody,
        boolean active,
        boolean defaultTemplate,
        long referenceCount,
        List<EmailTemplateReferenceResponse> referencedEvents,
        boolean deletable,
        List<EmailTemplateVariableResponse> allowedVariables,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
