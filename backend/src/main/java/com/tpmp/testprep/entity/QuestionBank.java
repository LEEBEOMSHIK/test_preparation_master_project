package com.tpmp.testprep.entity;

import com.tpmp.testprep.entity.support.SchedulingData;
import com.tpmp.testprep.entity.support.SqlData;
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

    /** 문항 제목 (관리용, 선택) */
    @Column(length = 200)
    private String title;

    /** 시험 연도 (선택, 예: 2024) */
    @Column(name = "exam_year")
    private Integer examYear;

    /** 시험 회차 (선택, 예: 1) */
    @Column(name = "exam_round")
    private Integer examRound;

    /** 원본 시험지의 문항번호 (선택, 예: 1) */
    @Column(name = "question_no")
    private Integer questionNo;

    /** 발문(지시문) — "다음 설명을 보고 알맞은 용어를 작성하시오." 처럼 문제 풀이 방식을 안내하는 문구.
     *  문항 내용(content, 문제 본문)과 분리 저장되며, 모든 문항 유형 공용(선택) 필드다. */
    @Column(columnDefinition = "TEXT")
    private String instruction;

    /** 문항 내용 (문제 본문) — DB 컬럼은 NOT NULL이므로 null 입력 시 빈 문자열로 저장한다(coalesce).
     *  발문(instruction)과 함께 "둘 중 하나는 필수" 규칙은 서비스단(QuestionBankService#validateBody)에서 검증하며,
     *  이 필드 자체는 선택(nullable 입력 허용, 저장 시 빈 문자열 처리)이다. */
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_type_id")
    private DomainSlave examType;

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

    /** AI 분석 — 핵심 키워드 목록 */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_keywords", columnDefinition = "jsonb")
    private List<String> aiKeywords;

    /** AI 분석 — 도메인 목록 */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_domains", columnDefinition = "jsonb")
    private List<String> aiDomains;

    /** AI 분석 — 난이도 (하/중/상) */
    @Column(name = "ai_difficulty", length = 10)
    private String aiDifficulty;

    /** AI 분석 — 문항 요약 */
    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    /** CPU 스케줄링 구조화 문항 데이터 (SCHEDULING 유형에서만 사용) */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "scheduling_data", columnDefinition = "jsonb")
    private SchedulingData schedulingData;

    /** SQL 구조화 문항 데이터 (SQL 유형에서만 사용) */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sql_data", columnDefinition = "jsonb")
    private SqlData sqlData;

    @Builder
    public QuestionBank(String title, Integer examYear, Integer examRound, Integer questionNo,
                        String content, QuestionType questionType,
                        DomainSlave category, DomainSlave examType,
                        List<String> options, String answer,
                        String code, String language,
                        String explanation,
                        List<String> aiKeywords, List<String> aiDomains,
                        String aiDifficulty, String aiSummary,
                        SchedulingData schedulingData,
                        SqlData sqlData,
                        String instruction,
                        Long createdByUno) {
        this.title = title;
        this.examYear = examYear;
        this.examRound = examRound;
        this.questionNo = questionNo;
        this.content = content == null ? "" : content;
        this.questionType = questionType;
        this.category = category;
        this.examType = examType;
        this.options = options;
        this.answer = answer;
        this.code = code;
        this.language = language;
        this.explanation = explanation;
        this.aiKeywords = aiKeywords;
        this.aiDomains = aiDomains;
        this.aiDifficulty = aiDifficulty;
        this.aiSummary = aiSummary;
        this.schedulingData = schedulingData;
        this.sqlData = sqlData;
        this.instruction = instruction;
        initAudit(createdByUno);
    }

    public void update(String title, Integer examYear, Integer examRound, Integer questionNo,
                       String content, QuestionType questionType,
                       DomainSlave category, DomainSlave examType,
                       List<String> options, String answer,
                       String code, String language,
                       String explanation,
                       List<String> aiKeywords, List<String> aiDomains,
                       String aiDifficulty, String aiSummary,
                       SchedulingData schedulingData,
                       SqlData sqlData,
                       String instruction,
                       Long modifiedByUno) {
        this.title = title;
        this.examYear = examYear;
        this.examRound = examRound;
        this.questionNo = questionNo;
        this.content = content == null ? "" : content;
        this.questionType = questionType;
        this.category = category;
        this.examType = examType;
        this.options = options;
        this.answer = answer;
        this.code = code;
        this.language = language;
        this.explanation = explanation;
        this.aiKeywords = aiKeywords;
        this.aiDomains = aiDomains;
        this.aiDifficulty = aiDifficulty;
        this.aiSummary = aiSummary;
        this.schedulingData = schedulingData;
        this.sqlData = sqlData;
        this.instruction = instruction;
        updateAudit(modifiedByUno);
    }

    /**
     * AI 분석 결과 즉시 저장 전용 — 4개 ai_* 컬럼만 갱신한다.
     * 재분석 시 호출되어 기존값을 덮어쓴다.
     */
    public void updateAnalysis(List<String> keywords, List<String> domains,
                               String difficulty, String summary,
                               Long modifiedByUno) {
        this.aiKeywords = keywords;
        this.aiDomains = domains;
        this.aiDifficulty = difficulty;
        this.aiSummary = summary;
        updateAudit(modifiedByUno);
    }

    public enum QuestionType {
        MULTIPLE_CHOICE, SHORT_ANSWER, OX, CODE, SCHEDULING, SQL
    }
}
