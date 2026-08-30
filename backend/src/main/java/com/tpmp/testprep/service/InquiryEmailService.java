package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.InquiryEmailDeliveryResponse;
import com.tpmp.testprep.entity.Inquiry;
import com.tpmp.testprep.entity.InquiryEmailDelivery;
import com.tpmp.testprep.entity.InquiryMessage;
import com.tpmp.testprep.entity.InquiryNotificationSettings;
import com.tpmp.testprep.event.InquiryEmailQueuedEvent;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.InquiryEmailDeliveryRepository;
import com.tpmp.testprep.repository.InquiryNotificationSettingsRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class InquiryEmailService {
    private static final String SUBJECT = "[TPMP] 문의·요청 알림";
    private static final long SETTINGS_ID = InquiryNotificationSettings.SINGLETON_ID;

    private final InquiryNotificationSettingsRepository settingsRepository;
    private final InquiryEmailDeliveryRepository deliveryRepository;
    private final ApplicationEventPublisher eventPublisher;
    @Value("${app.public-url:http://localhost:3000}")
    private String publicUrl;

    public InquiryEmailService(InquiryNotificationSettingsRepository settingsRepository,
                               InquiryEmailDeliveryRepository deliveryRepository,
                               ApplicationEventPublisher eventPublisher) {
        this.settingsRepository = settingsRepository;
        this.deliveryRepository = deliveryRepository;
        this.eventPublisher = eventPublisher;
        this.publicUrl = "http://localhost:3000";
    }

    @Transactional
    public void queueAdminNotification(InquiryEmailDelivery.EventType eventType, Inquiry inquiry, InquiryMessage message) {
        settingsRepository.findById(SETTINGS_ID).filter(InquiryNotificationSettings::isEnabled)
                .ifPresent(settings -> settings.getRecipients().forEach(recipient ->
                        queue(eventType, inquiry, message, recipient.getEmail(), Audience.ADMIN)));
    }

    @Transactional
    public void queueUserNotification(InquiryEmailDelivery.EventType eventType, Inquiry inquiry, InquiryMessage message,
                                      boolean sendEmail) {
        if (sendEmail) {
            queue(eventType, inquiry, message, inquiry.getUser().getEmail(), Audience.USER);
        }
    }

    public Page<InquiryEmailDeliveryResponse> getDeliveries(Long inquiryId, InquiryEmailDelivery.Status status, Pageable pageable) {
        if (inquiryId != null && status != null) {
            return deliveryRepository.findByInquiryIdAndStatusOrderByCreatedAtDesc(inquiryId, status, pageable)
                    .map(InquiryEmailDeliveryResponse::from);
        }
        if (inquiryId != null) {
            return deliveryRepository.findByInquiryIdOrderByCreatedAtDesc(inquiryId, pageable).map(InquiryEmailDeliveryResponse::from);
        }
        if (status != null) {
            return deliveryRepository.findByStatusOrderByCreatedAtDesc(status, pageable).map(InquiryEmailDeliveryResponse::from);
        }
        return deliveryRepository.findAllByOrderByCreatedAtDesc(pageable).map(InquiryEmailDeliveryResponse::from);
    }

    @Transactional
    public void retry(Long deliveryId) {
        if (deliveryRepository.claimFailedForRetry(deliveryId) != 1) {
            throw new BusinessException(ErrorCode.INQUIRY_EMAIL_RETRY_NOT_ALLOWED);
        }
        eventPublisher.publishEvent(new InquiryEmailQueuedEvent(deliveryId));
    }

    private void queue(InquiryEmailDelivery.EventType eventType, Inquiry inquiry, InquiryMessage message, String recipientEmail,
                       Audience audience) {
        InquiryEmailDelivery saved = deliveryRepository.save(InquiryEmailDelivery.pending(inquiry, message, eventType,
                recipientEmail, SUBJECT, buildBody(eventType, inquiry, message, audience)));
        if (saved.getId() != null) {
            eventPublisher.publishEvent(new InquiryEmailQueuedEvent(saved.getId()));
        }
    }

    private String buildBody(InquiryEmailDelivery.EventType eventType, Inquiry inquiry, InquiryMessage message, Audience audience) {
        StringBuilder body = new StringBuilder("TPMP 문의·요청 알림입니다.\n\n")
                .append("접수 번호: ").append(inquiry.getId())
                .append("\n접수 유형: ").append(inquiry.getRequestType())
                .append("\n제목: ").append(inquiry.getTitle())
                .append("\n현재 상태: ").append(inquiry.getStatus());
        String guideContent = message != null ? message.getContent()
                : eventType == InquiryEmailDelivery.EventType.NEW_INQUIRY ? inquiry.getContent() : null;
        if (guideContent != null && !guideContent.isBlank()) {
            body.append("\n안내 내용:\n").append(guideContent);
        }
        String baseUrl = normalizedPublicUrl();
        if (!baseUrl.isBlank()) {
            String path = audience == Audience.USER ? "/user/inquiries/" : "/admin/inquiries/";
            body.append("\n\n상세 링크: ").append(baseUrl).append(path).append(inquiry.getId());
        }
        return body.toString();
    }

    private String normalizedPublicUrl() {
        if (publicUrl == null || publicUrl.isBlank()) {
            return "";
        }
        String normalized = publicUrl.trim();
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private enum Audience { ADMIN, USER }
}
