package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmailTemplateUpdateRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 200) String subjectTemplate,
        @NotBlank @Size(max = 100000) String htmlBody,
        boolean active) {
}
