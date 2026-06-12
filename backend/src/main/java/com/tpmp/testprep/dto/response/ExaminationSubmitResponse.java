package com.tpmp.testprep.dto.response;

import java.util.List;

/**
 * 시험 제출·채점 결과 응답 DTO
 * MVP: 영속화 없음. 새로고침 시 문항별 결과 재조회 불가.
 */
public record ExaminationSubmitResponse(
        int total,
        int correct,
        int score,
        List<QuestionResultResponse> results
) {
    public static ExaminationSubmitResponse of(
            int total,
            int correct,
            int score,
            List<QuestionResultResponse> results
    ) {
        return new ExaminationSubmitResponse(total, correct, score, results);
    }
}
