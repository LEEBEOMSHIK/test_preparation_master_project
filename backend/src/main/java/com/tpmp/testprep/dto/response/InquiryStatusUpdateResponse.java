package com.tpmp.testprep.dto.response;

public record InquiryStatusUpdateResponse(
        InquiryDetailResponse inquiry,
        InquiryStatusEmailOutcome emailOutcome,
        String emailMessage,
        String templateSettingsUrl) {
}
