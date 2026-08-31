package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.Inquiry;
import com.tpmp.testprep.entity.InquiryEmailDelivery;
import com.tpmp.testprep.entity.InquiryNotificationSettings;
import com.tpmp.testprep.entity.EmailTemplate;
import com.tpmp.testprep.entity.EmailTemplateBinding;
import com.tpmp.testprep.entity.EmailTemplateEvent;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.dto.response.InquiryStatusEmailOutcome;
import com.tpmp.testprep.dto.response.InquiryEmailDeliveryResponse;
import com.tpmp.testprep.event.InquiryEmailQueuedEvent;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.InquiryEmailDeliveryRepository;
import com.tpmp.testprep.repository.InquiryNotificationSettingsRepository;
import com.tpmp.testprep.repository.EmailTemplateBindingRepository;
import com.tpmp.testprep.service.EmailTemplateRenderer.RenderedEmail;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import org.mockito.ArgumentCaptor;

import static org.assertj.core.api.Assertions.assertThat;

class InquiryEmailServiceTest {

    @Test
    void getDeliveriesDoesNotIgnoreStatusWhenInquiryIdIsProvided() {
        InquiryEmailDeliveryRepository deliveryRepository = mock(InquiryEmailDeliveryRepository.class, invocation -> {
            if (Page.class.isAssignableFrom(invocation.getMethod().getReturnType())) {
                return Page.empty();
            }
            return RETURNS_DEFAULTS.answer(invocation);
        });
        InquiryEmailService service = service(mock(InquiryNotificationSettingsRepository.class), deliveryRepository,
                mock(ApplicationEventPublisher.class));
        Pageable pageable = PageRequest.of(0, 10);

        service.getDeliveries(42L, InquiryEmailDelivery.Status.FAILED, pageable);

        verify(deliveryRepository).findByInquiryIdAndStatusOrderByCreatedAtDesc(
                42L, InquiryEmailDelivery.Status.FAILED, pageable);
        verify(deliveryRepository, never()).findByInquiryIdOrderByCreatedAtDesc(42L, pageable);
        verify(deliveryRepository, never()).findByStatusOrderByCreatedAtDesc(InquiryEmailDelivery.Status.FAILED, pageable);
    }

    @Test
    void queueAdminNotificationCreatesOneDeliveryForEachConfiguredRecipient() {
        InquiryNotificationSettings settings = InquiryNotificationSettings.create(true);
        settings.replaceRecipients(List.of("first@tpmp.com", "second@tpmp.com"));
        InquiryNotificationSettingsRepository settingsRepository = mock(InquiryNotificationSettingsRepository.class);
        InquiryEmailDeliveryRepository deliveryRepository = mock(InquiryEmailDeliveryRepository.class);
        ApplicationEventPublisher publisher = mock(ApplicationEventPublisher.class);
        when(settingsRepository.findById(1L)).thenReturn(Optional.of(settings));
        when(deliveryRepository.save(any(InquiryEmailDelivery.class))).thenAnswer(invocation -> invocation.getArgument(0));
        InquiryEmailService service = service(settingsRepository, deliveryRepository, publisher);

        service.queueAdminNotification(InquiryEmailDelivery.EventType.NEW_INQUIRY, inquiry(), null);

        verify(deliveryRepository, times(2)).save(argThat(delivery ->
                delivery.getEventType() == InquiryEmailDelivery.EventType.NEW_INQUIRY
                        && List.of("first@tpmp.com", "second@tpmp.com").contains(delivery.getRecipientEmail())));
    }

