package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.DashboardStatsResponse;
import com.tpmp.testprep.entity.Inquiry;
import com.tpmp.testprep.repository.ExamRepository;
import com.tpmp.testprep.repository.InquiryRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final LoginHistoryService loginHistoryService;
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

        return new DashboardStatsResponse(
                todayLoginCount,
                todayInquiryCount,
                pendingInquiryCount,
                totalExamCount,
                totalMemberCount
        );
    }
}
