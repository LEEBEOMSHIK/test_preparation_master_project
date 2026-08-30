package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record InquiryNotificationSettingsRequest(boolean enabled, @NotNull List<String> recipientEmails) {
}
