package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.QuestionBank;

import java.util.List;

public record QuizQuestionView(
        Long id,
        String title,
        String content,
        String questionType,
        List<String> options,
        String code,
        String language,
        Integer examYear,
        Integer examRound) {

    public static QuizQuestionView from(QuestionBank qb) {
        return new QuizQuestionView(
                qb.getId(),
                qb.getTitle(),
                qb.getContent(),
                qb.getQuestionType().name(),
                qb.getOptions(),
                qb.getCode(),
                qb.getLanguage(),
                qb.getExamYear(),
                qb.getExamRound());
    }
}
