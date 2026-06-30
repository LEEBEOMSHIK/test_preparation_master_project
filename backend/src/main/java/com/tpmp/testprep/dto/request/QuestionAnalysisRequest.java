package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotBlank;

public record QuestionAnalysisRequest(
        @NotBlank String content,
        String code,
        String language
) {}
