package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.DashboardStatsResponse;
import com.tpmp.testprep.dto.response.DashboardTrendResponse;
import com.tpmp.testprep.entity.Inquiry;
import com.tpmp.testprep.repository.ExamHistoryRepository;
import com.tpmp.testprep.repository.ExamRepository;
import com.tpmp.testprep.repository.InquiryRepository;
import com.tpmp.testprep.repository.LoginHistoryRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final LoginHistoryService loginHistoryService;
    private final ExamHistoryService examHistoryService;
    private final LoginHistoryRepository loginHistoryRepository;
    private final ExamHistoryRepository examHistoryRepository;
    private final InquiryRepository inquiryRepository;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;

    public DashboardStatsResponse getStats() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);

        long todayLoginCount = loginHistoryService.countTodayLogins();
        long todayInquiryCount = inquiryRepository.countByCreatedAtBetween(todayStart, todayEnd);
        long pendingInquiryCount = inquiryRepository.countByStatus(Inquiry.Status.PENDING);
        long totalExamCount = examRepository.countByDelYn("N");
        long totalMemberCount = userRepository.count();
        long todayExamAttemptCount = examHistoryService.countTodayExamAttempts();

        return new DashboardStatsResponse(
                todayLoginCount,
                todayInquiryCount,
                pendingInquiryCount,
                totalExamCount,
                totalMemberCount,
                todayExamAttemptCount
        );
    }

    public DashboardTrendResponse getTrend(int days) {
        if (days != 7 && days != 30 && days != 90) days = 7;

        LocalDate today = LocalDate.now();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MM/dd");

        List<DashboardTrendResponse.DayCount> loginTrend = new ArrayList<>();
        List<DashboardTrendResponse.DayCount> examTrend = new ArrayList<>();
        List<DashboardTrendResponse.DayCount> inquiryTrend = new ArrayList<>();

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime from = date.atStartOfDay();
            LocalDateTime to = date.plusDays(1).atStartOfDay();
            String label = date.format(fmt);

            loginTrend.add(new DashboardTrendResponse.DayCount(label,
                    loginHistoryRepository.countByLoginAtBetween(from, to)));
            examTrend.add(new DashboardTrendResponse.DayCount(label,
                    examHistoryRepository.countByTakenAtBetween(from, to)));
            inquiryTrend.add(new DashboardTrendResponse.DayCount(label,
                    inquiryRepository.countByCreatedAtBetween(from, to)));
        }

        return new DashboardTrendResponse(loginTrend, examTrend, inquiryTrend);
    }
}
