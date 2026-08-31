package com.tpmp.testprep.config;

import com.tpmp.testprep.entity.DomainMaster;
import com.tpmp.testprep.entity.DomainSlave;
import com.tpmp.testprep.entity.ExamInfo;
import com.tpmp.testprep.repository.*;
import com.tpmp.testprep.service.PracticeService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.ApplicationArguments;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class DataInitializerTest {

    @Test
    void ensureInquiryDomainTypesDefersNewDatabaseUntilContentDomainsExist() {
        DomainMasterRepository domainMasterRepository = mock(DomainMasterRepository.class);
        DomainSlaveRepository domainSlaveRepository = mock(DomainSlaveRepository.class);
        when(domainMasterRepository.findByCode("INQUIRY_CATEGORY")).thenReturn(Optional.empty());
        when(domainMasterRepository.findByCode("INQUIRY_BUG_AREA")).thenReturn(Optional.empty());

        DataInitializer initializer = newInitializer(
                mock(ExamInfoRepository.class),
                domainMasterRepository,
                domainSlaveRepository
        );

        initializer.ensureInquiryDomainTypes();

        verify(domainMasterRepository, never()).save(any(DomainMaster.class));
        verifyNoInteractions(domainSlaveRepository);
    }

    @Test
    void ensureInquiryDomainTypesAddsOnlyMissingWorkflowCodes() {
        DomainMasterRepository domainMasterRepository = mock(DomainMasterRepository.class);
        DomainSlaveRepository domainSlaveRepository = mock(DomainSlaveRepository.class);
        DomainMaster category = DomainMaster.builder()
                .code("INQUIRY_CATEGORY")
                .name("문의 카테고리")
                .build();
        DomainMaster bugArea = DomainMaster.builder()
                .code("INQUIRY_BUG_AREA")
                .name("문의 버그 발생 영역")
                .build();

        when(domainMasterRepository.findByCode("INQUIRY_CATEGORY")).thenReturn(Optional.of(category));
        when(domainMasterRepository.findByCode("INQUIRY_BUG_AREA")).thenReturn(Optional.of(bugArea));
        when(domainSlaveRepository.findByMasterCode("INQUIRY_CATEGORY")).thenReturn(List.of(
                DomainSlave.builder().master(category).name("GENERAL_INQUIRY").displayOrder(1).build()));
        when(domainSlaveRepository.findByMasterCode("INQUIRY_BUG_AREA")).thenReturn(List.of(
                DomainSlave.builder().master(bugArea).name("OTHER").displayOrder(9).build()));

        DataInitializer initializer = newInitializer(mock(ExamInfoRepository.class), domainMasterRepository, domainSlaveRepository);

        initializer.ensureInquiryDomainTypes();

        verify(domainSlaveRepository, times(12)).save(any(DomainSlave.class));
        verify(domainSlaveRepository).save(argThat(slave ->
                slave.getMaster() == category
                        && "BUG_REPORT".equals(slave.getName())
                        && slave.getDisplayOrder() == 2));
        verify(domainSlaveRepository).save(argThat(slave ->
                slave.getMaster() == bugArea
                        && "LOGIN_ACCOUNT".equals(slave.getName())
                        && slave.getDisplayOrder() == 10));
    }

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

    @Test
    void createsGlobalEmailTemplateAdminMenu() throws Exception {
        MenuConfigRepository menuConfigRepository = mock(MenuConfigRepository.class);
        when(menuConfigRepository.count()).thenReturn(1L);
        when(menuConfigRepository.existsByUrl(any(String.class))).thenAnswer(invocation ->
                !"/admin/email-templates".equals(invocation.getArgument(0)));
        DataInitializer initializer = newInitializer(mock(ExamInfoRepository.class), menuConfigRepository);

        initializer.run(mock(ApplicationArguments.class));

        verify(menuConfigRepository).save(argThat(menu ->
                menu.getMenuType() == com.tpmp.testprep.entity.MenuConfig.MenuType.ADMIN
                        && "이메일 템플릿 관리".equals(menu.getName())
                        && "/admin/email-templates".equals(menu.getUrl())
                        && "email".equals(menu.getIconKey())
                        && menu.getDisplayOrder() == 15));
    }

    @Test
    void createsGlobalEmailTemplateAdminMenuOnlyOnceAcrossRepeatedRuns() throws Exception {
        MenuConfigRepository menuConfigRepository = mock(MenuConfigRepository.class);
        AtomicInteger emailMenuChecks = new AtomicInteger();
        when(menuConfigRepository.count()).thenReturn(1L);
        when(menuConfigRepository.existsByUrl(any(String.class))).thenAnswer(invocation -> {
            String url = invocation.getArgument(0);
            return !"/admin/email-templates".equals(url) || emailMenuChecks.getAndIncrement() > 0;
        });
        DataInitializer initializer = newInitializer(mock(ExamInfoRepository.class), menuConfigRepository);

        initializer.run(mock(ApplicationArguments.class));
        initializer.run(mock(ApplicationArguments.class));

        verify(menuConfigRepository, times(1)).save(argThat(menu ->
                "/admin/email-templates".equals(menu.getUrl())));
    }

    private DataInitializer newInitializer(ExamInfoRepository examInfoRepository) {
        return newInitializer(
                examInfoRepository,
                mock(DomainMasterRepository.class),
                mock(DomainSlaveRepository.class),
                mock(MenuConfigRepository.class)
        );
    }

    private DataInitializer newInitializer(
            ExamInfoRepository examInfoRepository,
            MenuConfigRepository menuConfigRepository
    ) {
        return newInitializer(
                examInfoRepository,
                mock(DomainMasterRepository.class),
                mock(DomainSlaveRepository.class),
                menuConfigRepository
        );
    }

    private DataInitializer newInitializer(
            ExamInfoRepository examInfoRepository,
            DomainMasterRepository domainMasterRepository,
            DomainSlaveRepository domainSlaveRepository
    ) {
        return newInitializer(
                examInfoRepository,
                domainMasterRepository,
                domainSlaveRepository,
                mock(MenuConfigRepository.class)
        );
    }

    private DataInitializer newInitializer(
            ExamInfoRepository examInfoRepository,
            DomainMasterRepository domainMasterRepository,
            DomainSlaveRepository domainSlaveRepository,
            MenuConfigRepository menuConfigRepository
    ) {
        return new DataInitializer(
                mock(UserRepository.class),
                mock(PasswordEncoder.class),
                mock(JdbcTemplate.class),
                domainMasterRepository,
                domainSlaveRepository,
                mock(PermissionMasterRepository.class),
                mock(PermissionDetailRepository.class),
                menuConfigRepository,
                mock(PracticeService.class),
                examInfoRepository
        );
    }
}
