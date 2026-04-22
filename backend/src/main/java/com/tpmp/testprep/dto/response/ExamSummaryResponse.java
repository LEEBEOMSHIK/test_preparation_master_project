package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.Exam;

import java.time.LocalDateTime;

public record ExamSummaryResponse(
        Long id,
        String title,
        Integer orderNo,
        String questionMode,
        int questionCount,
        LocalDateTime createdAt
) {
    public static ExamSummaryResponse from(Exam exam) {
        return new ExamSummaryResponse(
                exam.getId(),
                exam.getTitle(),
                exam.getOrderNo(),
                exam.getQuestionMode().name(),
                exam.getQuestions().size(),
                exam.getCreatedAt()
        );
    }

    public static ExamSummaryResponse from(Exam exam, int questionCount) {
        return new ExamSummaryResponse(
                exam.getId(),
                exam.getTitle(),
                exam.getOrderNo(),
                exam.getQuestionMode().name(),
                questionCount,
                exam.getCreatedAt()
        );
    }
}
