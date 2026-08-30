package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.Inquiry;
import com.tpmp.testprep.entity.InquiryEmailDelivery;
import com.tpmp.testprep.entity.InquiryNotificationSettings;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.event.InquiryEmailQueuedEvent;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.InquiryEmailDeliveryRepository;
import com.tpmp.testprep.repository.InquiryNotificationSettingsRepository;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import org.mockito.ArgumentCaptor;

import static org.assertj.core.api.Assertions.assertThat;

class InquiryEmailServiceTest {

    @Test
    void queueAdminNotificationCreatesOneDeliveryForEachConfiguredRecipient() {
        InquiryNotificationSettings settings = InquiryNotificationSettings.create(true);
        settings.replaceRecipients(List.of("first@tpmp.com", "second@tpmp.com"));
        InquiryNotificationSettingsRepository settingsRepository = mock(InquiryNotificationSettingsRepository.class);
        InquiryEmailDeliveryRepository deliveryRepository = mock(InquiryEmailDeliveryRepository.class);
        ApplicationEventPublisher publisher = mock(ApplicationEventPublisher.class);
        when(settingsRepository.findById(1L)).thenReturn(Optional.of(settings));
        when(deliveryRepository.save(any(InquiryEmailDelivery.class))).thenAnswer(invocation -> invocation.getArgument(0));
        InquiryEmailService service = new InquiryEmailService(settingsRepository, deliveryRepository, publisher);

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
        InquiryEmailService service = new InquiryEmailService(settingsRepository, deliveryRepository, mock(ApplicationEventPublisher.class));

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
        InquiryEmailService service = new InquiryEmailService(mock(InquiryNotificationSettingsRepository.class), deliveryRepository,
                mock(ApplicationEventPublisher.class));

        service.queueUserNotification(InquiryEmailDelivery.EventType.ADMIN_MESSAGE, inquiry(), null, false);

        verifyNoInteractions(deliveryRepository);
    }

    @Test
    void queueUserNotificationCreatesDeliveryForInquiryOwnerWhenSendEmailIsTrue() {
        InquiryEmailDeliveryRepository deliveryRepository = mock(InquiryEmailDeliveryRepository.class);
        when(deliveryRepository.save(any(InquiryEmailDelivery.class))).thenAnswer(invocation -> invocation.getArgument(0));
        InquiryEmailService service = new InquiryEmailService(mock(InquiryNotificationSettingsRepository.class), deliveryRepository,
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
        InquiryEmailService service = new InquiryEmailService(mock(InquiryNotificationSettingsRepository.class), deliveryRepository,
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
        InquiryEmailService service = new InquiryEmailService(mock(InquiryNotificationSettingsRepository.class), deliveryRepository,
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
        InquiryEmailService service = new InquiryEmailService(mock(InquiryNotificationSettingsRepository.class), deliveryRepository, publisher);

        service.retry(7L);

        verify(publisher).publishEvent(new InquiryEmailQueuedEvent(7L));
    }

    private Inquiry inquiry() {
        return Inquiry.builder().user(User.builder().email("user@tpmp.com").password("pw").name("사용자")
                .role(User.Role.USER).build()).title("문의 제목").content("문의 본문")
                .requestType(Inquiry.RequestType.GENERAL_INQUIRY).build();
    }
}
