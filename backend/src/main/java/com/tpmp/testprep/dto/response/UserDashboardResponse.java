package com.tpmp.testprep.dto.response;

import java.util.List;

public record UserDashboardResponse(
        long totalQuestions,
        long totalCorrect,
        double overallCorrectRate,
        List<DomainStatResponse> domainStats,
        List<DomainStatResponse> weakDomains,
        List<DailyStatResponse> dailyTrend,
        long quizTotalQuestions,
        List<QuizDomainStatResponse> quizDomainStats,
        List<QuizDailyStatResponse> quizDailyStats,
        long practiceTotalExecutions,
        long practiceSuccessCount,
        double practiceSuccessRate,
        List<PracticeDailyStatResponse> practiceDailyStats
) {}
