package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record QuoteRequest(
        @NotBlank @Size(max = 2000) String content,
        @Size(max = 200) String author
) {}
