package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.Question;
import com.tpmp.testprep.entity.support.SchedulingData;
import com.tpmp.testprep.entity.support.SqlData;

import java.util.List;

public record ExaminationQuestionView(
        Long id,
        int seq,
        String instruction,
        String content,
        String questionType,
        List<String> options,
        String code,
        String language,
        SchedulingData schedulingData,
        SqlData sqlData,
        List<String> sqlResultColumns
) {
    public static ExaminationQuestionView from(Question q) {
        SqlData sqlData = q.getSqlData();
        SqlData.SqlExpectedResult expectedResult = sqlData != null ? sqlData.expectedResult() : null;
        return new ExaminationQuestionView(
                q.getId(),
                q.getSeq(),
                q.getInstruction(),
                q.getContent(),
                q.getQuestionType().name(),
                q.getOptions(),
                q.getCode(),
                q.getLanguage(),
                q.getSchedulingData(),
                sqlData != null ? sqlData.withoutExpectedResult() : null,
                expectedResult != null ? expectedResult.columns() : null
        );
    }
}
