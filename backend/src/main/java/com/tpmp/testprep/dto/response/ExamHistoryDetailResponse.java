package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.ExamHistory;
import com.tpmp.testprep.entity.ExamHistoryDetail;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 시험 결과 문항별 상세 재조회 응답 DTO
 * - 최신 응시 이력(ExamHistory) + 저장된 문항별 스냅샷(ExamHistoryDetail)을 합산
 */
public record ExamHistoryDetailResponse(
        Long historyId,
        int total,
        int correct,
        int score,
        LocalDateTime takenAt,
        List<QuestionResultResponse> results,
        long attemptCount
) {
    /** 단일 이력 조회용 — 응시 횟수 불필요한 경우(회차 결과 재조회) */
    public static ExamHistoryDetailResponse of(ExamHistory history, List<ExamHistoryDetail> details) {
        return of(history, details, 1L);
    }

    /** 응시 횟수를 포함한 생성 */
    public static ExamHistoryDetailResponse of(ExamHistory history, List<ExamHistoryDetail> details, long attemptCount) {
        List<QuestionResultResponse> results = details.stream()
                .map(QuestionResultResponse::of)
                .toList();
        return new ExamHistoryDetailResponse(
                history.getId(),
                history.getTotalQuestions(),
                history.getCorrectCount(),
                (int) Math.round(history.getScore()),
                history.getTakenAt(),
                results,
                attemptCount
        );
    }
}
