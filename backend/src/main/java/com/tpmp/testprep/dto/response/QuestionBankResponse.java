package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.QuestionBank;

import java.time.LocalDateTime;
import java.util.List;

public record QuestionBankResponse(
        Long id,
        String title,
        Integer examYear,
        Integer examRound,
        String content,
        String questionType,
        Long categoryId,
        String categoryName,
        Long examTypeId,
        String examTypeName,
        List<String> options,
        String answer,
        String code,
        String language,
        String explanation,
        List<String> aiKeywords,
        List<String> aiDomains,
        String aiDifficulty,
        String aiSummary,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static QuestionBankResponse from(QuestionBank qb) {
        return new QuestionBankResponse(
                qb.getId(),
                qb.getTitle(),
                qb.getExamYear(),
                qb.getExamRound(),
                qb.getContent(),
                qb.getQuestionType().name(),
                qb.getCategory() != null ? qb.getCategory().getId() : null,
                qb.getCategory() != null ? qb.getCategory().getName() : null,
                qb.getExamType() != null ? qb.getExamType().getId() : null,
                qb.getExamType() != null ? qb.getExamType().getName() : null,
                qb.getOptions(),
                qb.getAnswer(),
                qb.getCode(),
                qb.getLanguage(),
                qb.getExplanation(),
                qb.getAiKeywords(),
                qb.getAiDomains(),
                qb.getAiDifficulty(),
                qb.getAiSummary(),
                qb.getCreateDt(),
                qb.getModifiedDt()
        );
    }
}
