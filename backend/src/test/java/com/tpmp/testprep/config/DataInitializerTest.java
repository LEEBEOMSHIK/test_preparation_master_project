package com.tpmp.testprep.config;

import com.tpmp.testprep.entity.ExamInfo;
import com.tpmp.testprep.repository.*;
import com.tpmp.testprep.service.PracticeService;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class DataInitializerTest {

    @Test
    void ensureQnetPracticalExamInfoCreatesThreeInformationProcessingEngineerPracticalRows() {
        ExamInfoRepository examInfoRepository = mock(ExamInfoRepository.class);
        when(examInfoRepository.findByTitle("정보처리기사 실기 2026년 정기 기사 1회"))
                .thenReturn(Optional.empty());
        when(examInfoRepository.findByTitle("정보처리기사 실기 2026년 정기 기사 2회"))
                .thenReturn(Optional.empty());
        when(examInfoRepository.findByTitle("정보처리기사 실기 2026년 정기 기사 3회"))
                .thenReturn(Optional.empty());
        when(examInfoRepository.save(any(ExamInfo.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        DataInitializer initializer = newInitializer(examInfoRepository);

        initializer.ensureQnetPracticalExamInfo();

        verify(examInfoRepository, times(3)).save(any(ExamInfo.class));
        verify(examInfoRepository).save(argThat(info ->
                "정보처리기사 실기".equals(info.getExamType())
                        && "정보처리기사 실기 2026년 정기 기사 2회".equals(info.getTitle())
                        && "2026-06-22 ~ 2026-06-25".equals(info.getApplicationPeriod())
                        && "2026-07-18 ~ 2026-08-05".equals(info.getExamSchedule())
                        && "2026-09-11".equals(info.getResultDate())
                        && info.getDescription().contains("실기 과목: 정보처리 실무")
                        && info.getDescription().contains("검정방법: 필답형(2시간 30분)")
                        && info.getDescription().contains("출제경향: 요구사항 확인")
                        && info.getOfficialUrl().contains("jmCd=1320")
                        && info.isActive()
        ));
    }

    @Test
    void ensureQnetPracticalExamInfoSkipsExistingTitle() {
        ExamInfoRepository examInfoRepository = mock(ExamInfoRepository.class);
        when(examInfoRepository.findByTitle("정보처리기사 실기 2026년 정기 기사 1회"))
                .thenReturn(Optional.of(ExamInfo.builder().examType("정보처리기사 실기").title("existing").build()));
        when(examInfoRepository.findByTitle("정보처리기사 실기 2026년 정기 기사 2회"))
                .thenReturn(Optional.empty());
        when(examInfoRepository.findByTitle("정보처리기사 실기 2026년 정기 기사 3회"))
                .thenReturn(Optional.empty());

        DataInitializer initializer = newInitializer(examInfoRepository);

        initializer.ensureQnetPracticalExamInfo();

        verify(examInfoRepository, never()).save(argThat(info ->
                "정보처리기사 실기 2026년 정기 기사 1회".equals(info.getTitle())));
        verify(examInfoRepository, times(2)).save(any(ExamInfo.class));
        verify(examInfoRepository).findByTitle(eq("정보처리기사 실기 2026년 정기 기사 1회"));
    }

    private DataInitializer newInitializer(ExamInfoRepository examInfoRepository) {
        return new DataInitializer(
                mock(UserRepository.class),
                mock(PasswordEncoder.class),
                mock(JdbcTemplate.class),
                mock(DomainMasterRepository.class),
                mock(DomainSlaveRepository.class),
                mock(PermissionMasterRepository.class),
                mock(PermissionDetailRepository.class),
                mock(MenuConfigRepository.class),
                mock(PracticeService.class),
                examInfoRepository,
                mock(ExamRepository.class),
                mock(QuestionRepository.class),
                mock(ExaminationRepository.class)
        );
    }
}
