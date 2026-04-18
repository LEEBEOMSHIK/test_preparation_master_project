package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;

@Entity
@Table(name = "questions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(nullable = false)
    private Integer seq;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false)
    private QuestionType questionType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> options;

    @Column(nullable = false)
    private String answer;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "source_file")
    private String sourceFile;

    @Builder
    public Question(Exam exam, Integer seq, String content, QuestionType questionType,
                    List<String> options, String answer, String explanation, String sourceFile) {
        this.exam = exam;
        this.seq = seq;
        this.content = content;
        this.questionType = questionType;
        this.options = options;
        this.answer = answer;
        this.explanation = explanation;
        this.sourceFile = sourceFile;
    }

    public enum QuestionType {
        MULTIPLE_CHOICE, SHORT_ANSWER, OX
    }
}
