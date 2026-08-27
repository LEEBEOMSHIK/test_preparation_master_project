package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.Inquiry;
import java.time.LocalDateTime;
import java.util.List;

public record InquiryDetailResponse(Long id, String title, String content, String requestType, String targetArea,
                                    String detailLocation, String status, List<String> imageUrls,
                                    List<InquiryMessageResponse> messages, LocalDateTime createdAt,
                                    Long userId, String userName) {
    public static InquiryDetailResponse from(Inquiry inquiry, List<String> imageUrls,
                                             List<InquiryMessageResponse> messages) {
        return new InquiryDetailResponse(inquiry.getId(), inquiry.getTitle(), inquiry.getContent(),
                inquiry.getRequestType().name(), inquiry.getTargetArea(), inquiry.getDetailLocation(),
                inquiry.getStatus().name(), imageUrls, messages, inquiry.getCreatedAt(), inquiry.getUser().getId(),
                inquiry.getUser().getName());
    }
}
