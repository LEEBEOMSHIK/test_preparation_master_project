package com.tpmp.testprep.service;

import com.tpmp.testprep.config.DefaultEmailTemplateCatalog;
import com.tpmp.testprep.entity.EmailTemplate;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.repository.EmailTemplateBindingRepository;
import com.tpmp.testprep.repository.EmailTemplateRepository;
import com.tpmp.testprep.repository.UserRepository;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;

@SpringJUnitConfig(EmailTemplateTestSendTransactionIntegrationTest.TestApplication.class)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:email-template-test-send-tx;" +
                "MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.open-in-view=false",
        "spring.mail.host=smtp.test",
        "management.health.mail.enabled=false",
        "app.mail.from-address=noreply@tpmp.test",
        "app.public-url=http://localhost:3000"
})
class EmailTemplateTestSendTransactionIntegrationTest {

    @Autowired
    private EmailTemplateService service;

    @Autowired
    private EmailTemplateBindingRepository bindingRepository;

    @Autowired
    private EmailTemplateRepository templateRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JavaMailSender mailSender;

    @BeforeEach
    void clean() {
        bindingRepository.deleteAll();
        templateRepository.deleteAll();
        userRepository.deleteAll();
        reset(mailSender);
    }

    @Test
    void smtpSendRunsWithoutActiveTransaction() {
        User admin = userRepository.save(User.builder()
                .email("tx-admin@tpmp.test")
                .password("encoded")
                .name("트랜잭션 관리자")
                .role(User.Role.ADMIN)
                .build());
        EmailTemplate template = templateRepository.save(EmailTemplate.create(
                "트랜잭션 경계 테스트",
                EmailTemplate.Scope.INQUIRY_STATUS,
                "테스트 제목",
                "<p>테스트 본문</p>",
                "테스트 본문",
                true,
                null,
                admin));
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage((Session) null));
        doAnswer(invocation -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            return null;
        }).when(mailSender).send(any(MimeMessage.class));

        service.testSend(template.getId(), admin.getEmail());
    }

    @Configuration(proxyBeanMethods = false)
    @EnableAutoConfiguration
    @EntityScan(basePackages = "com.tpmp.testprep.entity")
    @EnableJpaRepositories(basePackages = "com.tpmp.testprep.repository")
    @EnableTransactionManagement
    @Import({
            EmailTemplateService.class,
            EmailTemplateTestMailSender.class,
            EmailTemplateRenderer.class,
            DefaultEmailTemplateCatalog.class
    })
    static class TestApplication {

        @Bean
        JavaMailSender mailSender() {
            return mock(JavaMailSender.class);
        }
    }
}
