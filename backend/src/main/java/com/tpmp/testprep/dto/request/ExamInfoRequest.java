package com.tpmp.testprep.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ExamInfoRequest(
        @NotBlank @Size(max = 100) String examType,
        @NotBlank @Size(max = 200) String title,
        String description,
        @Size(max = 300) String applicationPeriod,
        @Size(max = 300) String examSchedule,
        @Size(max = 300) String resultDate,
        @Size(max = 500) String officialUrl,
        boolean isActive,
        int displayOrder
) {}
