package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.QuestionBank;
import com.tpmp.testprep.entity.QuizHistory;

import java.time.LocalDateTime;

public record QuizHistoryResponse(
        Long id,
        long no,
        String userName,
        String userEmail,
        String domainName,
        /** 문항 은행 원본 조회 결과 — 문항이 삭제됐으면 null(이력 자체는 보존) */
        String questionContent,
        String questionType,
        String userAnswer,
        boolean correct,
        LocalDateTime createdAt
) {
    public static QuizHistoryResponse from(QuizHistory h, long no, QuestionBank questionBank) {
        return new QuizHistoryResponse(
                h.getId(),
                no,
                h.getUser().getName(),
                h.getUser().getEmail(),
                h.getDomainName(),
                questionBank != null ? questionBank.getContent() : null,
                h.getQuestionType(),
                h.getUserAnswer(),
                h.isCorrect(),
                h.getCreatedAt()
        );
    }
}
