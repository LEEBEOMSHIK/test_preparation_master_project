package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record DomainMasterRequest(
        @Size(max = 50)
        @Pattern(regexp = "^[A-Z_]*$", message = "코드는 대문자와 밑줄(_)만 사용할 수 있습니다.")
        String code,

        @NotBlank @Size(max = 100) String name
) {}
