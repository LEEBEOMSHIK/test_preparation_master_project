package com.tpmp.testprep.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "inquiry_notification_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InquiryNotificationSettings {
    public static final long SINGLETON_ID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "settings", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<InquiryNotificationRecipient> recipients = new ArrayList<>();

    private InquiryNotificationSettings(boolean enabled) {
        this.enabled = enabled;
    }

    public static InquiryNotificationSettings create(boolean enabled) {
        return new InquiryNotificationSettings(enabled);
    }

    public void update(boolean enabled) {
        this.enabled = enabled;
    }

    public void replaceRecipients(List<String> emails) {
        recipients.clear();
        emails.forEach(email -> recipients.add(InquiryNotificationRecipient.create(this, email)));
    }

    @PrePersist
    @PreUpdate
    protected void updateTimestamp() {
        updatedAt = LocalDateTime.now();
    }
}
