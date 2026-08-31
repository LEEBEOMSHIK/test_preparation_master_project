package com.tpmp.testprep.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;
import java.util.Optional;

@Getter
@RequiredArgsConstructor
public enum EmailTemplateEvent {
    INQUIRY_ANSWERED("답변 완료", EmailTemplate.Scope.INQUIRY_STATUS,
            Inquiry.Status.ANSWERED, InquiryEmailDelivery.EventType.ANSWERED),
    INQUIRY_COMPLETED("처리 완료", EmailTemplate.Scope.INQUIRY_STATUS,
            Inquiry.Status.COMPLETED, InquiryEmailDelivery.EventType.COMPLETED),
    INQUIRY_UNABLE_TO_PROCESS("처리 불가", EmailTemplate.Scope.INQUIRY_STATUS,
            Inquiry.Status.UNABLE_TO_PROCESS, InquiryEmailDelivery.EventType.UNABLE_TO_PROCESS);

    private final String label;
    private final EmailTemplate.Scope scope;
    private final Inquiry.Status inquiryStatus;
    private final InquiryEmailDelivery.EventType deliveryEventType;

    public static Optional<EmailTemplateEvent> fromStatus(Inquiry.Status status) {
        return Arrays.stream(values())
                .filter(event -> event.inquiryStatus == status)
                .findFirst();
    }

    public static Optional<EmailTemplateEvent> fromCode(String eventCode) {
        if (eventCode == null) {
            return Optional.empty();
        }
        return Arrays.stream(values())
                .filter(event -> event.name().equals(eventCode))
                .findFirst();
    }
}
