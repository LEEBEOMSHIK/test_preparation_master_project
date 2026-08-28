package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.InquiryEmailDelivery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface InquiryEmailDeliveryRepository extends JpaRepository<InquiryEmailDelivery, Long> {
    Page<InquiryEmailDelivery> findByInquiryIdOrderByCreatedAtDesc(Long inquiryId, Pageable pageable);
    Page<InquiryEmailDelivery> findByStatusOrderByCreatedAtDesc(InquiryEmailDelivery.Status status, Pageable pageable);
    Page<InquiryEmailDelivery> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update InquiryEmailDelivery delivery set delivery.status = :pending, delivery.lastError = null, delivery.sentAt = null "
            + "where delivery.id = :id and delivery.status = :failed")
    int claimFailedForRetry(@Param("id") Long id, @Param("pending") InquiryEmailDelivery.Status pending,
                            @Param("failed") InquiryEmailDelivery.Status failed);

    default int claimFailedForRetry(Long id) {
        return claimFailedForRetry(id, InquiryEmailDelivery.Status.PENDING, InquiryEmailDelivery.Status.FAILED);
    }

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update InquiryEmailDelivery delivery set delivery.processingStartedAt = :startedAt "
            + "where delivery.id = :id and delivery.status = :pending and delivery.processingStartedAt is null")
    int claimPendingForDispatch(@Param("id") Long id,
                                @Param("pending") InquiryEmailDelivery.Status pending,
                                @Param("startedAt") LocalDateTime startedAt);

    default int claimPendingForDispatch(Long id, LocalDateTime startedAt) {
        return claimPendingForDispatch(id, InquiryEmailDelivery.Status.PENDING, startedAt);
    }

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update InquiryEmailDelivery delivery set delivery.processingStartedAt = null "
            + "where delivery.status = :pending and delivery.processingStartedAt is not null")
    int releasePendingClaims(@Param("pending") InquiryEmailDelivery.Status pending);

    default int releasePendingClaims() {
        return releasePendingClaims(InquiryEmailDelivery.Status.PENDING);
    }

    @Query("select delivery.id from InquiryEmailDelivery delivery "
            + "where delivery.status = :pending and delivery.processingStartedAt is null "
            + "order by delivery.createdAt asc, delivery.id asc")
    List<Long> findPendingIds(@Param("pending") InquiryEmailDelivery.Status pending);

    default List<Long> findPendingIds() {
        return findPendingIds(InquiryEmailDelivery.Status.PENDING);
    }

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update InquiryEmailDelivery delivery set delivery.status = :failed, "
            + "delivery.attemptCount = delivery.attemptCount + 1, delivery.lastError = :error "
            + "where delivery.id = :id and delivery.status = :pending and delivery.processingStartedAt is null")
    int markQueueRejected(@Param("id") Long id,
                          @Param("pending") InquiryEmailDelivery.Status pending,
                          @Param("failed") InquiryEmailDelivery.Status failed,
                          @Param("error") String error);

    default int markQueueRejected(Long id, String error) {
        return markQueueRejected(id, InquiryEmailDelivery.Status.PENDING, InquiryEmailDelivery.Status.FAILED, error);
    }
}
