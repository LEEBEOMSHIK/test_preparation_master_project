package com.tpmp.testprep.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_template_bindings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmailTemplateBinding {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "event_code", length = 80)
    private EmailTemplateEvent eventCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private EmailTemplate template;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_admin_id")
    private User createdByAdmin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_admin_id")
    private User updatedByAdmin;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static EmailTemplateBinding create(EmailTemplateEvent eventCode, EmailTemplate template, User admin) {
        EmailTemplateBinding binding = new EmailTemplateBinding();
        binding.eventCode = eventCode;
        binding.template = template;
        binding.createdByAdmin = admin;
        binding.updatedByAdmin = admin;
        return binding;
    }

    public void changeTemplate(EmailTemplate template, User admin) {
        this.template = template;
        this.updatedByAdmin = admin;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
