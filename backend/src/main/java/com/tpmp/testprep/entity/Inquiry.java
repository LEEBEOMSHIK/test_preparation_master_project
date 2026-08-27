package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "inquiries")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Inquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false)
    private RequestType requestType = RequestType.OTHER;

    @Column(name = "target_area", length = 100)
    private String targetArea;

    @Column(name = "detail_location", length = 500)
    private String detailLocation;

    @Column(name = "image_urls", columnDefinition = "TEXT")
    private String imageUrls; // comma-separated URLs (max 3)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @Builder
    public Inquiry(User user, String title, String content, RequestType requestType,
                   String targetArea, String detailLocation, String imageUrls) {
        this.user = user;
        this.title = title;
        this.content = content;
        this.requestType = requestType != null ? requestType : RequestType.OTHER;
        this.targetArea = targetArea;
        this.detailLocation = detailLocation;
        this.imageUrls = imageUrls;
        this.status = Status.PENDING;
    }

    public boolean isClosed() {
        return status.isClosed();
    }

    public boolean canTransitionTo(Status target) {
        if (target == null) {
            return false;
        }
        if (status.isClosed()) {
            return target == Status.IN_PROGRESS;
        }
        if (!target.isClosed()) {
            return true;
        }
        return target == Status.ANSWERED
                ? requestType.usesAnswerCompletion()
                : !requestType.usesAnswerCompletion();
    }

    public void changeStatus(Status target) {
        if (!canTransitionTo(target)) {
            throw new IllegalStateException("INVALID_INQUIRY_STATUS_TRANSITION");
        }
        this.status = target;
    }

    public void reopen() {
        changeStatus(Status.IN_PROGRESS);
    }

    public enum Status {
        PENDING, IN_PROGRESS, ON_HOLD, ANSWERED, COMPLETED, UNABLE_TO_PROCESS;

        public boolean isClosed() {
            return this == ANSWERED || this == COMPLETED || this == UNABLE_TO_PROCESS;
        }
    }

    public enum RequestType {
        GENERAL_INQUIRY, BUG_REPORT, EXAM_OPENING_REQUEST, FEATURE_REQUEST, OTHER;

        public boolean usesAnswerCompletion() {
            return this == GENERAL_INQUIRY || this == OTHER;
        }
    }

}
