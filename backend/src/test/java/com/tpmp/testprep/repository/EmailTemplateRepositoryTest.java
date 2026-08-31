package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.EmailTemplate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class EmailTemplateRepositoryTest {

    @Autowired
    private EmailTemplateRepository repository;

    @Test
    void searchExcludesSoftDeletedTemplate() {
        EmailTemplate kept = repository.save(EmailTemplate.create("처리 완료", EmailTemplate.Scope.INQUIRY_STATUS,
                "제목", "<p>본문</p>", "본문", true, null, null));
        EmailTemplate deleted = repository.save(EmailTemplate.create("삭제", EmailTemplate.Scope.INQUIRY_STATUS,
                "제목", "<p>본문</p>", "본문", true, null, null));
        deleted.softDelete(null);
        repository.flush();

        assertThat(repository.search(null, null, null, PageRequest.of(0, 10)).getContent())
                .containsExactly(kept);
    }
}
