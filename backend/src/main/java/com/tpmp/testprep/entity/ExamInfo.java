package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "exam_info")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ExamInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String examType;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "application_period", length = 300)
    private String applicationPeriod;

    @Column(name = "exam_schedule", length = 300)
    private String examSchedule;

    @Column(name = "result_date", length = 300)
    private String resultDate;

    @Column(name = "official_url", length = 500)
    private String officialUrl;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Builder
    public ExamInfo(String examType, String title, String description,
                    String applicationPeriod, String examSchedule, String resultDate,
                    String officialUrl, boolean isActive, int displayOrder) {
        this.examType = examType;
        this.title = title;
        this.description = description;
        this.applicationPeriod = applicationPeriod;
        this.examSchedule = examSchedule;
        this.resultDate = resultDate;
        this.officialUrl = officialUrl;
        this.isActive = isActive;
        this.displayOrder = displayOrder;
    }

    public void update(String examType, String title, String description,
                       String applicationPeriod, String examSchedule, String resultDate,
                       String officialUrl, boolean isActive, int displayOrder) {
        this.examType = examType;
        this.title = title;
        this.description = description;
        this.applicationPeriod = applicationPeriod;
        this.examSchedule = examSchedule;
        this.resultDate = resultDate;
        this.officialUrl = officialUrl;
        this.isActive = isActive;
        this.displayOrder = displayOrder;
    }
}
