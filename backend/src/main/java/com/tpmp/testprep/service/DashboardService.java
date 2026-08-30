package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.DashboardStatsResponse;
import com.tpmp.testprep.dto.response.DashboardTrendResponse;
import com.tpmp.testprep.entity.Inquiry;
import com.tpmp.testprep.repository.ExamHistoryRepository;
import com.tpmp.testprep.repository.ExamRepository;
import com.tpmp.testprep.repository.InquiryRepository;
import com.tpmp.testprep.repository.LoginHistoryRepository;
import com.tpmp.testprep.repository.QuizHistoryRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
    private final QuizHistoryRepository quizHistoryRepository;

    public DashboardStatsResponse getStats() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);

        long todayLoginCount = loginHistoryService.countTodayLogins();
        long todayInquiryCount = inquiryRepository.countByCreatedAtBetween(todayStart, todayEnd);
        long pendingInquiryCount = inquiryRepository.countByStatus(Inquiry.Status.PENDING);
        long pendingBugCount = inquiryRepository.countByRequestTypeAndStatusIn(
                Inquiry.RequestType.BUG_REPORT,
                List.of(Inquiry.Status.PENDING, Inquiry.Status.IN_PROGRESS, Inquiry.Status.ON_HOLD));
        long totalExamCount = examRepository.countByDelYn("N");
        long totalMemberCount = userRepository.count();
        long todayExamAttemptCount = examHistoryService.countTodayExamAttempts();
        long todayQuizAttemptCount = quizHistoryRepository.countByCreatedAtBetween(todayStart, todayEnd);

        return new DashboardStatsResponse(
                todayLoginCount,
                todayInquiryCount,
                pendingInquiryCount,
                pendingBugCount,
                totalExamCount,
                totalMemberCount,
                todayExamAttemptCount,
                todayQuizAttemptCount
        );
    }

    public DashboardTrendResponse getTrend(int days) {
        if (days != 7 && days != 30 && days != 90) days = 7;

        LocalDate today = LocalDate.now();
        LocalDateTime from = today.minusDays(days - 1L).atStartOfDay();
        LocalDateTime to = today.plusDays(1).atStartOfDay();

        Map<LocalDate, Long> loginCounts = toDailyCountMap(loginHistoryRepository.countDailyByLoginAtBetween(from, to));
        Map<LocalDate, Long> examCounts = toDailyCountMap(examHistoryRepository.countDailyByTakenAtBetween(from, to));
        Map<LocalDate, Long> inquiryCounts = toDailyCountMap(inquiryRepository.countDailyByCreatedAtBetween(from, to));
        Map<LocalDate, Long> quizCounts = toDailyCountMap(quizHistoryRepository.countDailyByCreatedAtBetween(from, to));

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MM/dd");
        List<DashboardTrendResponse.DayCount> loginTrend = new ArrayList<>();
        List<DashboardTrendResponse.DayCount> examTrend = new ArrayList<>();
        List<DashboardTrendResponse.DayCount> inquiryTrend = new ArrayList<>();
        List<DashboardTrendResponse.DayCount> quizTrend = new ArrayList<>();

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            String label = date.format(fmt);

            loginTrend.add(new DashboardTrendResponse.DayCount(label, loginCounts.getOrDefault(date, 0L)));
            examTrend.add(new DashboardTrendResponse.DayCount(label, examCounts.getOrDefault(date, 0L)));
            inquiryTrend.add(new DashboardTrendResponse.DayCount(label, inquiryCounts.getOrDefault(date, 0L)));
            quizTrend.add(new DashboardTrendResponse.DayCount(label, quizCounts.getOrDefault(date, 0L)));
        }

        return new DashboardTrendResponse(loginTrend, examTrend, inquiryTrend, quizTrend);
    }

    // CAST(... AS date) 결과가 Hibernate 경로에 따라 java.sql.Date/LocalDate 둘 다로 올 수 있어 함께 처리
    private Map<LocalDate, Long> toDailyCountMap(List<Object[]> rows) {
        Map<LocalDate, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            if (row[0] == null) continue;
            LocalDate date = (row[0] instanceof java.sql.Date sqlDate)
                    ? sqlDate.toLocalDate()
                    : (LocalDate) row[0];
            map.put(date, ((Number) row[1]).longValue());
        }
        return map;
    }
}
