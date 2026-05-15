package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.LoginHistory;

import java.time.LocalDateTime;

public record LoginHistoryResponse(
        Long id,
        long no,
        String memberName,
        String email,
        String ipAddress,
        String userAgent,
        LocalDateTime loginAt
) {
    public static LoginHistoryResponse from(LoginHistory h, long no) {
        return new LoginHistoryResponse(
                h.getId(), no, h.getMemberName(), h.getEmail(),
                h.getIpAddress(), h.getUserAgent(), h.getLoginAt()
        );
    }
}
