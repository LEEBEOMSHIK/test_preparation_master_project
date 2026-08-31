package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.EmailTemplate;

import java.time.LocalDateTime;
import java.util.List;

public record EmailTemplateSummaryResponse(
        Long id,
        String name,
        EmailTemplate.Scope scope,
        boolean active,
        boolean defaultTemplate,
        long referenceCount,
        List<EmailTemplateReferenceResponse> referencedEvents,
        boolean deletable,
        LocalDateTime updatedAt) {
}
