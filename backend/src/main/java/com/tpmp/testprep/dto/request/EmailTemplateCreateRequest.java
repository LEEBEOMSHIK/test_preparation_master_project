package com.tpmp.testprep.dto.request;

import com.tpmp.testprep.entity.EmailTemplate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EmailTemplateCreateRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull EmailTemplate.Scope scope,
        @NotBlank @Size(max = 200) String subjectTemplate,
        @NotBlank @Size(max = 100000) String htmlBody,
        boolean active) {
}
