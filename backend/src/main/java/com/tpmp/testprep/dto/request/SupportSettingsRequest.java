package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.Size;

public record SupportSettingsRequest(
        @Size(max = 500) String tossUrl,
        @Size(max = 500) String kakaopayUrl,
        @Size(max = 500) String kakaoGiftUrl
) {}
