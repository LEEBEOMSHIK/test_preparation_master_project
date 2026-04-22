package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.Examination;

import java.time.LocalDateTime;

public record ExaminationResponse(
        Long id,
        String title,
        Long examPaperId,
        String examPaperTitle,
        Long categoryId,
        String categoryName,
        Integer timeLimit,
        LocalDateTime createdAt
) {
    public static ExaminationResponse from(Examination e) {
        return new ExaminationResponse(
                e.getId(),
                e.getTitle(),
                e.getExamPaper().getId(),
                e.getExamPaper().getTitle(),
                e.getCategory().getId(),
                e.getCategory().getName(),
                e.getTimeLimit(),
                e.getCreatedAt()
        );
    }
}
