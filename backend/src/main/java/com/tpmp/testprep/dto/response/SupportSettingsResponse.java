package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.SupportSettings;

public record SupportSettingsResponse(
        String tossUrl,
        String kakaopayUrl,
        String kakaoGiftUrl
) {
    public static SupportSettingsResponse from(SupportSettings s) {
        return new SupportSettingsResponse(s.getTossUrl(), s.getKakaopayUrl(), s.getKakaoGiftUrl());
    }

    public static SupportSettingsResponse empty() {
        return new SupportSettingsResponse(null, null, null);
    }
}
