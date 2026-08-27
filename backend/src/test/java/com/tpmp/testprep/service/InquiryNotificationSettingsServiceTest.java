package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.InquiryNotificationSettingsRequest;
import com.tpmp.testprep.entity.InquiryNotificationRecipient;
import com.tpmp.testprep.entity.InquiryNotificationSettings;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.InquiryNotificationRecipientRepository;
import com.tpmp.testprep.repository.InquiryNotificationSettingsRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class InquiryNotificationSettingsServiceTest {

    @Test
    void updateNormalizesAndDeduplicatesRecipientEmails() {
        InquiryNotificationSettingsRepository settingsRepository = mock(InquiryNotificationSettingsRepository.class);
        InquiryNotificationRecipientRepository recipientRepository = mock(InquiryNotificationRecipientRepository.class);
        InquiryNotificationSettings settings = InquiryNotificationSettings.create(false);
        when(settingsRepository.findById(1L)).thenReturn(Optional.of(settings));
        when(settingsRepository.save(any(InquiryNotificationSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));
        InquiryNotificationSettingsService service = new InquiryNotificationSettingsService(settingsRepository, recipientRepository);

        var response = service.update(new InquiryNotificationSettingsRequest(true,
                List.of(" Admin@TPMP.com ", "admin@tpmp.com", "second@tpmp.com ")));

        assertThat(response.enabled()).isTrue();
        assertThat(response.recipientEmails()).containsExactly("admin@tpmp.com", "second@tpmp.com");
    }

    @Test
    void getReadsOnlyTheFixedGlobalSettingsId() {
        InquiryNotificationSettingsRepository settingsRepository = mock(InquiryNotificationSettingsRepository.class);
        InquiryNotificationSettings settings = InquiryNotificationSettings.create(true);
        settings.replaceRecipients(List.of("only@tpmp.com"));
        when(settingsRepository.findById(1L)).thenReturn(Optional.of(settings));
        InquiryNotificationSettingsService service = new InquiryNotificationSettingsService(settingsRepository,
                mock(InquiryNotificationRecipientRepository.class));

        var response = service.get();

        assertThat(response.enabled()).isTrue();
        assertThat(response.recipientEmails()).containsExactly("only@tpmp.com");
    }

    @Test
    void updateUsesSingletonUpsertBeforeReplacingRecipients() {
        InquiryNotificationSettingsRepository settingsRepository = mock(InquiryNotificationSettingsRepository.class);
        InquiryNotificationSettings settings = InquiryNotificationSettings.create(false);
        when(settingsRepository.findById(1L)).thenReturn(Optional.of(settings));
        when(settingsRepository.save(any(InquiryNotificationSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));
        InquiryNotificationSettingsService service = new InquiryNotificationSettingsService(settingsRepository,
                mock(InquiryNotificationRecipientRepository.class));

        service.update(new InquiryNotificationSettingsRequest(true, List.of("only@tpmp.com")));

        verify(settingsRepository).upsertSingleton(true);
    }

    @Test
    void updateRejectsEnabledSettingsWithoutRecipients() {
        InquiryNotificationSettingsService service = new InquiryNotificationSettingsService(
                mock(InquiryNotificationSettingsRepository.class), mock(InquiryNotificationRecipientRepository.class));

        assertThatThrownBy(() -> service.update(new InquiryNotificationSettingsRequest(true, List.of())))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_INQUIRY_NOTIFICATION_SETTINGS);
    }

    @Test
    void updateRejectsMoreThanTenDistinctRecipients() {
        InquiryNotificationSettingsService service = new InquiryNotificationSettingsService(
                mock(InquiryNotificationSettingsRepository.class), mock(InquiryNotificationRecipientRepository.class));

        assertThatThrownBy(() -> service.update(new InquiryNotificationSettingsRequest(false, List.of(
                "one@tpmp.com", "two@tpmp.com", "three@tpmp.com", "four@tpmp.com", "five@tpmp.com",
                "six@tpmp.com", "seven@tpmp.com", "eight@tpmp.com", "nine@tpmp.com", "ten@tpmp.com", "eleven@tpmp.com"))))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_INQUIRY_NOTIFICATION_SETTINGS);
    }
}
