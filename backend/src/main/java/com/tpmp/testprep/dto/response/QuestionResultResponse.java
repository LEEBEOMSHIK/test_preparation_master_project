package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.Question;

import java.util.List;

/**
 * 채점 후 문항별 정오·정답·해설 응답 DTO
 * MVP: 제출 응답에만 포함(영속화 없음, 새로고침 시 재조회 불가)
 */
public record QuestionResultResponse(
        Long questionId,
        int seq,
        String content,
        String questionType,
        List<String> options,
        String userAnswer,
        String correctAnswer,
        boolean correct,
        String explanation
) {
    /**
     * @param q          문항 엔티티
     * @param userAnswer 사용자 제출 답안 (미제출 시 빈 문자열)
     * @param correct    정오 여부
     */
    public static QuestionResultResponse of(Question q, String userAnswer, boolean correct) {
        return new QuestionResultResponse(
                q.getId(),
                q.getSeq(),
                q.getContent(),
                q.getQuestionType().name(),
                q.getOptions(),
                userAnswer,
                q.getAnswer(),
                correct,
                q.getExplanation()
        );
    }
}
