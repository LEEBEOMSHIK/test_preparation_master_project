package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;

/**
 * 글로벌 문항 풀 — 시험지에 종속되지 않는 독립 문항 엔티티.
 * <p>
 * 관리자가 등록한 문항을 보관하며, 시험지 생성 시 이 풀에서 문항을 선택해 추가한다.
 * BaseEntity(공통 컬럼)를 상속받으며 소프트 삭제(del_yn)를 지원한다.
 * </p>
 */
@Entity
@Table(name = "question_bank")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuestionBank extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 문항 내용 (문제 본문) */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /** 문항 유형 */
    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 30)
    private QuestionType questionType;

    /** 카테고리 (도메인 슬레이브) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private DomainSlave category;

    /** 객관식 보기 목록 (MULTIPLE_CHOICE 유형에서만 사용) */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> options;

    /** 정답 */
    @Column(columnDefinition = "TEXT")
    private String answer;

    /** 코드 문항의 코드 본문 (CODE 유형에서만 사용) */
    @Column(columnDefinition = "TEXT")
    private String code;

    /** 코드 언어 (javascript, python, java ...) */
    @Column(length = 50)
    private String language;

    /** 해설 */
    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Builder
    public QuestionBank(String content, QuestionType questionType,
                        DomainSlave category,
                        List<String> options, String answer,
                        String code, String language,
                        String explanation, Long createdByUno) {
        this.content = content;
        this.questionType = questionType;
        this.category = category;
        this.options = options;
        this.answer = answer;
        this.code = code;
        this.language = language;
        this.explanation = explanation;
        initAudit(createdByUno);
    }

    public void update(String content, QuestionType questionType,
                       DomainSlave category,
                       List<String> options, String answer,
                       String code, String language,
                       String explanation, Long modifiedByUno) {
        this.content = content;
        this.questionType = questionType;
        this.category = category;
        this.options = options;
        this.answer = answer;
        this.code = code;
        this.language = language;
        this.explanation = explanation;
        updateAudit(modifiedByUno);
    }

    public enum QuestionType {
        MULTIPLE_CHOICE, SHORT_ANSWER, OX, CODE
    }
}
