package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.Inquiry;
import com.tpmp.testprep.repository.ExamHistoryRepository;
import com.tpmp.testprep.repository.ExamRepository;
import com.tpmp.testprep.repository.InquiryRepository;
import com.tpmp.testprep.repository.LoginHistoryRepository;
import com.tpmp.testprep.repository.QuizHistoryRepository;
import com.tpmp.testprep.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DashboardServiceTest {

    @Test
    void getStatsCountsAllOpenBugReportStatuses() {
        InquiryRepository inquiryRepository = mock(InquiryRepository.class);
        DashboardService service = new DashboardService(
                mock(LoginHistoryService.class),
                mock(ExamHistoryService.class),
                mock(LoginHistoryRepository.class),
                mock(ExamHistoryRepository.class),
                inquiryRepository,
                mock(ExamRepository.class),
                mock(UserRepository.class),
                mock(QuizHistoryRepository.class)
        );
        List<Inquiry.Status> openStatuses = List.of(
                Inquiry.Status.PENDING,
                Inquiry.Status.IN_PROGRESS,
                Inquiry.Status.ON_HOLD
        );
        when(inquiryRepository.countByRequestTypeAndStatusIn(
                Inquiry.RequestType.BUG_REPORT, openStatuses)).thenReturn(3L);

        var response = service.getStats();

        assertThat(response.pendingBugCount()).isEqualTo(3L);
        verify(inquiryRepository).countByRequestTypeAndStatusIn(
                Inquiry.RequestType.BUG_REPORT,
                List.of(Inquiry.Status.PENDING, Inquiry.Status.IN_PROGRESS, Inquiry.Status.ON_HOLD)
        );
    }
}
