package com.tpmp.testprep.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
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
@Table(name = "email_templates")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmailTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Scope scope;

    @Column(name = "subject_template", nullable = false, length = 200)
    private String subjectTemplate;

    @Column(name = "html_body", nullable = false, columnDefinition = "TEXT")
    private String htmlBody;

    @Column(name = "text_body", nullable = false, columnDefinition = "TEXT")
    private String textBody;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "system_key", unique = true, length = 80)
    private String systemKey;

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

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deleted_by_admin_id")
    private User deletedByAdmin;

    public static EmailTemplate create(String name, Scope scope, String subjectTemplate,
                                       String htmlBody, String textBody, boolean active,
                                       String systemKey, User admin) {
        EmailTemplate template = new EmailTemplate();
        template.name = name;
        template.scope = scope;
        template.subjectTemplate = subjectTemplate;
        template.htmlBody = htmlBody;
        template.textBody = textBody;
        template.active = active;
        template.systemKey = systemKey;
        template.createdByAdmin = admin;
        template.updatedByAdmin = admin;
        return template;
    }

    public void update(String name, String subjectTemplate, String htmlBody,
                       String textBody, boolean active, User admin) {
        this.name = name;
        this.subjectTemplate = subjectTemplate;
        this.htmlBody = htmlBody;
        this.textBody = textBody;
        this.active = active;
        this.updatedByAdmin = admin;
    }

    public EmailTemplate duplicate(String copiedName, User admin) {
        return create(copiedName, scope, subjectTemplate, htmlBody, textBody, active, null, admin);
    }

    public void reset(String name, String subjectTemplate, String htmlBody, String textBody, User admin) {
        update(name, subjectTemplate, htmlBody, textBody, true, admin);
    }

    public void softDelete(User admin) {
        deletedAt = LocalDateTime.now();
        deletedByAdmin = admin;
        updatedByAdmin = admin;
        active = false;
    }

    public boolean isDeleted() {
        return deletedAt != null;
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

    public enum Scope {
        INQUIRY_STATUS
    }
}
