package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;

@Entity
@Table(name = "exam_history_details")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class ExamHistoryDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_history_id", nullable = false)
    private ExamHistory examHistory;

    /** 참조용 question_id — DB FK 제약 없이 Long 필드만 */
    @Column(name = "question_id")
    private Long questionId;

    @Column(nullable = false)
    private int seq;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "question_type", nullable = false)
    private String questionType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> options;

    @Column(name = "user_answer", length = 500)
    private String userAnswer;

    @Column(name = "correct_answer", length = 500)
    private String correctAnswer;

    @Column(nullable = false)
    private boolean correct;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(columnDefinition = "TEXT")
    private String code;

    @Column(length = 20)
    private String language;

    /** ExamHistory.addDetail() 에서 양방향 연관 세팅을 위해 패키지 가시성으로 제공 */
    void setExamHistory(ExamHistory examHistory) {
        this.examHistory = examHistory;
    }
}
