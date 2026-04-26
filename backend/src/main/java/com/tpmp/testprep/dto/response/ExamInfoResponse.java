package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.ExamInfo;

import java.time.LocalDateTime;

public record ExamInfoResponse(
        Long id,
        String examType,
        String title,
        String description,
        String applicationPeriod,
        String examSchedule,
        String resultDate,
        String officialUrl,
        boolean isActive,
        int displayOrder,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ExamInfoResponse from(ExamInfo e) {
        return new ExamInfoResponse(
                e.getId(), e.getExamType(), e.getTitle(), e.getDescription(),
                e.getApplicationPeriod(), e.getExamSchedule(), e.getResultDate(),
                e.getOfficialUrl(), e.isActive(), e.getDisplayOrder(),
                e.getCreatedAt(), e.getUpdatedAt()
        );
    }
}
