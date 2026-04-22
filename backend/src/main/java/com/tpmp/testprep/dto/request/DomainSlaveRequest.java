package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DomainSlaveRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull @Min(1) Integer displayOrder
) {}
