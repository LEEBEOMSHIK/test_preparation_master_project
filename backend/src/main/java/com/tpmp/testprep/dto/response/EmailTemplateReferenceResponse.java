package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.EmailTemplateEvent;

public record EmailTemplateReferenceResponse(EmailTemplateEvent eventCode, String eventLabel) {
}
