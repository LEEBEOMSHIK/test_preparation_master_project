package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotBlank;

public record InquiryReplyRequest(
        @NotBlank String reply
) {}
