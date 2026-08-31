package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.InquiryEmailDeliveryResponse;
import com.tpmp.testprep.dto.response.InquiryStatusEmailOutcome;
import com.tpmp.testprep.entity.Inquiry;
import com.tpmp.testprep.entity.InquiryEmailDelivery;
import com.tpmp.testprep.entity.InquiryMessage;
import com.tpmp.testprep.entity.InquiryNotificationSettings;
import com.tpmp.testprep.entity.EmailTemplate;
import com.tpmp.testprep.entity.EmailTemplateBinding;
import com.tpmp.testprep.entity.EmailTemplateEvent;
import com.tpmp.testprep.event.InquiryEmailQueuedEvent;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.InquiryEmailDeliveryRepository;
import com.tpmp.testprep.repository.InquiryNotificationSettingsRepository;
import com.tpmp.testprep.repository.EmailTemplateBindingRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class InquiryEmailService {
    private static final String SUBJECT = "[TPMP] 문의·요청 알림";
    private static final long SETTINGS_ID = InquiryNotificationSettings.SINGLETON_ID;

    private final InquiryNotificationSettingsRepository settingsRepository;
    private final InquiryEmailDeliveryRepository deliveryRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final EmailTemplateBindingRepository bindingRepository;
    private final EmailTemplateRenderer renderer;
    @Value("${app.public-url:http://localhost:3000}")
    private String publicUrl;

    public InquiryEmailService(InquiryNotificationSettingsRepository settingsRepository,
                               InquiryEmailDeliveryRepository deliveryRepository,
                               ApplicationEventPublisher eventPublisher,
                               EmailTemplateBindingRepository bindingRepository,
                               EmailTemplateRenderer renderer) {
        this.settingsRepository = settingsRepository;
        this.deliveryRepository = deliveryRepository;
        this.eventPublisher = eventPublisher;
        this.bindingRepository = bindingRepository;
        this.renderer = renderer;
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

    @Transactional
    public StatusEmailResult queueStatusNotification(Inquiry inquiry, boolean sendEmail) {
        if (!sendEmail) {
            return statusResult(InquiryStatusEmailOutcome.NOT_REQUESTED);
        }
        EmailTemplateEvent templateEvent = EmailTemplateEvent.fromStatus(inquiry.getStatus()).orElse(null);
        if (templateEvent == null) {
            return statusResult(InquiryStatusEmailOutcome.NOT_REQUESTED);
        }
        EmailTemplateBinding binding = bindingRepository.findByEventCode(templateEvent).orElse(null);
        if (binding == null) {
            return statusResult(InquiryStatusEmailOutcome.SKIPPED_TEMPLATE_MISSING);
        }
        EmailTemplate template = binding.getTemplate();
        if (!template.isActive()) {
            return statusResult(InquiryStatusEmailOutcome.SKIPPED_TEMPLATE_INACTIVE);
        }
        try {
            EmailTemplateRenderer.RenderedEmail rendered = renderer.render(
                    template.getScope(), template.getSubjectTemplate(), template.getHtmlBody(),
                    statusVariables(inquiry));
            InquiryEmailDelivery saved = deliveryRepository.save(InquiryEmailDelivery.pending(
                    inquiry,
                    null,
                    templateEvent.getDeliveryEventType(),
                    inquiry.getUser().getEmail(),
                    rendered.subject(),
                    rendered.textBody(),
                    rendered.htmlBody()));
            if (saved.getId() != null) {
                eventPublisher.publishEvent(new InquiryEmailQueuedEvent(saved.getId()));
            }
            return statusResult(InquiryStatusEmailOutcome.QUEUED);
        } catch (EmailTemplateRenderingException exception) {
            return statusResult(InquiryStatusEmailOutcome.SKIPPED_TEMPLATE_INVALID);
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

    public record StatusEmailResult(InquiryStatusEmailOutcome outcome, String safeMessage) {
    }

    private Map<String, String> statusVariables(Inquiry inquiry) {
        Map<String, String> variables = new LinkedHashMap<>();
        String nickname = inquiry.getUser().getNickname();
        variables.put("recipientName", nickname == null || nickname.isBlank()
                ? inquiry.getUser().getName() : nickname);
        variables.put("inquiryId", String.valueOf(inquiry.getId()));
        variables.put("inquiryTitle", inquiry.getTitle());
        variables.put("inquiryType", inquiryTypeLabel(inquiry.getRequestType()));
        variables.put("statusLabel", statusLabel(inquiry.getStatus()));
        variables.put("inquiryDetailUrl", normalizedPublicUrl() + "/user/inquiries/" + inquiry.getId());
        variables.put("serviceName", "TPMP");
        return variables;
    }

    private String inquiryTypeLabel(Inquiry.RequestType requestType) {
        return switch (requestType) {
            case GENERAL_INQUIRY -> "일반 문의";
            case BUG_REPORT -> "버그 신고";
            case EXAM_OPENING_REQUEST -> "시험 개설 요청";
            case FEATURE_REQUEST -> "신규 기능 요청";
            case OTHER -> "기타";
        };
    }

    private String statusLabel(Inquiry.Status status) {
        return switch (status) {
            case PENDING -> "접수";
            case IN_PROGRESS -> "검토 중";
            case ON_HOLD -> "보류";
            case ANSWERED -> "답변 완료";
            case COMPLETED -> "처리 완료";
            case UNABLE_TO_PROCESS -> "처리 불가";
        };
    }

    private StatusEmailResult statusResult(InquiryStatusEmailOutcome outcome) {
        String safeMessage = switch (outcome) {
            case NOT_REQUESTED -> "상태만 변경했습니다.";
            case QUEUED -> "상태 변경 안내 이메일을 발송 대기열에 등록했습니다.";
            case SKIPPED_TEMPLATE_MISSING -> "연결된 이메일 템플릿이 없어 상태만 변경했습니다.";
            case SKIPPED_TEMPLATE_INACTIVE -> "연결된 이메일 템플릿이 비활성 상태여서 상태만 변경했습니다.";
            case SKIPPED_TEMPLATE_INVALID -> "이메일 템플릿을 안전하게 처리할 수 없어 상태만 변경했습니다.";
        };
        return new StatusEmailResult(outcome, safeMessage);
    }
}
