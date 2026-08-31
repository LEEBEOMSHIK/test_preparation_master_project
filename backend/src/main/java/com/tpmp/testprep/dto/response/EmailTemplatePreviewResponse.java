package com.tpmp.testprep.dto.response;

public record EmailTemplatePreviewResponse(
        String sanitizedHtmlBody,
        String renderedSubject,
        String renderedHtmlBody,
        String renderedTextBody,
        boolean unsafeContentRemoved) {
}
