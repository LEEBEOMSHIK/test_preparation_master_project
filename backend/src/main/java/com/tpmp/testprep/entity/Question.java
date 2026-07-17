package com.tpmp.testprep.entity;

import com.tpmp.testprep.entity.support.SchedulingData;
import com.tpmp.testprep.entity.support.SqlData;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import com.tpmp.testprep.entity.DomainSlave;

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

    /** 문항 풀 원본 링크. Question은 출제용 스냅샷이며 원본 변경은 자동 전파하지 않는다. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_question_bank_id")
    private QuestionBank sourceQuestionBank;

    @Column(nullable = false)
    private Integer seq;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /** 발문(지시문) 스냅샷 */
    @Column(columnDefinition = "TEXT")
    private String instruction;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false)
    private QuestionType questionType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> options;

    @Column(columnDefinition = "TEXT")
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

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "scheduling_data", columnDefinition = "jsonb")
    private SchedulingData schedulingData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sql_data", columnDefinition = "jsonb")
    private SqlData sqlData;

    /** 문항 카테고리 (DomainSlave, nullable) — 채점 스냅샷 집계에 활용 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private DomainSlave category;

    @Builder
    public Question(Exam exam, QuestionBank sourceQuestionBank, Integer seq, String instruction,
                    String content, QuestionType questionType,
                    List<String> options, String answer, String explanation,
                    String sourceFile, String code, String language, DomainSlave category,
                    SchedulingData schedulingData, SqlData sqlData) {
        this.exam = exam;
        this.sourceQuestionBank = sourceQuestionBank;
        this.seq = seq;
        this.instruction = instruction;
        this.content = content;
        this.questionType = questionType;
        this.options = options;
        this.answer = answer;
        this.explanation = explanation;
        this.sourceFile = sourceFile;
        this.code = code;
        this.language = language;
        this.category = category;
        this.schedulingData = schedulingData;
        this.sqlData = sqlData;
    }

    public void update(String instruction, String content, QuestionType questionType,
                       List<String> options, String answer, String explanation,
                       String code, String language, DomainSlave category,
                       QuestionBank sourceQuestionBank, SchedulingData schedulingData, SqlData sqlData) {
        this.instruction = instruction;
        this.content = content;
        this.questionType = questionType;
        this.options = options;
        this.answer = answer;
        this.explanation = explanation;
        this.code = code;
        this.language = language;
        this.category = category;
        this.sourceQuestionBank = sourceQuestionBank;
        this.schedulingData = schedulingData;
        this.sqlData = sqlData;
    }

    /** 원본 문항을 명시적으로 동기화한다. 정답은 별도 승인 시에만 덮어쓴다. */
    public void syncFrom(QuestionBank source, boolean applyAnswer) {
        this.sourceQuestionBank = source;
        this.instruction = source.getInstruction();
        this.content = source.getContent();
        this.questionType = QuestionType.valueOf(source.getQuestionType().name());
        this.options = source.getOptions();
        if (applyAnswer) this.answer = source.getAnswer();
        this.explanation = source.getExplanation();
        this.code = source.getCode();
        this.language = source.getLanguage();
        this.category = source.getCategory();
        this.schedulingData = source.getSchedulingData();
        this.sqlData = source.getSqlData();
    }

    /** 제출 결과와 이력에 사용할 원본 문항 제목. 원본 연결이 없는 수동 문항은 null이다. */
    public String getResultTitle() {
        return sourceQuestionBank != null ? sourceQuestionBank.getTitle() : null;
    }

    /** 제출 결과와 이력에 사용할 원본 문제은행 ID. 원본 연결이 없는 수동 문항은 null이다. */
    public Long getSourceQuestionBankId() {
        return sourceQuestionBank != null ? sourceQuestionBank.getId() : null;
    }

    public enum QuestionType {
        MULTIPLE_CHOICE, SHORT_ANSWER, OX, CODE, SCHEDULING, SQL
    }
}
