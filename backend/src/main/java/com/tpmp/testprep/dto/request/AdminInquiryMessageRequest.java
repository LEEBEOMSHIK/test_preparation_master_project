package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record AdminInquiryMessageRequest(@NotBlank String content, @Size(max = 3) List<Long> attachmentIds, boolean sendEmail) {}