    @Test
    void queueAdminNotificationIncludesCompleteNewInquiryTextAndAdminDetailLink() {
        InquiryNotificationSettings settings = InquiryNotificationSettings.create(true);
        settings.replaceRecipients(List.of("admin@tpmp.com"));
        InquiryNotificationSettingsRepository settingsRepository = mock(InquiryNotificationSettingsRepository.class);
        InquiryEmailDeliveryRepository deliveryRepository = mock(InquiryEmailDeliveryRepository.class);
        when(settingsRepository.findById(1L)).thenReturn(Optional.of(settings));
        when(deliveryRepository.save(any(InquiryEmailDelivery.class))).thenAnswer(invocation -> invocation.getArgument(0));
        Inquiry inquiry = inquiry();
        ReflectionTestUtils.setField(inquiry, "id", 42L);
        InquiryEmailService service = service(settingsRepository, deliveryRepository, mock(ApplicationEventPublisher.class));

        service.queueAdminNotification(InquiryEmailDelivery.EventType.NEW_INQUIRY, inquiry, null);

        ArgumentCaptor<InquiryEmailDelivery> captor = ArgumentCaptor.forClass(InquiryEmailDelivery.class);
        verify(deliveryRepository).save(captor.capture());
        assertThat(captor.getValue().getBody()).isEqualTo("""
                TPMP 문의·요청 알림입니다.

                접수 번호: 42
                접수 유형: GENERAL_INQUIRY
                제목: 문의 제목
                현재 상태: PENDING
                안내 내용:
                문의 본문

                상세 링크: http://localhost:3000/admin/inquiries/42""");
    }

    @Test
    void queueUserNotificationDoesNotCreateDeliveryWhenSendEmailIsFalse() {
        InquiryEmailDeliveryRepository deliveryRepository = mock(InquiryEmailDeliveryRepository.class);
        InquiryEmailService service = service(mock(InquiryNotificationSettingsRepository.class), deliveryRepository,
                mock(ApplicationEventPublisher.class));

        service.queueUserNotification(InquiryEmailDelivery.EventType.ADMIN_MESSAGE, inquiry(), null, false);

        verifyNoInteractions(deliveryRepository);
    }

    @Test
    void queueUserNotificationCreatesDeliveryForInquiryOwnerWhenSendEmailIsTrue() {
        InquiryEmailDeliveryRepository deliveryRepository = mock(InquiryEmailDeliveryRepository.class);
        when(deliveryRepository.save(any(InquiryEmailDelivery.class))).thenAnswer(invocation -> invocation.getArgument(0));
        InquiryEmailService service = service(mock(InquiryNotificationSettingsRepository.class), deliveryRepository,
                mock(ApplicationEventPublisher.class));

        service.queueUserNotification(InquiryEmailDelivery.EventType.ADMIN_MESSAGE, inquiry(), null, true);

        verify(deliveryRepository).save(argThat(delivery -> "user@tpmp.com".equals(delivery.getRecipientEmail())
                && delivery.getEventType() == InquiryEmailDelivery.EventType.ADMIN_MESSAGE));
    }

    @Test
    void queueUserNotificationIncludesCompleteAnswerTextAndUserDetailLink() {
        Inquiry inquiry = inquiry();
        ReflectionTestUtils.setField(inquiry, "id", 42L);
        inquiry.changeStatus(Inquiry.Status.ANSWERED);
        InquiryEmailDeliveryRepository deliveryRepository = mock(InquiryEmailDeliveryRepository.class);
        when(deliveryRepository.save(any(InquiryEmailDelivery.class))).thenAnswer(invocation -> invocation.getArgument(0));
        InquiryEmailService service = service(mock(InquiryNotificationSettingsRepository.class), deliveryRepository,
                mock(ApplicationEventPublisher.class));

        service.queueUserNotification(InquiryEmailDelivery.EventType.ANSWERED, inquiry,
                com.tpmp.testprep.entity.InquiryMessage.builder().inquiry(inquiry).authorRole(
                        com.tpmp.testprep.entity.InquiryMessage.AuthorRole.ADMIN).content("답변 내용").build(), true);

        ArgumentCaptor<InquiryEmailDelivery> captor = ArgumentCaptor.forClass(InquiryEmailDelivery.class);
        verify(deliveryRepository).save(captor.capture());
        assertThat(captor.getValue().getBody()).isEqualTo("""
                TPMP 문의·요청 알림입니다.

                접수 번호: 42
                접수 유형: GENERAL_INQUIRY
                제목: 문의 제목
                현재 상태: ANSWERED
                안내 내용:
                답변 내용

                상세 링크: http://localhost:3000/user/inquiries/42""");
    }

