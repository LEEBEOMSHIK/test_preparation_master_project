package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotNull;

public record PatchNotePublicationRequest(@NotNull Boolean published) {}
