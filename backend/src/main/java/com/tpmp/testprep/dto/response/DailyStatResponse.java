package com.tpmp.testprep.dto.response;

public record DailyStatResponse(
        String date,
        long totalQuestions,
        long correctCount,
        double correctRate
) {}
