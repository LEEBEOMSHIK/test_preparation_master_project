package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.InquiryNotificationRecipient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InquiryNotificationRecipientRepository extends JpaRepository<InquiryNotificationRecipient, Long> {
}
