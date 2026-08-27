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

    @Transient
    private String reply;

    @Transient
    private LocalDateTime repliedAt;

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

    /** 기존 API 이행 기간 동안의 호환용 유형 조회. */
    @Deprecated
    public InquiryType getInquiryType() {
        return InquiryType.fromRequestType(requestType);
    }

    public void reply(String reply) {
        this.reply = reply;
        this.status = requestType.usesAnswerCompletion() ? Status.ANSWERED : Status.COMPLETED;
        this.repliedAt = LocalDateTime.now();
    }

    public void toggleHold() {
        if (this.status == Status.ON_HOLD) {
            this.status = Status.PENDING;
        } else if (!this.status.isClosed()) {
            this.status = Status.ON_HOLD;
        }
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

    /** Task 2 API 이관 전 기존 요청·대시보드 호출을 컴파일 호환하기 위한 레거시 값이다. */
    @Deprecated
    public enum InquiryType {
        EXAM, CONCEPT_NOTE, DAILY_QUIZ, PRACTICE, BUG, OTHER;

        RequestType toRequestType() {
            return switch (this) {
                case BUG -> RequestType.BUG_REPORT;
                case OTHER -> RequestType.OTHER;
                case EXAM, CONCEPT_NOTE, DAILY_QUIZ, PRACTICE -> RequestType.GENERAL_INQUIRY;
            };
        }

        static InquiryType fromRequestType(RequestType requestType) {
            return switch (requestType) {
                case BUG_REPORT -> BUG;
                case OTHER -> OTHER;
                case GENERAL_INQUIRY, EXAM_OPENING_REQUEST, FEATURE_REQUEST -> EXAM;
            };
        }
    }

    public static class InquiryBuilder {
        /** 기존 API 이행 기간 동안의 호환용 빌더 입력. */
        @Deprecated
        public InquiryBuilder inquiryType(InquiryType inquiryType) {
            this.requestType = inquiryType != null ? inquiryType.toRequestType() : RequestType.OTHER;
            return this;
        }
    }
}
