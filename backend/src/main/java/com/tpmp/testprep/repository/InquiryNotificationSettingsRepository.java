package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.InquiryNotificationSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InquiryNotificationSettingsRepository extends JpaRepository<InquiryNotificationSettings, Long> {
    @Modifying(flushAutomatically = true)
    @Query(value = "insert into inquiry_notification_settings (id, enabled, updated_at) values (1, :enabled, current_timestamp) "
            + "on conflict (id) do update set enabled = excluded.enabled, updated_at = excluded.updated_at", nativeQuery = true)
    void upsertSingleton(@Param("enabled") boolean enabled);
}
