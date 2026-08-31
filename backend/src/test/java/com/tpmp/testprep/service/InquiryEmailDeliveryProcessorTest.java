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
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.url=jdbc:h2:mem:inquiry-delivery;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE"
})
@Import(InquiryEmailDeliveryProcessor.class)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class InquiryEmailDeliveryProcessorTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InquiryRepository inquiryRepository;

    @Autowired
    private InquiryEmailDeliveryRepository deliveryRepository;

    @Autowired
    private InquiryEmailDeliveryProcessor processor;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @BeforeEach
    void clean() {
        deliveryRepository.deleteAll();
        inquiryRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void pendingDeliveryCanBeClaimedOnlyOnce() {
        Long deliveryId = savePendingDelivery();

        var first = processor.claim(deliveryId);
        var second = processor.claim(deliveryId);

        assertThat(first).isPresent();
        assertThat(second).isEmpty();
        assertThat(deliveryRepository.findById(deliveryId).orElseThrow().getProcessingStartedAt())
                .isNotNull();
    }

    @Test
    void startupRecoveryReleasesStaleClaimAndReturnsPendingId() {
        Long deliveryId = savePendingDelivery();
        assertThat(processor.claim(deliveryId)).isPresent();

        var recoveredIds = processor.recoverPendingIds();

        assertThat(recoveredIds).containsExactly(deliveryId);
        assertThat(processor.claim(deliveryId)).isPresent();
    }

    @Test
    void rejectedExecutorMarksUnclaimedPendingDeliveryFailed() {
        Long deliveryId = savePendingDelivery();

        processor.markQueueRejected(deliveryId);

        InquiryEmailDelivery delivery = deliveryRepository.findById(deliveryId).orElseThrow();
        assertThat(delivery.getStatus()).isEqualTo(InquiryEmailDelivery.Status.FAILED);
        assertThat(delivery.getAttemptCount()).isEqualTo(1);
        assertThat(delivery.getLastError()).isEqualTo("메일 발송 작업 큐가 가득 찼습니다.");
    }

    @Test
    void retryClaimUsesOriginalTextAndHtmlSnapshot() {
        Long deliveryId = savePendingHtmlDelivery();
        InquiryEmailDeliveryProcessor.ClaimedDelivery first = processor.claim(deliveryId).orElseThrow();
        processor.markFailed(deliveryId, "첫 발송 실패");
        Integer retryClaimed = new TransactionTemplate(transactionManager)
                .execute(status -> deliveryRepository.claimFailedForRetry(deliveryId));
        assertThat(retryClaimed).isEqualTo(1);

        InquiryEmailDeliveryProcessor.ClaimedDelivery retried = processor.claim(deliveryId).orElseThrow();

        assertThat(first.body()).isEqualTo("텍스트 스냅샷");
        assertThat(first.htmlBody()).isEqualTo("<p>HTML 스냅샷</p>");
        assertThat(retried.body()).isEqualTo(first.body());
        assertThat(retried.htmlBody()).isEqualTo(first.htmlBody());
    }

    private Long savePendingDelivery() {
        return savePendingDelivery("본문", null);
    }

    private Long savePendingHtmlDelivery() {
        return savePendingDelivery("텍스트 스냅샷", "<p>HTML 스냅샷</p>");
    }

    private Long savePendingDelivery(String body, String htmlBody) {
        User user = userRepository.save(User.builder()
                .email("user-" + System.nanoTime() + "@tpmp.com")
                .password("pw")
                .name("사용자")
                .role(User.Role.USER)
                .build());
        Inquiry inquiry = inquiryRepository.save(Inquiry.builder()
                .user(user)
                .title("문의 제목")
                .content("문의 본문")
                .requestType(Inquiry.RequestType.GENERAL_INQUIRY)
                .build());
        return deliveryRepository.save(InquiryEmailDelivery.pending(
                inquiry,
                null,
                InquiryEmailDelivery.EventType.NEW_INQUIRY,
                "admin@tpmp.com",
                "[TPMP] 문의",
                body,
                htmlBody
        )).getId();
    }
}
