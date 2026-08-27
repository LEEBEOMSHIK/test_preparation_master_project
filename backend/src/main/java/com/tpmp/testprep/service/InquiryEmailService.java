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
        settingsRepository.findFirstByOrderByIdAsc().filter(InquiryNotificationSettings::isEnabled)
                .ifPresent(settings -> settings.getRecipients().forEach(recipient ->
                        queue(eventType, inquiry, message, recipient.getEmail())));
    }

    @Transactional
    public void queueUserNotification(InquiryEmailDelivery.EventType eventType, Inquiry inquiry, InquiryMessage message,
                                      boolean sendEmail) {
        if (sendEmail) {
            queue(eventType, inquiry, message, inquiry.getUser().getEmail());
        }
    }

    public Page<InquiryEmailDeliveryResponse> getDeliveries(Long inquiryId, InquiryEmailDelivery.Status status, Pageable pageable) {
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

    private void queue(InquiryEmailDelivery.EventType eventType, Inquiry inquiry, InquiryMessage message, String recipientEmail) {
        InquiryEmailDelivery saved = deliveryRepository.save(InquiryEmailDelivery.pending(inquiry, message, eventType,
                recipientEmail, SUBJECT, buildBody(inquiry, message)));
        if (saved.getId() != null) {
            eventPublisher.publishEvent(new InquiryEmailQueuedEvent(saved.getId()));
        }
    }

    private String buildBody(Inquiry inquiry, InquiryMessage message) {
        StringBuilder body = new StringBuilder("TPMP 문의·요청 알림입니다.\n\n제목: ")
                .append(inquiry.getTitle());
        if (message != null) {
            body.append("\n\n메시지:\n").append(message.getContent());
        }
        if (publicUrl != null && !publicUrl.isBlank()) {
            body.append("\n\n확인: ").append(publicUrl).append("/admin/inquiries/").append(inquiry.getId());
        }
        return body.toString();
    }
}
