package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.Question;

import java.util.List;

public record ExaminationQuestionView(
        Long id,
        int seq,
        String content,
        String questionType,
        List<String> options,
        String code,
        String language
) {
    public static ExaminationQuestionView from(Question q) {
        return new ExaminationQuestionView(
                q.getId(),
                q.getSeq(),
                q.getContent(),
                q.getQuestionType().name(),
                q.getOptions(),
                q.getCode(),
                q.getLanguage()
        );
    }
}
