package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UserExaminationSearchRequest(
        @Size(max = 200) String title,
        @Size(max = 100) String category,
        @Size(max = 50) List<@NotBlank @Size(max = 100) String> interests,
        @Positive Integer year,
        @Positive Integer round,
        Boolean aiCustom
) {
    public UserExaminationSearchRequest {
        interests = interests == null ? List.of() : List.copyOf(interests);
    }

    public static UserExaminationSearchRequest empty() {
        return new UserExaminationSearchRequest(null, null, List.of(), null, null, null);
    }
}
