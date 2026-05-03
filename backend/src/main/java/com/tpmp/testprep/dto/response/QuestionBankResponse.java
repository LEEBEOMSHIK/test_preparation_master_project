package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.QuestionBank;

import java.time.LocalDateTime;
import java.util.List;

public record QuestionBankResponse(
        Long id,
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
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static QuestionBankResponse from(QuestionBank qb) {
        return new QuestionBankResponse(
                qb.getId(),
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
                qb.getCreateDt(),
                qb.getModifiedDt()
        );
    }
}
