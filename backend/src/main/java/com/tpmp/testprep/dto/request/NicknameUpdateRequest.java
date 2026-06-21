package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NicknameUpdateRequest(
        @NotBlank(message = "닉네임은 필수입니다.")
        @Size(min = 1, max = 20, message = "닉네임은 1자 이상 20자 이하이어야 합니다.")
        String nickname
) {}
