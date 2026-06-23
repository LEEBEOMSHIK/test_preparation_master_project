package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.ExamSession;

import java.time.LocalDateTime;

/**
 * 시험 응시 세션 시작/재개 응답.
 * remainingSeconds 는 서버에서 계산한 남은 시간(초)으로 0 이하이면 즉시 자동제출 대상.
 */
public record ExamSessionResponse(
        Long examinationId,
        LocalDateTime startedAt,
        int remainingSeconds
) {
    public static ExamSessionResponse of(ExamSession session, int remainingSeconds) {
        return new ExamSessionResponse(
                session.getExamination().getId(),
                session.getStartedAt(),
                remainingSeconds
        );
    }
}
