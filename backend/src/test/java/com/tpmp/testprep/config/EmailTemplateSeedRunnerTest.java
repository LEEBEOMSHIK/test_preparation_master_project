package com.tpmp.testprep.config;

import com.tpmp.testprep.entity.EmailTemplate;
import com.tpmp.testprep.entity.EmailTemplateBinding;
import com.tpmp.testprep.repository.EmailTemplateBindingRepository;
import com.tpmp.testprep.repository.EmailTemplateRepository;
import com.tpmp.testprep.service.EmailTemplateRenderer;
import com.tpmp.testprep.service.EmailTemplateRenderer.PreparedTemplate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailTemplateSeedRunnerTest {

    @Mock
    private EmailTemplateRepository templateRepository;

    @Mock
    private EmailTemplateBindingRepository bindingRepository;

    @Mock
    private EmailTemplateRenderer renderer;

    @Test
    void firstSeedCreatesThreeTemplatesAndBindings() throws Exception {
        when(templateRepository.findBySystemKey(anyString())).thenReturn(Optional.empty());
        when(templateRepository.save(any(EmailTemplate.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(renderer.prepare(any(), anyString(), anyString()))
                .thenAnswer(invocation -> new PreparedTemplate(
                        invocation.getArgument(1), invocation.getArgument(2), "text"));

        new EmailTemplateSeedRunner(templateRepository, bindingRepository, renderer,
                new DefaultEmailTemplateCatalog()).run();

        ArgumentCaptor<EmailTemplate> templateCaptor = ArgumentCaptor.forClass(EmailTemplate.class);
        verify(templateRepository, times(3)).save(templateCaptor.capture());
        verify(bindingRepository, times(3)).save(any(EmailTemplateBinding.class));
        assertThat(templateCaptor.getAllValues())
                .extracting(EmailTemplate::getSystemKey)
                .containsExactly(
                        "INQUIRY_ANSWERED_DEFAULT",
                        "INQUIRY_COMPLETED_DEFAULT",
                        "INQUIRY_UNABLE_TO_PROCESS_DEFAULT");
    }

    @Test
    void existingSystemTemplatesDoNotRecreateRemovedBinding() throws Exception {
        when(templateRepository.findBySystemKey(anyString())).thenReturn(Optional.of(systemTemplate()));

        new EmailTemplateSeedRunner(templateRepository, bindingRepository, renderer,
                new DefaultEmailTemplateCatalog()).run();

        verify(bindingRepository, never()).save(any());
        verify(templateRepository, never()).save(any());
    }

    @Test
    void partiallyMissingSystemTemplatesAreRepairedWithoutBindings() throws Exception {
        EmailTemplate existing = systemTemplate();
        when(templateRepository.findBySystemKey("INQUIRY_ANSWERED_DEFAULT")).thenReturn(Optional.of(existing));
        when(templateRepository.findBySystemKey("INQUIRY_COMPLETED_DEFAULT")).thenReturn(Optional.empty());
        when(templateRepository.findBySystemKey("INQUIRY_UNABLE_TO_PROCESS_DEFAULT")).thenReturn(Optional.of(existing));
        when(templateRepository.save(any(EmailTemplate.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(renderer.prepare(any(), anyString(), anyString()))
                .thenAnswer(invocation -> new PreparedTemplate(
                        invocation.getArgument(1), invocation.getArgument(2), "text"));

        new EmailTemplateSeedRunner(templateRepository, bindingRepository, renderer,
                new DefaultEmailTemplateCatalog()).run();

        verify(templateRepository, times(1)).save(any(EmailTemplate.class));
        verify(bindingRepository, never()).save(any());
    }

    private EmailTemplate systemTemplate() {
        return EmailTemplate.create(
                "기본 템플릿",
                EmailTemplate.Scope.INQUIRY_STATUS,
                "제목",
                "<p>본문</p>",
                "본문",
                true,
                "INQUIRY_COMPLETED_DEFAULT",
                null);
    }
}
