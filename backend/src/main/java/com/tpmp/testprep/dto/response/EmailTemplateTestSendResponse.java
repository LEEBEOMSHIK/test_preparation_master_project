package com.tpmp.testprep.dto.response;

import java.time.LocalDateTime;

public record EmailTemplateTestSendResponse(String recipientMasked, LocalDateTime sentAt) {
}
