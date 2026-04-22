package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotBlank;

public record FaqRequest(
        @NotBlank String question,
        @NotBlank String answer,
        boolean isActive,
        int displayOrder
) {}
