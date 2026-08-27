package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.Inquiry;
import java.time.LocalDateTime;

public record InquirySummaryResponse(Long id, String title, String requestType, String targetArea,
                                     String status, LocalDateTime createdAt) {
    public static InquirySummaryResponse from(Inquiry inquiry) {
        return new InquirySummaryResponse(inquiry.getId(), inquiry.getTitle(), inquiry.getRequestType().name(),
                inquiry.getTargetArea(), inquiry.getStatus().name(), inquiry.getCreatedAt());
    }
}
