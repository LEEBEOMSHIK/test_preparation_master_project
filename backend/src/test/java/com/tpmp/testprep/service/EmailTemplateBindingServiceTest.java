package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.EmailTemplateBindingResponse;
import com.tpmp.testprep.entity.EmailTemplate;
import com.tpmp.testprep.entity.EmailTemplateBinding;
import com.tpmp.testprep.entity.EmailTemplateEvent;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.EmailTemplateBindingRepository;
import com.tpmp.testprep.repository.EmailTemplateRepository;
import com.tpmp.testprep.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailTemplateBindingServiceTest {

    @Mock
    private EmailTemplateRepository templateRepository;

    @Mock
    private EmailTemplateBindingRepository bindingRepository;

    @Mock
    private UserRepository userRepository;

    private EmailTemplateBindingService service;

    @BeforeEach
    void setUp() {
        service = new EmailTemplateBindingService(templateRepository, bindingRepository, userRepository);
    }

    @Test
    void bindRejectsInactiveTemplate() {
        EmailTemplate inactive = template(false);
        when(templateRepository.findActiveForUpdate(1L)).thenReturn(Optional.of(inactive));

        assertThatThrownBy(() -> service.bind("INQUIRY_COMPLETED", 1L, "admin@tpmp.com"))
                .isInstanceOfSatisfying(BusinessException.class,
                        exception -> assertThat(exception.getErrorCode())
                                .isEqualTo(ErrorCode.EMAIL_TEMPLATE_INVALID_CONTENT));
    }

    @Test
    void bindRejectsScopeMismatchedTemplate() {
        EmailTemplate template = org.mockito.Mockito.mock(EmailTemplate.class);
        when(template.getScope()).thenReturn(null);
        when(template.isActive()).thenReturn(true);
        when(templateRepository.findActiveForUpdate(1L)).thenReturn(Optional.of(template));

        assertThatThrownBy(() -> service.bind("INQUIRY_COMPLETED", 1L, "admin@tpmp.com"))
                .isInstanceOfSatisfying(BusinessException.class,
                        exception -> assertThat(exception.getErrorCode())
                                .isEqualTo(ErrorCode.EMAIL_TEMPLATE_SCOPE_MISMATCH));
    }

    @Test
    void bindCreatesConfiguredAndSendableResponse() {
        EmailTemplate template = template(true);
        when(templateRepository.findActiveForUpdate(1L)).thenReturn(Optional.of(template));
        when(userRepository.findByEmail("admin@tpmp.com")).thenReturn(Optional.of(admin()));
        when(bindingRepository.findByEventCode(EmailTemplateEvent.INQUIRY_COMPLETED))
                .thenReturn(Optional.empty());

        EmailTemplateBindingResponse response = service.bind(
                "INQUIRY_COMPLETED", 1L, "admin@tpmp.com");

        assertThat(response.configured()).isTrue();
        assertThat(response.sendable()).isTrue();
        assertThat(response.templateId()).isEqualTo(1L);
        verify(bindingRepository).save(any(EmailTemplateBinding.class));
    }

    @Test
    void unbindReturnsConfiguredFalseAndDoesNotDeleteTemplate() {
        EmailTemplate template = template(true);
        EmailTemplateBinding binding = EmailTemplateBinding.create(
                EmailTemplateEvent.INQUIRY_COMPLETED, template, admin());
        when(bindingRepository.findByEventCode(EmailTemplateEvent.INQUIRY_COMPLETED))
                .thenReturn(Optional.of(binding));

        EmailTemplateBindingResponse response = service.unbind("INQUIRY_COMPLETED");

        assertThat(response.configured()).isFalse();
        assertThat(response.eventCode()).isEqualTo(EmailTemplateEvent.INQUIRY_COMPLETED);
        verify(bindingRepository).delete(binding);
        verify(templateRepository, never()).delete(any());
    }

    @Test
    void getAllBindingsAlwaysReturnsThreeEventRows() {
        when(bindingRepository.findAllByOrderByEventCodeAsc()).thenReturn(List.of());

        List<EmailTemplateBindingResponse> responses = service.getAllBindings();

        assertThat(responses)
                .extracting(EmailTemplateBindingResponse::eventCode)
                .containsExactly(EmailTemplateEvent.values());
        assertThat(responses).allMatch(response -> !response.configured() && !response.sendable());
    }

    private EmailTemplate template(boolean active) {
        EmailTemplate template = EmailTemplate.create(
                "템플릿",
                EmailTemplate.Scope.INQUIRY_STATUS,
                "제목",
                "<p>본문</p>",
                "본문",
                active,
                null,
                admin());
        ReflectionTestUtils.setField(template, "id", 1L);
        return template;
    }

    private User admin() {
        return User.builder()
                .email("admin@tpmp.com")
                .password("encoded")
                .name("관리자")
                .role(User.Role.ADMIN)
                .build();
    }
}
