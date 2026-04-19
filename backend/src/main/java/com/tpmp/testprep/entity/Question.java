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

    @Column
    private String answer;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "source_file")
    private String sourceFile;

    /** 코드 문항의 코드 본문 (CODE 유형에서만 사용) */
    @Column(columnDefinition = "TEXT")
    private String code;

    /** 코드 언어 (javascript, python, java ...) */
    @Column(length = 20)
    private String language;

    @Builder
    public Question(Exam exam, Integer seq, String content, QuestionType questionType,
                    List<String> options, String answer, String explanation,
                    String sourceFile, String code, String language) {
        this.exam = exam;
        this.seq = seq;
        this.content = content;
        this.questionType = questionType;
        this.options = options;
        this.answer = answer;
        this.explanation = explanation;
        this.sourceFile = sourceFile;
        this.code = code;
        this.language = language;
    }

    public void update(String content, QuestionType questionType,
                       List<String> options, String answer, String explanation,
                       String code, String language) {
        this.content = content;
        this.questionType = questionType;
        this.options = options;
        this.answer = answer;
        this.explanation = explanation;
        this.code = code;
        this.language = language;
    }

    public enum QuestionType {
        MULTIPLE_CHOICE, SHORT_ANSWER, OX, CODE
    }
}
