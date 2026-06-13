package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.ExamHistory;

import java.time.LocalDateTime;

/**
 * 사용자 시험 이력 목록 응답 DTO
 * - 본인 화면이므로 userName/userEmail 미노출
 */
public record UserExamHistoryResponse(
        Long id,
        String examinationTitle,
        int totalQuestions,
        int correctCount,
        int score,
        LocalDateTime takenAt
) {
    public static UserExamHistoryResponse from(ExamHistory h) {
        return new UserExamHistoryResponse(
                h.getId(),
                h.getExamination().getTitle(),
                h.getTotalQuestions(),
                h.getCorrectCount(),
                (int) Math.round(h.getScore()),
                h.getTakenAt()
        );
    }
}
