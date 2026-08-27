package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.InquiryMessage;
import java.time.LocalDateTime;
import java.util.List;

public record InquiryMessageResponse(Long id, Long authorId, String authorRole, String content,
                                     LocalDateTime createdAt, List<String> imageUrls) {
    public static InquiryMessageResponse from(InquiryMessage message, List<String> imageUrls) {
        return new InquiryMessageResponse(message.getId(),
                message.getAuthor() == null ? null : message.getAuthor().getId(),
                message.getAuthorRole().name(), message.getContent(), message.getCreatedAt(), imageUrls);
    }
}