    @Test
    void retryRejectsDeliveryThatIsNotFailed() {
        InquiryEmailDeliveryRepository deliveryRepository = mock(InquiryEmailDeliveryRepository.class);
        when(deliveryRepository.claimFailedForRetry(7L)).thenReturn(0);
        InquiryEmailService service = service(mock(InquiryNotificationSettingsRepository.class), deliveryRepository,
                mock(ApplicationEventPublisher.class));

        assertThatThrownBy(() -> service.retry(7L))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).getErrorCode())
                .isEqualTo(ErrorCode.INQUIRY_EMAIL_RETRY_NOT_ALLOWED);
    }

    @Test
    void retryClaimsOnlyFailedDeliveryAndQueuesItAgain() {
        InquiryEmailDeliveryRepository deliveryRepository = mock(InquiryEmailDeliveryRepository.class);
        ApplicationEventPublisher publisher = mock(ApplicationEventPublisher.class);
        when(deliveryRepository.claimFailedForRetry(7L)).thenReturn(1);
        InquiryEmailService service = service(mock(InquiryNotificationSettingsRepository.class), deliveryRepository, publisher);

        service.retry(7L);

        verify(publisher).publishEvent(new InquiryEmailQueuedEvent(7L));
    }

    @Test
    void missingBindingSkipsEmailWithoutThrowing() {
        EmailTemplateBindingRepository bindingRepository = mock(EmailTemplateBindingRepository.class);
        InquiryEmailDeliveryRepository deliveryRepository = mock(InquiryEmailDeliveryRepository.class);
        when(bindingRepository.findByEventCode(EmailTemplateEvent.INQUIRY_COMPLETED))
                .thenReturn(Optional.empty());
        InquiryEmailService service = statusService(bindingRepository, deliveryRepository,
                mock(EmailTemplateRenderer.class));

        InquiryEmailService.StatusEmailResult result = service.queueStatusNotification(completedInquiry(), true);

        assertThat(result.outcome()).isEqualTo(InquiryStatusEmailOutcome.SKIPPED_TEMPLATE_MISSING);
        assertThat(result.safeMessage()).isEqualTo("연결된 이메일 템플릿이 없어 상태만 변경했습니다.");
        verify(deliveryRepository, never()).save(any());
    }

    @Test
    void inactiveTemplateSkipsEmailWithoutRendering() {
        EmailTemplateBindingRepository bindingRepository = mock(EmailTemplateBindingRepository.class);
        InquiryEmailDeliveryRepository deliveryRepository = mock(InquiryEmailDeliveryRepository.class);
        EmailTemplateRenderer renderer = mock(EmailTemplateRenderer.class);
        EmailTemplate inactive = template(false);
        when(bindingRepository.findByEventCode(EmailTemplateEvent.INQUIRY_COMPLETED))
                .thenReturn(Optional.of(EmailTemplateBinding.create(
                        EmailTemplateEvent.INQUIRY_COMPLETED, inactive, null)));
        InquiryEmailService service = statusService(bindingRepository, deliveryRepository, renderer);

        InquiryEmailService.StatusEmailResult result = service.queueStatusNotification(completedInquiry(), true);

        assertThat(result.outcome()).isEqualTo(InquiryStatusEmailOutcome.SKIPPED_TEMPLATE_INACTIVE);
        assertThat(result.safeMessage()).isEqualTo("연결된 이메일 템플릿이 비활성 상태여서 상태만 변경했습니다.");
        verifyNoInteractions(renderer);
        verify(deliveryRepository, never()).save(any());
    }

    @Test
    void activeTemplateQueuesImmutableHtmlSnapshotWithAllInquiryVariables() {
        EmailTemplateBindingRepository bindingRepository = mock(EmailTemplateBindingRepository.class);
        InquiryEmailDeliveryRepository deliveryRepository = mock(InquiryEmailDeliveryRepository.class);
        EmailTemplateRenderer renderer = mock(EmailTemplateRenderer.class);
        EmailTemplate active = template(true);
        when(bindingRepository.findByEventCode(EmailTemplateEvent.INQUIRY_COMPLETED))
                .thenReturn(Optional.of(EmailTemplateBinding.create(
                        EmailTemplateEvent.INQUIRY_COMPLETED, active, null)));
        when(renderer.render(eq(EmailTemplate.Scope.INQUIRY_STATUS), anyString(), anyString(), anyMap()))
                .thenReturn(new RenderedEmail("완료", "<p>완료</p>", "완료"));
        when(deliveryRepository.save(any(InquiryEmailDelivery.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        Inquiry inquiry = completedInquiry();
        inquiry.getUser().updateNickname("별칭");
        InquiryEmailService service = statusService(bindingRepository, deliveryRepository, renderer);
        ReflectionTestUtils.setField(service, "publicUrl", "https://tpmp.test///");

        InquiryEmailService.StatusEmailResult result = service.queueStatusNotification(inquiry, true);

        assertThat(result.outcome()).isEqualTo(InquiryStatusEmailOutcome.QUEUED);
        assertThat(result.safeMessage()).isEqualTo("상태 변경 안내 이메일을 발송 대기열에 등록했습니다.");
        verify(renderer).render(
                EmailTemplate.Scope.INQUIRY_STATUS,
                "{{inquiryTitle}} 완료",
                "<p>{{recipientName}}</p>",
                Map.of(
                        "recipientName", "별칭",
                        "inquiryId", "42",
                        "inquiryTitle", "문의 제목",
                        "inquiryType", "신규 기능 요청",
                        "statusLabel", "처리 완료",
                        "inquiryDetailUrl", "https://tpmp.test/user/inquiries/42",
                        "serviceName", "TPMP"));
        verify(deliveryRepository).save(argThat(delivery ->
                "완료".equals(delivery.getSubject())
                        && "완료".equals(delivery.getBody())
                        && "<p>완료</p>".equals(delivery.getHtmlBody())
                        && delivery.getInquiryMessage() == null
                        && delivery.getEventType() == InquiryEmailDelivery.EventType.COMPLETED));
    }

    @Test
    void corruptedTemplateReturnsInvalidAndKeepsCallerFlow() {
        EmailTemplateBindingRepository bindingRepository = mock(EmailTemplateBindingRepository.class);
        InquiryEmailDeliveryRepository deliveryRepository = mock(InquiryEmailDeliveryRepository.class);
        EmailTemplateRenderer renderer = mock(EmailTemplateRenderer.class);
        when(bindingRepository.findByEventCode(EmailTemplateEvent.INQUIRY_COMPLETED))
                .thenReturn(Optional.of(EmailTemplateBinding.create(
                        EmailTemplateEvent.INQUIRY_COMPLETED, template(true), null)));
        when(renderer.render(any(), anyString(), anyString(), anyMap()))
                .thenThrow(new EmailTemplateRenderingException(
                        EmailTemplateRenderingException.Reason.INVALID_CONTENT, "렌더링 실패"));
        InquiryEmailService service = statusService(bindingRepository, deliveryRepository, renderer);

        InquiryEmailService.StatusEmailResult result = service.queueStatusNotification(completedInquiry(), true);

        assertThat(result.outcome()).isEqualTo(InquiryStatusEmailOutcome.SKIPPED_TEMPLATE_INVALID);
        assertThat(result.safeMessage()).isEqualTo("이메일 템플릿을 안전하게 처리할 수 없어 상태만 변경했습니다.");
        verify(deliveryRepository, never()).save(any());
    }

    @Test
    void activeTemplateUsesNameWhenNicknameIsMissing() {
        EmailTemplateBindingRepository bindingRepository = mock(EmailTemplateBindingRepository.class);
        InquiryEmailDeliveryRepository deliveryRepository = mock(InquiryEmailDeliveryRepository.class);
        EmailTemplateRenderer renderer = mock(EmailTemplateRenderer.class);
        when(bindingRepository.findByEventCode(EmailTemplateEvent.INQUIRY_COMPLETED))
                .thenReturn(Optional.of(EmailTemplateBinding.create(
                        EmailTemplateEvent.INQUIRY_COMPLETED, template(true), null)));
        when(renderer.render(any(), anyString(), anyString(), anyMap()))
                .thenReturn(new RenderedEmail("완료", "<p>완료</p>", "완료"));
        when(deliveryRepository.save(any(InquiryEmailDelivery.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        InquiryEmailService service = statusService(bindingRepository, deliveryRepository, renderer);

        InquiryEmailService.StatusEmailResult result = service.queueStatusNotification(completedInquiry(), true);

        assertThat(result.outcome()).isEqualTo(InquiryStatusEmailOutcome.QUEUED);
        verify(renderer).render(any(), anyString(), anyString(),
                argThat(variables -> "사용자".equals(variables.get("recipientName"))));
    }

    @Test
    void openStatusOrDisabledEmailIsNotRequested() {
        EmailTemplateBindingRepository bindingRepository = mock(EmailTemplateBindingRepository.class);
        InquiryEmailDeliveryRepository deliveryRepository = mock(InquiryEmailDeliveryRepository.class);
        InquiryEmailService service = statusService(bindingRepository, deliveryRepository,
                mock(EmailTemplateRenderer.class));

        InquiryEmailService.StatusEmailResult openResult = service.queueStatusNotification(inquiry(), true);
        InquiryEmailService.StatusEmailResult disabledResult = service.queueStatusNotification(completedInquiry(), false);

        assertThat(openResult.outcome()).isEqualTo(InquiryStatusEmailOutcome.NOT_REQUESTED);
        assertThat(disabledResult.outcome()).isEqualTo(InquiryStatusEmailOutcome.NOT_REQUESTED);
        assertThat(openResult.safeMessage()).isEqualTo("상태만 변경했습니다.");
        verifyNoInteractions(bindingRepository, deliveryRepository);
    }

    @Test
    void deliveryResponseExposesHtmlFlagWithoutBodies() {
        Inquiry inquiry = completedInquiry();
        InquiryEmailDelivery delivery = InquiryEmailDelivery.pending(
                inquiry, null, InquiryEmailDelivery.EventType.COMPLETED, "user@tpmp.com",
                "제목", "텍스트", "<p>HTML</p>");

        InquiryEmailDeliveryResponse response = InquiryEmailDeliveryResponse.from(delivery);

        assertThat(response.htmlContent()).isTrue();
    }

    private InquiryEmailService service(InquiryNotificationSettingsRepository settingsRepository,
                                        InquiryEmailDeliveryRepository deliveryRepository,
                                        ApplicationEventPublisher publisher) {
        return new InquiryEmailService(settingsRepository, deliveryRepository, publisher,
                mock(EmailTemplateBindingRepository.class), mock(EmailTemplateRenderer.class));
    }

    private InquiryEmailService statusService(EmailTemplateBindingRepository bindingRepository,
                                              InquiryEmailDeliveryRepository deliveryRepository,
                                              EmailTemplateRenderer renderer) {
        return new InquiryEmailService(mock(InquiryNotificationSettingsRepository.class), deliveryRepository,
                mock(ApplicationEventPublisher.class), bindingRepository, renderer);
    }

    private EmailTemplate template(boolean active) {
        return EmailTemplate.create("상태 템플릿", EmailTemplate.Scope.INQUIRY_STATUS,
                "{{inquiryTitle}} 완료", "<p>{{recipientName}}</p>", "기존 텍스트", active, null, null);
    }

    private Inquiry completedInquiry() {
        Inquiry inquiry = Inquiry.builder().user(User.builder().email("user@tpmp.com").password("pw").name("사용자")
                        .role(User.Role.USER).build()).title("문의 제목").content("문의 본문")
                .requestType(Inquiry.RequestType.FEATURE_REQUEST).build();
        ReflectionTestUtils.setField(inquiry, "id", 42L);
        inquiry.changeStatus(Inquiry.Status.COMPLETED);
        return inquiry;
    }

    private Inquiry inquiry() {
        return Inquiry.builder().user(User.builder().email("user@tpmp.com").password("pw").name("사용자")
                .role(User.Role.USER).build()).title("문의 제목").content("문의 본문")
                .requestType(Inquiry.RequestType.GENERAL_INQUIRY).build();
    }
}
