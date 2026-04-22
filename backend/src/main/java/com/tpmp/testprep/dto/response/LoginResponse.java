package com.tpmp.testprep.dto.response;

public record LoginResponse(
        String accessToken,
        UserResponse user
) {}
