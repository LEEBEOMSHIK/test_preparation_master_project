package com.tpmp.testprep.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PatchNoteRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 50) String version,
        @NotBlank String content,
        @NotNull Boolean published,
        @Valid List<PatchNoteItemRequest> items
) {
    public PatchNoteRequest(String title, String version, String content, Boolean published) {
        this(title, version, content, published, null);
    }
}
