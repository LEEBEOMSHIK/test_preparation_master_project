package com.tpmp.testprep.dto.response;

import java.util.List;

/**
 * 시험 제출·채점 결과 응답 DTO
 */
public record ExaminationSubmitResponse(
        int total,
        int correct,
        int score,
        List<QuestionResultResponse> results,
        Long historyId
) {
    public static ExaminationSubmitResponse of(
            int total,
            int correct,
            int score,
            List<QuestionResultResponse> results,
            Long historyId
    ) {
        return new ExaminationSubmitResponse(total, correct, score, results, historyId);
    }
}
