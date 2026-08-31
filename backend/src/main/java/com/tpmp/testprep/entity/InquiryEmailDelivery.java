package com.tpmp.testprep.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "inquiry_email_deliveries")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InquiryEmailDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inquiry_id", nullable = false)
    private Inquiry inquiry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inquiry_message_id")
    private InquiryMessage inquiryMessage;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 30)
    private EventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @Column(name = "recipient_email", nullable = false, length = 255)
    private String recipientEmail;

    @Column(nullable = false, length = 500)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "html_body", columnDefinition = "TEXT")
    private String htmlBody;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount;

    @Column(name = "last_error", length = 500)
    private String lastError;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "processing_started_at")
    private LocalDateTime processingStartedAt;

    private InquiryEmailDelivery(Inquiry inquiry, InquiryMessage inquiryMessage, EventType eventType,
                                 String recipientEmail, String subject, String body, String htmlBody) {
        this.inquiry = inquiry;
        this.inquiryMessage = inquiryMessage;
        this.eventType = eventType;
        this.status = Status.PENDING;
        this.recipientEmail = recipientEmail;
        this.subject = subject;
        this.body = body;
        this.htmlBody = htmlBody;
    }

    public static InquiryEmailDelivery pending(Inquiry inquiry, InquiryMessage inquiryMessage, EventType eventType,
                                               String recipientEmail, String subject, String body) {
        return pending(inquiry, inquiryMessage, eventType, recipientEmail, subject, body, null);
    }

    public static InquiryEmailDelivery pending(Inquiry inquiry, InquiryMessage inquiryMessage, EventType eventType,
                                               String recipientEmail, String subject, String textBody, String htmlBody) {
        return new InquiryEmailDelivery(inquiry, inquiryMessage, eventType, recipientEmail, subject, textBody, htmlBody);
    }

    public void markSent() {
        attemptCount++;
        status = Status.SENT;
        lastError = null;
        sentAt = LocalDateTime.now();
        processingStartedAt = null;
    }

    public void markFailed(String error) {
        attemptCount++;
        status = Status.FAILED;
        lastError = error == null ? "메일 전송에 실패했습니다." : error.substring(0, Math.min(error.length(), 500));
        processingStartedAt = null;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum EventType { NEW_INQUIRY, USER_MESSAGE, ADMIN_MESSAGE, ANSWERED, COMPLETED, UNABLE_TO_PROCESS }
    public enum Status { PENDING, SENT, FAILED }
}
