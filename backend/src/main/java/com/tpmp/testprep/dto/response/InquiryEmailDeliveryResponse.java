package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.InquiryEmailDelivery;

import java.time.LocalDateTime;

public record InquiryEmailDeliveryResponse(Long id, Long inquiryId, Long inquiryMessageId,
                                           InquiryEmailDelivery.EventType eventType, InquiryEmailDelivery.Status status,
                                           String recipientEmail, String subject, int attemptCount, String lastError,
                                           LocalDateTime createdAt, LocalDateTime sentAt) {
    public static InquiryEmailDeliveryResponse from(InquiryEmailDelivery delivery) {
        return new InquiryEmailDeliveryResponse(delivery.getId(), delivery.getInquiry().getId(),
                delivery.getInquiryMessage() == null ? null : delivery.getInquiryMessage().getId(), delivery.getEventType(),
                delivery.getStatus(), delivery.getRecipientEmail(), delivery.getSubject(), delivery.getAttemptCount(),
                delivery.getLastError(), delivery.getCreatedAt(), delivery.getSentAt());
    }
}
