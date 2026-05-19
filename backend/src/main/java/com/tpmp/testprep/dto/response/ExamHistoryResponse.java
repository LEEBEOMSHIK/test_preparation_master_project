package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.ExamHistory;
import java.time.LocalDateTime;

public record ExamHistoryResponse(
        Long id,
        long no,
        String userName,
        String userEmail,
        String examinationTitle,
        int totalQuestions,
        int correctCount,
        double score,
        LocalDateTime takenAt
) {
    public static ExamHistoryResponse from(ExamHistory h, long no) {
        return new ExamHistoryResponse(
                h.getId(),
                no,
                h.getUser().getName(),
                h.getUser().getEmail(),
                h.getExamination().getTitle(),
                h.getTotalQuestions(),
                h.getCorrectCount(),
                h.getScore(),
                h.getTakenAt()
        );
    }
}
