package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_history", indexes = {
    @Index(name = "idx_exam_history_user_id", columnList = "user_id"),
    @Index(name = "idx_exam_history_examination_id", columnList = "examination_id"),
    @Index(name = "idx_exam_history_taken_at", columnList = "taken_at")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ExamHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examination_id", nullable = false)
    private Examination examination;

    @Column(name = "total_questions", nullable = false)
    private int totalQuestions;

    @Column(name = "correct_count", nullable = false)
    private int correctCount;

    @Column(nullable = false)
    private double score; // 0.0 ~ 100.0 (백분율)

    @Column(name = "taken_at", nullable = false, updatable = false)
    private LocalDateTime takenAt;

    @PrePersist
    protected void onCreate() {
        this.takenAt = LocalDateTime.now();
    }

    @Builder
    public ExamHistory(User user, Examination examination, int totalQuestions, int correctCount, double score) {
        this.user = user;
        this.examination = examination;
        this.totalQuestions = totalQuestions;
        this.correctCount = correctCount;
        this.score = score;
    }
}
