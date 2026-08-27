package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.InquiryNotificationSettingsRequest;
import com.tpmp.testprep.dto.response.InquiryNotificationSettingsResponse;
import com.tpmp.testprep.entity.InquiryNotificationSettings;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.InquiryNotificationRecipientRepository;
import com.tpmp.testprep.repository.InquiryNotificationSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InquiryNotificationSettingsService {
    private static final int MAX_RECIPIENTS = 10;
    private static final long SETTINGS_ID = InquiryNotificationSettings.SINGLETON_ID;

    private final InquiryNotificationSettingsRepository settingsRepository;
    @SuppressWarnings("unused")
    private final InquiryNotificationRecipientRepository recipientRepository;

    public InquiryNotificationSettingsResponse get() {
        return settingsRepository.findById(SETTINGS_ID).map(InquiryNotificationSettingsResponse::from)
                .orElseGet(() -> new InquiryNotificationSettingsResponse(false, List.of()));
    }

    @Transactional
    public InquiryNotificationSettingsResponse update(InquiryNotificationSettingsRequest request) {
        List<String> emails = normalizeEmails(request.recipientEmails());
        if (request.enabled() && emails.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INQUIRY_NOTIFICATION_SETTINGS);
        }
        settingsRepository.upsertSingleton(request.enabled());
        InquiryNotificationSettings settings = settingsRepository.findById(SETTINGS_ID)
                .orElseThrow(() -> new IllegalStateException("관리자 알림 설정을 초기화할 수 없습니다."));
        settings.update(request.enabled());
        settings.replaceRecipients(emails);
        return InquiryNotificationSettingsResponse.from(settingsRepository.save(settings));
    }

    private List<String> normalizeEmails(List<String> recipientEmails) {
        if (recipientEmails == null) {
            throw new BusinessException(ErrorCode.INVALID_INQUIRY_NOTIFICATION_SETTINGS);
        }
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        for (String email : recipientEmails) {
            if (email == null || email.isBlank()) {
                throw new BusinessException(ErrorCode.INVALID_INQUIRY_NOTIFICATION_SETTINGS);
            }
            String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
            if (!normalizedEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                throw new BusinessException(ErrorCode.INVALID_INQUIRY_NOTIFICATION_SETTINGS);
            }
            normalized.add(normalizedEmail);
        }
        if (normalized.size() > MAX_RECIPIENTS) {
            throw new BusinessException(ErrorCode.INVALID_INQUIRY_NOTIFICATION_SETTINGS);
        }
        return List.copyOf(normalized);
    }
}
