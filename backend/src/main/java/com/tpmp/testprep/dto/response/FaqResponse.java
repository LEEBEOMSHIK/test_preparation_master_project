package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.Faq;

import java.time.LocalDateTime;

public record FaqResponse(
        Long id,
        String question,
        String answer,
        boolean isActive,
        int displayOrder,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static FaqResponse from(Faq faq) {
        return new FaqResponse(
                faq.getId(),
                faq.getQuestion(),
                faq.getAnswer(),
                faq.isActive(),
                faq.getDisplayOrder(),
                faq.getCreatedAt(),
                faq.getUpdatedAt()
        );
    }
}
