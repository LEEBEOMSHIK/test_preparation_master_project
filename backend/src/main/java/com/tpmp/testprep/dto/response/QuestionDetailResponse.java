package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.Question;

import java.util.List;

public record QuestionDetailResponse(
        Long id,
        Integer seq,
        String content,
        String questionType,
        List<String> options,
        String answer,
        String explanation,
        String code,
        String language,
        Long categoryId,
        String categoryName
) {
    public static QuestionDetailResponse from(Question q) {
        return new QuestionDetailResponse(
                q.getId(),
                q.getSeq(),
                q.getContent(),
                q.getQuestionType().name(),
                q.getOptions(),
                q.getAnswer(),
                q.getExplanation(),
                q.getCode(),
                q.getLanguage(),
                q.getCategory() != null ? q.getCategory().getId() : null,
                q.getCategory() != null ? q.getCategory().getName() : null
        );
    }
}
