package com.tpmp.testprep.dto.response;

import java.util.List;

public record EmailTemplateInUseDetails(
        List<EmailTemplateReferenceResponse> referencedEvents) {
}
