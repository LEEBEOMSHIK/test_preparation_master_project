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
    @Column(name = "inquiry_type", nullable = false)
    private InquiryType inquiryType = InquiryType.OTHER;

    @Column(name = "image_urls", columnDefinition = "TEXT")
    private String imageUrls; // comma-separated URLs (max 3)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Column(columnDefinition = "TEXT")
    private String reply;

    @Column(name = "replied_at")
    private LocalDateTime repliedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @Builder
    public Inquiry(User user, String title, String content, InquiryType inquiryType, String imageUrls) {
        this.user = user;
        this.title = title;
        this.content = content;
        this.inquiryType = inquiryType != null ? inquiryType : InquiryType.OTHER;
        this.imageUrls = imageUrls;
        this.status = Status.PENDING;
    }

    public void reply(String reply) {
        this.reply = reply;
        this.status = Status.ANSWERED;
        this.repliedAt = LocalDateTime.now();
    }

    public void toggleHold() {
        if (this.status == Status.ON_HOLD) {
            this.status = Status.PENDING;
        } else if (this.status == Status.PENDING) {
            this.status = Status.ON_HOLD;
        }
    }

    public enum Status {
        PENDING, ON_HOLD, ANSWERED
    }

    public enum InquiryType {
        EXAM, CONCEPT_NOTE, DAILY_QUIZ, OTHER
    }
}
