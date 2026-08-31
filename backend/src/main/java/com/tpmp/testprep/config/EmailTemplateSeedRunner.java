package com.tpmp.testprep.config;

import com.tpmp.testprep.entity.EmailTemplate;
import com.tpmp.testprep.entity.EmailTemplateBinding;
import com.tpmp.testprep.repository.EmailTemplateBindingRepository;
import com.tpmp.testprep.repository.EmailTemplateRepository;
import com.tpmp.testprep.service.EmailTemplateRenderer;
import com.tpmp.testprep.service.EmailTemplateRenderer.PreparedTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class EmailTemplateSeedRunner implements CommandLineRunner {

    private final EmailTemplateRepository templateRepository;
    private final EmailTemplateBindingRepository bindingRepository;
    private final EmailTemplateRenderer renderer;
    private final DefaultEmailTemplateCatalog catalog;

    @Override
    @Transactional
    public void run(String... args) {
        List<DefaultEmailTemplateCatalog.Definition> definitions = catalog.definitions();
        Map<String, Optional<EmailTemplate>> existingTemplates = new LinkedHashMap<>();
        for (DefaultEmailTemplateCatalog.Definition definition : definitions) {
            existingTemplates.put(definition.systemKey(),
                    templateRepository.findBySystemKey(definition.systemKey()));
        }

        boolean firstInstallation = existingTemplates.values().stream().allMatch(Optional::isEmpty);
        for (DefaultEmailTemplateCatalog.Definition definition : definitions) {
            if (existingTemplates.get(definition.systemKey()).isPresent()) {
                continue;
            }

            PreparedTemplate prepared = renderer.prepare(
                    definition.eventCode().getScope(),
                    definition.subjectTemplate(),
                    definition.htmlBody());
            EmailTemplate template = templateRepository.save(EmailTemplate.create(
                    definition.name(),
                    definition.eventCode().getScope(),
                    prepared.subjectTemplate(),
                    prepared.sanitizedHtmlBody(),
                    prepared.textBody(),
                    true,
                    definition.systemKey(),
                    null));
            if (firstInstallation) {
                bindingRepository.save(EmailTemplateBinding.create(
                        definition.eventCode(), template, null));
            }
        }
    }
}
