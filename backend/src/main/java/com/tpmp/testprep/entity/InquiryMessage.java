package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "inquiry_messages")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InquiryMessage {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inquiry_id", nullable = false)
    private Inquiry inquiry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(name = "author_role", nullable = false, length = 20)
    private AuthorRole authorRole;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    @Builder
    public InquiryMessage(Inquiry inquiry, User author, AuthorRole authorRole, String content) {
        this.inquiry = inquiry;
        this.author = author;
        this.authorRole = authorRole;
        this.content = content;
    }

    public enum AuthorRole { USER, ADMIN, SYSTEM }
}
