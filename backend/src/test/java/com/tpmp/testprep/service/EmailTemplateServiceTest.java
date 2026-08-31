package com.tpmp.testprep.service;

import com.tpmp.testprep.config.DefaultEmailTemplateCatalog;
import com.tpmp.testprep.dto.request.EmailTemplateCreateRequest;
import com.tpmp.testprep.dto.request.EmailTemplatePreviewRequest;
import com.tpmp.testprep.dto.request.EmailTemplateUpdateRequest;
import com.tpmp.testprep.dto.response.EmailTemplateDetailResponse;
import com.tpmp.testprep.dto.response.EmailTemplateInUseDetails;
import com.tpmp.testprep.dto.response.EmailTemplatePreviewResponse;
import com.tpmp.testprep.dto.response.EmailTemplateSummaryResponse;
import com.tpmp.testprep.dto.response.EmailTemplateTestSendResponse;
import com.tpmp.testprep.entity.EmailTemplate;
import com.tpmp.testprep.entity.EmailTemplateBinding;
import com.tpmp.testprep.entity.EmailTemplateEvent;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.EmailTemplateBindingRepository;
import com.tpmp.testprep.repository.EmailTemplateRepository;
import com.tpmp.testprep.repository.UserRepository;
import com.tpmp.testprep.service.EmailTemplateRenderer.PreparedTemplate;
import com.tpmp.testprep.service.EmailTemplateRenderer.RenderedEmail;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailTemplateServiceTest {

    @Mock
    private EmailTemplateRepository templateRepository;

    @Mock
    private EmailTemplateBindingRepository bindingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailTemplateRenderer renderer;

    @Mock
    private EmailTemplateTestMailSender testMailSender;

    private EmailTemplateService service;

    @BeforeEach
    void setUp() {
        service = new EmailTemplateService(
                templateRepository,
                bindingRepository,
                userRepository,
                renderer,
                new DefaultEmailTemplateCatalog(),
                testMailSender,
                "http://localhost:3000");
    }

    @Test
    void createStoresPreparedBodiesAndAuthenticatedAdmin() {
        User admin = admin();
        when(userRepository.findByEmail("admin@tpmp.com")).thenReturn(Optional.of(admin));
        when(renderer.prepare(EmailTemplate.Scope.INQUIRY_STATUS, "제목", "<p onclick='x'>본문</p>"))
                .thenReturn(new PreparedTemplate("제목", "<p>본문</p>", "본문"));
        when(templateRepository.save(any(EmailTemplate.class))).thenAnswer(invocation -> {
            EmailTemplate saved = invocation.getArgument(0);
            initialize(saved, 1L);
            return saved;
        });
        when(bindingRepository.findAllByTemplateId(1L)).thenReturn(List.of());
        when(renderer.getAllowedVariables(EmailTemplate.Scope.INQUIRY_STATUS)).thenReturn(List.of());

        EmailTemplateDetailResponse response = service.create(new EmailTemplateCreateRequest(
                "이름",
                EmailTemplate.Scope.INQUIRY_STATUS,
                "제목",
                "<p onclick='x'>본문</p>",
                true), "admin@tpmp.com");

        assertThat(response.htmlBody()).isEqualTo("<p>본문</p>");
        assertThat(response.textBody()).isEqualTo("본문");
        assertThat(response.defaultTemplate()).isFalse();
        verify(userRepository).findByEmail("admin@tpmp.com");
    }

    @Test
    void getAllMapsReferencesAndDeletionAvailability() {
        EmailTemplate template = template();
        PageRequest pageable = PageRequest.of(0, 20);
        when(templateRepository.search("원본", EmailTemplate.Scope.INQUIRY_STATUS, true, pageable))
                .thenReturn(new PageImpl<>(List.of(template), pageable, 1));
        when(bindingRepository.findAllByTemplateId(1L)).thenReturn(List.of(completedBinding(template)));

        Page<EmailTemplateSummaryResponse> response = service.getAll(
                " 원본 ", EmailTemplate.Scope.INQUIRY_STATUS, true, pageable);

        assertThat(response.getTotalElements()).isEqualTo(1);
        assertThat(response.getContent().get(0).referenceCount()).isEqualTo(1);
        assertThat(response.getContent().get(0).deletable()).isFalse();
    }

    @Test
    void getOneReturnsDetailWithAllowedVariables() {
        EmailTemplate template = template();
        when(templateRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(template));
        when(bindingRepository.findAllByTemplateId(1L)).thenReturn(List.of());
        when(renderer.getAllowedVariables(EmailTemplate.Scope.INQUIRY_STATUS)).thenReturn(List.of(
                new EmailTemplateRenderer.AllowedVariable(
                        "{{recipientName}}", "recipientName", "문의자 이름", "문의자 표시 이름")));

        EmailTemplateDetailResponse response = service.getOne(1L);

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.allowedVariables()).singleElement()
                .satisfies(variable -> assertThat(variable.name()).isEqualTo("recipientName"));
    }

    @Test
    void updateStoresServerSanitizedBodies() {
        EmailTemplate template = template();
        when(templateRepository.findActiveForUpdate(1L)).thenReturn(Optional.of(template));
        when(userRepository.findByEmail("admin@tpmp.com")).thenReturn(Optional.of(admin()));
        when(renderer.prepare(any(), anyString(), anyString()))
                .thenReturn(new PreparedTemplate("제목", "<p>정화</p>", "정화"));
        when(bindingRepository.findAllByTemplateId(1L)).thenReturn(List.of());
        when(renderer.getAllowedVariables(EmailTemplate.Scope.INQUIRY_STATUS)).thenReturn(List.of());

        EmailTemplateDetailResponse response = service.update(1L,
                new EmailTemplateUpdateRequest("이름", "제목", "<p onclick='x'>정화</p>", true),
                "admin@tpmp.com");

        assertThat(response.htmlBody()).isEqualTo("<p>정화</p>");
        assertThat(template.getHtmlBody()).isEqualTo("<p>정화</p>");
    }

    @Test
    void invalidRendererVariableMapsToTemplateVariableError() {
        when(userRepository.findByEmail("admin@tpmp.com")).thenReturn(Optional.of(admin()));
        when(renderer.prepare(any(), anyString(), anyString())).thenThrow(new EmailTemplateRenderingException(
                EmailTemplateRenderingException.Reason.INVALID_VARIABLE, "internal reason"));

        assertThatThrownBy(() -> service.create(new EmailTemplateCreateRequest(
                "이름", EmailTemplate.Scope.INQUIRY_STATUS, "제목", "<p>{{unknown}}</p>", true),
                "admin@tpmp.com"))
                .isInstanceOfSatisfying(BusinessException.class,
                        exception -> assertThat(exception.getErrorCode())
                                .isEqualTo(ErrorCode.EMAIL_TEMPLATE_INVALID_VARIABLE));
    }

    @Test
    void deleteReferencedTemplateThrowsDetailedConflict() {
        EmailTemplate template = template();
        when(templateRepository.findActiveForUpdate(1L)).thenReturn(Optional.of(template));
        when(bindingRepository.findAllByTemplateId(1L)).thenReturn(List.of(completedBinding(template)));

        assertThatThrownBy(() -> service.delete(1L, "admin@tpmp.com"))
                .isInstanceOfSatisfying(BusinessException.class, exception -> {
                    assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.EMAIL_TEMPLATE_IN_USE);
                    assertThat(exception.getDetails()).isInstanceOfSatisfying(
                            EmailTemplateInUseDetails.class,
                            details -> assertThat(details.referencedEvents()).hasSize(1));
                });
        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    void deleteUnreferencedTemplateSoftDeletesWithAuthenticatedAdmin() {
        EmailTemplate template = template();
        when(templateRepository.findActiveForUpdate(1L)).thenReturn(Optional.of(template));
        when(bindingRepository.findAllByTemplateId(1L)).thenReturn(List.of());
        when(userRepository.findByEmail("admin@tpmp.com")).thenReturn(Optional.of(admin()));

        service.delete(1L, "admin@tpmp.com");

        assertThat(template.isDeleted()).isTrue();
    }

    @Test
    void cloneClearsSystemKeyAndUsesCopyName() {
        EmailTemplate source = template();
        when(templateRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(source));
        when(userRepository.findByEmail("admin@tpmp.com")).thenReturn(Optional.of(admin()));
        when(templateRepository.save(any(EmailTemplate.class))).thenAnswer(invocation -> {
            EmailTemplate saved = invocation.getArgument(0);
            initialize(saved, 2L);
            return saved;
        });
        when(bindingRepository.findAllByTemplateId(2L)).thenReturn(List.of());
        when(renderer.getAllowedVariables(EmailTemplate.Scope.INQUIRY_STATUS)).thenReturn(List.of());

        EmailTemplateDetailResponse response = service.cloneTemplate(1L, "admin@tpmp.com");

        assertThat(response.name()).isEqualTo("원본 복사본");
        assertThat(response.defaultTemplate()).isFalse();
    }

    @Test
    void resetDefaultRejectsTemplateWithoutSystemKey() {
        EmailTemplate custom = template();
        when(templateRepository.findActiveForUpdate(1L)).thenReturn(Optional.of(custom));

        assertThatThrownBy(() -> service.resetDefault(1L, "admin@tpmp.com"))
                .isInstanceOfSatisfying(BusinessException.class,
                        exception -> assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.INVALID_INPUT));
    }

    @Test
    void resetDefaultRestoresCatalogContentAndActivatesTemplate() {
        EmailTemplate system = template();
        ReflectionTestUtils.setField(system, "systemKey", "INQUIRY_COMPLETED_DEFAULT");
        when(templateRepository.findActiveForUpdate(1L)).thenReturn(Optional.of(system));
        when(userRepository.findByEmail("admin@tpmp.com")).thenReturn(Optional.of(admin()));
        when(renderer.prepare(any(), anyString(), anyString()))
                .thenReturn(new PreparedTemplate("기본 제목", "<p>기본 본문</p>", "기본 본문"));
        when(bindingRepository.findAllByTemplateId(1L)).thenReturn(List.of());
        when(renderer.getAllowedVariables(EmailTemplate.Scope.INQUIRY_STATUS)).thenReturn(List.of());

        EmailTemplateDetailResponse response = service.resetDefault(1L, "admin@tpmp.com");

        assertThat(response.name()).isEqualTo("문의 처리 완료 안내");
        assertThat(response.active()).isTrue();
        assertThat(response.subjectTemplate()).isEqualTo("기본 제목");
    }

    @Test
    void testSendUsesStoredTemplateAndAuthenticatedAdminEmail() {
        EmailTemplate template = template();
        EmailTemplateTestSendResponse sent = new EmailTemplateTestSendResponse(
                "a***@tpmp.com", LocalDateTime.of(2026, 8, 31, 12, 0));
        when(templateRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(template));
        when(testMailSender.send(template, "admin@tpmp.com")).thenReturn(sent);

        EmailTemplateTestSendResponse response = service.testSend(1L, "admin@tpmp.com");

        assertThat(response).isEqualTo(sent);
        verify(testMailSender).send(template, "admin@tpmp.com");
    }

    @Test
    void previewReturnsSanitizedAndRenderedBodiesWithoutSaving() {
        when(renderer.prepare(EmailTemplate.Scope.INQUIRY_STATUS, "제목 {{inquiryId}}", "<p>본문</p>"))
                .thenReturn(new PreparedTemplate("제목 {{inquiryId}}", "<p>본문</p>", "본문"));
        when(renderer.render(eq(EmailTemplate.Scope.INQUIRY_STATUS), eq("제목 {{inquiryId}}"),
                eq("<p>본문</p>"), org.mockito.ArgumentMatchers.<Map<String, String>>any()))
                .thenReturn(new RenderedEmail("제목 1001", "<p>본문</p>", "본문"));

        EmailTemplatePreviewResponse response = service.preview(new EmailTemplatePreviewRequest(
                EmailTemplate.Scope.INQUIRY_STATUS, "제목 {{inquiryId}}", "<p>본문</p>"));

        assertThat(response.renderedSubject()).isEqualTo("제목 1001");
        assertThat(response.unsafeContentRemoved()).isFalse();
        verify(templateRepository, never()).save(any());
    }

    private User admin() {
        return User.builder()
                .email("admin@tpmp.com")
                .password("encoded")
                .name("관리자")
                .role(User.Role.ADMIN)
                .build();
    }

    private EmailTemplate template() {
        EmailTemplate template = EmailTemplate.create(
                "원본",
                EmailTemplate.Scope.INQUIRY_STATUS,
                "제목",
                "<p>본문</p>",
                "본문",
                true,
                null,
                admin());
        initialize(template, 1L);
        return template;
    }

    private EmailTemplateBinding completedBinding(EmailTemplate template) {
        return EmailTemplateBinding.create(EmailTemplateEvent.INQUIRY_COMPLETED, template, admin());
    }

    private void initialize(EmailTemplate template, Long id) {
        ReflectionTestUtils.setField(template, "id", id);
        ReflectionTestUtils.setField(template, "createdAt", LocalDateTime.of(2026, 8, 31, 10, 0));
        ReflectionTestUtils.setField(template, "updatedAt", LocalDateTime.of(2026, 8, 31, 10, 0));
    }
}
