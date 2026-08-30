package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.Inquiry;
import com.tpmp.testprep.entity.InquiryEmailDelivery;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.repository.InquiryEmailDeliveryRepository;
import com.tpmp.testprep.repository.InquiryRepository;
import com.tpmp.testprep.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.core.task.SyncTaskExecutor;
import org.springframework.core.task.TaskExecutor;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@SpringBootTest(
        classes = InquiryEmailTransactionIntegrationTest.TestApplication.class,
        properties = {
                "spring.datasource.url=jdbc:h2:mem:inquiry-email-tx;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
                "spring.datasource.driver-class-name=org.h2.Driver",
                "spring.jpa.hibernate.ddl-auto=create-drop",
                "spring.jpa.open-in-view=false",
                "spring.mail.host=smtp.test",
                "management.health.mail.enabled=false",
                "app.mail.from-address=noreply@tpmp.test",
                "app.public-url=http://localhost:3000"
        }
)
class InquiryEmailTransactionIntegrationTest {

    @Autowired
    private TransactionFixture transactionFixture;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InquiryRepository inquiryRepository;

    @Autowired
    private InquiryEmailDeliveryRepository deliveryRepository;

    @MockBean
    private JavaMailSender mailSender;

    @BeforeEach
    void clean() {
        deliveryRepository.deleteAll();
        inquiryRepository.deleteAll();
        userRepository.deleteAll();
        reset(mailSender);
    }

    @Test
    void afterCommitDispatchesQueuedDelivery() {
        doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        Long inquiryId = transactionFixture.saveInquiryAndQueue(false);

        assertThat(inquiryRepository.findById(inquiryId)).isPresent();
        assertThat(deliveryRepository.findAll()).singleElement()
                .extracting(InquiryEmailDelivery::getStatus)
                .isEqualTo(InquiryEmailDelivery.Status.SENT);
        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void rolledBackBusinessTransactionDoesNotDispatchOrPersistDelivery() {
        assertThatThrownBy(() -> transactionFixture.saveInquiryAndQueue(true))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("rollback requested");

        assertThat(inquiryRepository.count()).isZero();
        assertThat(deliveryRepository.count()).isZero();
        verifyNoInteractions(mailSender);
    }

    @Test
    void smtpFailureDoesNotRollbackCommittedInquiryAndRecordsFailedDelivery() {
        doThrow(new MailSendException("smtp unavailable"))
                .when(mailSender)
                .send(any(SimpleMailMessage.class));

        Long inquiryId = transactionFixture.saveInquiryAndQueue(false);

        assertThat(inquiryRepository.findById(inquiryId)).isPresent();
        assertThat(deliveryRepository.findAll()).singleElement()
                .satisfies(delivery -> {
                    assertThat(delivery.getStatus()).isEqualTo(InquiryEmailDelivery.Status.FAILED);
                    assertThat(delivery.getLastError()).isEqualTo("메일 전송에 실패했습니다.");
                });
    }

    @SpringBootConfiguration
    @EnableAutoConfiguration
    @EntityScan(basePackages = "com.tpmp.testprep.entity")
    @EnableTransactionManagement
    @EnableJpaRepositories(basePackages = "com.tpmp.testprep.repository")
    @Import({
            InquiryEmailService.class,
            InquiryEmailDispatcher.class,
            InquiryEmailDeliveryProcessor.class,
            TransactionFixture.class
    })
    static class TestApplication {
        @Bean(name = "inquiryEmailExecutor")
        TaskExecutor inquiryEmailExecutor() {
            return new SyncTaskExecutor();
        }
    }

    static class TransactionFixture {
        private final UserRepository userRepository;
        private final InquiryRepository inquiryRepository;
        private final InquiryEmailService emailService;

        TransactionFixture(UserRepository userRepository,
                           InquiryRepository inquiryRepository,
                           InquiryEmailService emailService) {
            this.userRepository = userRepository;
            this.inquiryRepository = inquiryRepository;
            this.emailService = emailService;
        }

        @Transactional
        public Long saveInquiryAndQueue(boolean rollback) {
            User user = userRepository.save(User.builder()
                    .email("tx-" + System.nanoTime() + "@tpmp.test")
                    .password("pw")
                    .name("트랜잭션 사용자")
                    .role(User.Role.USER)
                    .build());
            Inquiry inquiry = inquiryRepository.save(Inquiry.builder()
                    .user(user)
                    .title("트랜잭션 문의")
                    .content("문의 본문")
                    .requestType(Inquiry.RequestType.GENERAL_INQUIRY)
                    .build());
            emailService.queueUserNotification(
                    InquiryEmailDelivery.EventType.ADMIN_MESSAGE,
                    inquiry,
                    null,
                    true
            );
            if (rollback) {
                throw new IllegalStateException("rollback requested");
            }
            return inquiry.getId();
        }
    }
}
