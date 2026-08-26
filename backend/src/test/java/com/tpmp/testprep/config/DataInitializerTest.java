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

    @Test
    void ensurePatchNotesAdminMenuCreatesOnlyOnceAcrossRepeatedRuns() {
        MenuConfigRepository menuConfigRepository = mock(MenuConfigRepository.class);
        when(menuConfigRepository.existsByUrl("/admin/patch-notes"))
                .thenReturn(false, true);

        DataInitializer initializer = newInitializer(mock(ExamInfoRepository.class), menuConfigRepository);

        initializer.ensurePatchNotesAdminMenu();
        initializer.ensurePatchNotesAdminMenu();

        verify(menuConfigRepository, times(2)).existsByUrl("/admin/patch-notes");
        verify(menuConfigRepository).save(argThat(menu ->
                "패치노트 관리".equals(menu.getName())
                        && "/admin/patch-notes".equals(menu.getUrl())
                        && "menu".equals(menu.getIconKey())
                        && menu.getDisplayOrder() == 14
                        && menu.getMenuType() == com.tpmp.testprep.entity.MenuConfig.MenuType.ADMIN
                        && "ADMIN".equals(menu.getAllowedRoles())
                        && menu.isActive()
        ));
        verify(menuConfigRepository, times(1)).save(any(com.tpmp.testprep.entity.MenuConfig.class));
    }

    private DataInitializer newInitializer(ExamInfoRepository examInfoRepository) {
        return newInitializer(examInfoRepository, mock(MenuConfigRepository.class));
    }

    private DataInitializer newInitializer(
            ExamInfoRepository examInfoRepository,
            MenuConfigRepository menuConfigRepository
    ) {
        return new DataInitializer(
                mock(UserRepository.class),
                mock(PasswordEncoder.class),
                mock(JdbcTemplate.class),
                mock(DomainMasterRepository.class),
                mock(DomainSlaveRepository.class),
                mock(PermissionMasterRepository.class),
                mock(PermissionDetailRepository.class),
                menuConfigRepository,
                mock(PracticeService.class),
                examInfoRepository
        );
    }
}
