package com.tpmp.testprep.dto.response;

import java.util.List;

public record DashboardTrendResponse(
        List<DayCount> loginTrend,
        List<DayCount> examTrend,
        List<DayCount> inquiryTrend,
        List<DayCount> quizTrend
) {
    public record DayCount(String date, long count) {}
}
