package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DomainMasterRequest(
        @NotBlank @Size(max = 100) String name
) {}
