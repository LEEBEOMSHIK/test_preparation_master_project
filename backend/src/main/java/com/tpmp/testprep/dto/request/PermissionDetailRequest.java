package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PermissionDetailRequest(
        @NotNull Long masterId,
        @NotBlank @Size(max = 100) String name,
        String description,
        @Size(max = 100) String code
) {}
