package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.Question;
import com.tpmp.testprep.entity.support.SchedulingData;
import com.tpmp.testprep.entity.support.SqlData;

import java.util.List;

public record QuestionDetailResponse(
        Long id,
        Integer seq,
        Long sourceQuestionBankId,
        String instruction,
        String content,
        String questionType,
        List<String> options,
        String answer,
        String explanation,
        String code,
        String language,
        Long categoryId,
        String categoryName,
        SchedulingData schedulingData,
        SqlData sqlData
) {
    public static QuestionDetailResponse from(Question q) {
        return new QuestionDetailResponse(
                q.getId(),
                q.getSeq(),
                q.getSourceQuestionBank() != null ? q.getSourceQuestionBank().getId() : null,
                q.getInstruction(),
                q.getContent(),
                q.getQuestionType().name(),
                q.getOptions(),
                q.getAnswer(),
                q.getExplanation(),
                q.getCode(),
                q.getLanguage(),
                q.getCategory() != null ? q.getCategory().getId() : null,
                q.getCategory() != null ? q.getCategory().getName() : null,
                q.getSchedulingData(),
                q.getSqlData()
        );
    }
}
