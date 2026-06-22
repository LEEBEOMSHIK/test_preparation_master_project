package com.tpmp.testprep.dto.response;

public record QuizDailyStatResponse(
        String date,
        long totalQuestions
) {}
