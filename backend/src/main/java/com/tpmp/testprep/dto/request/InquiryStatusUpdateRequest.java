package com.tpmp.testprep.dto.request;

import com.tpmp.testprep.entity.Inquiry;
import jakarta.validation.constraints.NotNull;

public record InquiryStatusUpdateRequest(@NotNull Inquiry.Status status, boolean sendEmail) {}
