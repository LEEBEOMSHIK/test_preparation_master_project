package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_question_bookmarks",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "question_bank_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserQuestionBookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_bank_id", nullable = false)
    private QuestionBank questionBank;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @Builder
    public UserQuestionBookmark(User user, QuestionBank questionBank) {
        this.user = user;
        this.questionBank = questionBank;
    }
}
