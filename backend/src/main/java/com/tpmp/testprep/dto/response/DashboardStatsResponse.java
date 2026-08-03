package com.tpmp.testprep.dto.response;

public record DashboardStatsResponse(
        long todayLoginCount,
        long todayInquiryCount,
        long pendingInquiryCount,
        long pendingBugCount,
        long totalExamCount,
        long totalMemberCount,
        long todayExamAttemptCount
) {}
