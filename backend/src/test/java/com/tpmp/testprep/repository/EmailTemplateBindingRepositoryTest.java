package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.EmailTemplate;
import com.tpmp.testprep.entity.EmailTemplateBinding;
import com.tpmp.testprep.entity.EmailTemplateEvent;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class EmailTemplateBindingRepositoryTest {

    @Autowired
    private EmailTemplateRepository templateRepository;

    @Autowired
    private EmailTemplateBindingRepository bindingRepository;

    @Test
    void findsBindingByEventAndTemplateId() {
        EmailTemplate template = templateRepository.save(EmailTemplate.create(
                "처리 완료", EmailTemplate.Scope.INQUIRY_STATUS,
                "제목", "<p>본문</p>", "본문", true, null, null));
        EmailTemplateBinding binding = bindingRepository.save(EmailTemplateBinding.create(
                EmailTemplateEvent.INQUIRY_COMPLETED, template, null));

        assertThat(bindingRepository.findByEventCode(EmailTemplateEvent.INQUIRY_COMPLETED))
                .contains(binding);
        assertThat(bindingRepository.findAllByTemplateId(template.getId()))
                .containsExactly(binding);
    }
}
