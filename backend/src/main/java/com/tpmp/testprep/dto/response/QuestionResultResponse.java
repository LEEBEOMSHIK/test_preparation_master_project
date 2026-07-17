package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.ExamHistoryDetail;
import com.tpmp.testprep.entity.Question;
import com.tpmp.testprep.entity.support.SchedulingData;
import com.tpmp.testprep.entity.support.SqlData;

import java.util.List;

/**
 * 채점 후 문항별 정오·정답·해설 응답 DTO
 */
public record QuestionResultResponse(
        Long questionId,
        int seq,
        String instruction,
        String title,
        String content,
        String questionType,
        List<String> options,
        String userAnswer,
        String correctAnswer,
        boolean correct,
        String explanation,
        String code,
        String language,
        SchedulingData schedulingData,
        SqlData sqlData
) {
    /**
     * 시험 제출 직후 채점 결과 생성 (Question 엔티티 기반)
     *
     * @param q          문항 엔티티
     * @param userAnswer 사용자 제출 답안 (미제출 시 빈 문자열)
     * @param correct    정오 여부
     */
    public static QuestionResultResponse of(Question q, String userAnswer, boolean correct) {
        return new QuestionResultResponse(
                q.getId(),
                q.getSeq(),
                q.getInstruction(),
                q.getResultTitle(),
                q.getContent(),
                q.getQuestionType().name(),
                q.getOptions(),
                userAnswer,
                q.getAnswer(),
                correct,
                q.getExplanation(),
                q.getCode(),
                q.getLanguage(),
                q.getSchedulingData(),
                q.getSqlData()
        );
    }

    /**
     * 저장된 스냅샷(ExamHistoryDetail) 기반 재조회용 팩토리
     *
     * @param detail 저장된 문항별 이력 스냅샷
     */
    public static QuestionResultResponse of(ExamHistoryDetail detail) {
        return new QuestionResultResponse(
                detail.getQuestionId(),
                detail.getSeq(),
                detail.getInstruction(),
                detail.getTitle(),
                detail.getContent(),
                detail.getQuestionType(),
                detail.getOptions(),
                detail.getUserAnswer(),
                detail.getCorrectAnswer(),
                detail.isCorrect(),
                detail.getExplanation(),
                detail.getCode(),
                detail.getLanguage(),
                detail.getSchedulingData(),
                detail.getSqlData()
        );
    }
}
