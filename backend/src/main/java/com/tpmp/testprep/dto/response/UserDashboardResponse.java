package com.tpmp.testprep.dto.response;

import java.util.List;

public record UserDashboardResponse(
        long totalQuestions,
        long totalCorrect,
        double overallCorrectRate,
        List<DomainStatResponse> domainStats,
        List<DomainStatResponse> weakDomains,
        List<DailyStatResponse> dailyTrend
) {}
