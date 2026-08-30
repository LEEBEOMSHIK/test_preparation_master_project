package com.tpmp.testprep.dto.request;

import com.tpmp.testprep.entity.Inquiry;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InquiryUpdateRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String content,
        @NotNull Inquiry.RequestType requestType,
        @Size(max = 100) String targetArea,
        @Size(max = 500) String detailLocation
) {}
