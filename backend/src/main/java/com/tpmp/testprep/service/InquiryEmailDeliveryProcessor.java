package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.InquiryEmailDelivery;
import com.tpmp.testprep.repository.InquiryEmailDeliveryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InquiryEmailDeliveryProcessor {
    private static final String QUEUE_REJECTED_ERROR = "메일 발송 작업 큐가 가득 찼습니다.";

    private final InquiryEmailDeliveryRepository deliveryRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Optional<ClaimedDelivery> claim(Long deliveryId) {
        if (deliveryRepository.claimPendingForDispatch(deliveryId, LocalDateTime.now()) != 1) {
            return Optional.empty();
        }
        return deliveryRepository.findById(deliveryId).map(ClaimedDelivery::from);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markSent(Long deliveryId) {
        deliveryRepository.findById(deliveryId)
                .filter(delivery -> delivery.getStatus() == InquiryEmailDelivery.Status.PENDING)
                .filter(delivery -> delivery.getProcessingStartedAt() != null)
                .ifPresent(InquiryEmailDelivery::markSent);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(Long deliveryId, String error) {
        deliveryRepository.findById(deliveryId)
                .filter(delivery -> delivery.getStatus() == InquiryEmailDelivery.Status.PENDING)
                .filter(delivery -> delivery.getProcessingStartedAt() != null)
                .ifPresent(delivery -> delivery.markFailed(error));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markQueueRejected(Long deliveryId) {
        deliveryRepository.markQueueRejected(deliveryId, QUEUE_REJECTED_ERROR);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public List<Long> recoverPendingIds() {
        deliveryRepository.releasePendingClaims();
        return deliveryRepository.findPendingIds();
    }

    public record ClaimedDelivery(Long id, String recipientEmail, String subject, String body, String htmlBody) {
        private static ClaimedDelivery from(InquiryEmailDelivery delivery) {
            return new ClaimedDelivery(
                    delivery.getId(),
                    delivery.getRecipientEmail(),
                    delivery.getSubject(),
                    delivery.getBody(),
                    delivery.getHtmlBody()
            );
        }
    }
}
