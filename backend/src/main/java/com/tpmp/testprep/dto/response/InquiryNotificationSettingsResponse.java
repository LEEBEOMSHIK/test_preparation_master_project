package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.InquiryNotificationSettings;

import java.util.List;

public record InquiryNotificationSettingsResponse(boolean enabled, List<String> recipientEmails) {
    public static InquiryNotificationSettingsResponse from(InquiryNotificationSettings settings) {
        return new InquiryNotificationSettingsResponse(settings.isEnabled(),
                settings.getRecipients().stream().map(recipient -> recipient.getEmail()).toList());
    }
}
