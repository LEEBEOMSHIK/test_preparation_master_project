package com.tpmp.testprep.dto.response;

public record DashboardStatsResponse(
        long todayLoginCount,
        long todayInquiryCount,
        long pendingInquiryCount,
        long totalExamCount,
        long totalMemberCount
) {}
