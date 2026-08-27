package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.InquiryEmailDelivery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}
