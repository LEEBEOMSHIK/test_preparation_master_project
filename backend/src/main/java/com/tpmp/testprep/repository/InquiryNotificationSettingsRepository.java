package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.InquiryNotificationSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InquiryNotificationSettingsRepository extends JpaRepository<InquiryNotificationSettings, Long> {
    Optional<InquiryNotificationSettings> findFirstByOrderByIdAsc();
}
