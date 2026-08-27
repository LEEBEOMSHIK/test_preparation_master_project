package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.Inquiry;
import com.tpmp.testprep.entity.InquiryEmailDelivery;
import com.tpmp.testprep.entity.InquiryNotificationRecipient;
import com.tpmp.testprep.entity.InquiryNotificationSettings;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.event.InquiryEmailQueuedEvent;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.InquiryEmailDeliveryRepository;
import com.tpmp.testprep.repository.InquiryNotificationSettingsRepository;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class InquiryEmailServiceTest {

    @Test
    void queueAdminNotificationCreatesOneDeliveryForEachConfiguredRecipient() {
        InquiryNotificationSettings settings = InquiryNotificationSettings.create(true);
        settings.replaceRecipients(List.of("first@tpmp.com", "second@tpmp.com"));
        InquiryNotificationSettingsRepository settingsRepository = mock(InquiryNotificationSettingsRepository.class);
        InquiryEmailDeliveryRepository deliveryRepository = mock(InquiryEmailDeliveryRepository.class);
        ApplicationEventPublisher publisher = mock(ApplicationEventPublisher.class);
        when(settingsRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(settings));
        when(deliveryRepository.save(any(InquiryEmailDelivery.class))).thenAnswer(invocation -> invocation.getArgument(0));
        InquiryEmailService service = new InquiryEmailService(settingsRepository, deliveryRepository, publisher);

        service.queueAdminNotification(InquiryEmailDelivery.EventType.NEW_INQUIRY, inquiry(), null);

        verify(deliveryRepository, times(2)).save(argThat(delivery ->
                delivery.getEventType() == InquiryEmailDelivery.EventType.NEW_INQUIRY
                        && List.of("first@tpmp.com", "second@tpmp.com").contains(delivery.getRecipientEmail())));
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
