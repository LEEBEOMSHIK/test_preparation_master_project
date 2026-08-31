package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.EmailTemplate;
import com.tpmp.testprep.entity.EmailTemplateEvent;

public record EmailTemplateBindingResponse(
        EmailTemplateEvent eventCode,
        String eventLabel,
        EmailTemplate.Scope scope,
        Long templateId,
        String templateName,
        Boolean templateActive,
        boolean configured,
        boolean sendable,
        String unavailableReason) {
}
