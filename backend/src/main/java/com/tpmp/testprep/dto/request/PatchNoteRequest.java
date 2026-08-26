package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PatchNoteRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 50) String version,
        @NotBlank String content,
        @NotNull Boolean published
) {}
