package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.ExamInfo;
import com.tpmp.testprep.entity.UserExamApplication;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record UserExamApplicationResponse(
        Long id,
        Long examInfoId,
        String examInfoTitle,   // 연결된 ExamInfo의 현재 title (nullable)
        String examType,        // 연결된 ExamInfo의 examType (nullable)
        String examName,        // 저장 시점 스냅샷
        LocalDate applicationDate,
        LocalDate examDate,
        String memo,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static UserExamApplicationResponse from(UserExamApplication a) {
        ExamInfo info = a.getExamInfo();
        return new UserExamApplicationResponse(
                a.getId(),
                info != null ? info.getId() : null,
                info != null ? info.getTitle() : null,
                info != null ? info.getExamType() : null,
                a.getExamName(),
                a.getApplicationDate(),
                a.getExamDate(),
                a.getMemo(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
