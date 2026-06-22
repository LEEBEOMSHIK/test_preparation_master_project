package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_history", indexes = {
    @Index(name = "idx_quiz_history_user_id", columnList = "user_id"),
    @Index(name = "idx_quiz_history_created_at", columnList = "created_at"),
    @Index(name = "idx_quiz_history_category_id", columnList = "category_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuizHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** 문항 풀 ID (FK 제약 없음 — 문항 삭제 시에도 이력 유지) */
    @Column(name = "question_bank_id")
    private Long questionBankId;

    /** 카테고리 ID (채점 시점 비정규화, nullable) */
    @Column(name = "category_id")
    private Long categoryId;

    /** 도메인 이름 (채점 시점 비정규화 보존, nullable) */
    @Column(name = "domain_name", length = 100)
    private String domainName;

    /** 문항 유형 (예: MULTIPLE_CHOICE, SHORT_ANSWER ...) */
    @Column(name = "question_type", length = 30, nullable = false)
    private String questionType;

    /** 사용자 제출 답안 (nullable — 시간 초과 등 미제출 경우 허용) */
    @Column(name = "user_answer", length = 500)
    private String userAnswer;

    /** 정오 여부 */
    @Column(nullable = false)
    private boolean correct;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @Builder
    public QuizHistory(User user, Long questionBankId, Long categoryId,
                       String domainName, String questionType,
                       String userAnswer, boolean correct) {
        this.user = user;
        this.questionBankId = questionBankId;
        this.categoryId = categoryId;
        this.domainName = domainName;
        this.questionType = questionType;
        this.userAnswer = userAnswer;
        this.correct = correct;
    }
}
