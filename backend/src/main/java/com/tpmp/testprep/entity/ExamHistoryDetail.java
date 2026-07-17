package com.tpmp.testprep.entity;

import com.tpmp.testprep.entity.support.SchedulingData;
import com.tpmp.testprep.entity.support.SqlData;
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

    /** 제출 시점 원본 문제은행 ID 스냅샷 — DB FK 제약 없이 nullable Long 필드만 */
    @Column(name = "question_bank_id")
    private Long questionBankId;

    @Column(nullable = false)
    private int seq;

    /** 제출 시점 원본 문항 제목 스냅샷. 원본 연결이 없는 수동 시험지 문항은 null. */
    @Column(length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(columnDefinition = "TEXT")
    private String instruction;

    @Column(name = "question_type", nullable = false)
    private String questionType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> options;

    @Column(name = "user_answer", columnDefinition = "TEXT")
    private String userAnswer;

    @Column(name = "correct_answer", columnDefinition = "TEXT")
    private String correctAnswer;

    @Column(nullable = false)
    private boolean correct;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(columnDefinition = "TEXT")
    private String code;

    @Column(length = 20)
    private String language;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "scheduling_data", columnDefinition = "jsonb")
    private SchedulingData schedulingData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sql_data", columnDefinition = "jsonb")
    private SqlData sqlData;

    /** 문항 카테고리명 스냅샷 (채점 시점 비정규화 — FK 없이 String) */
    @Column(name = "category_name", length = 100)
    private String categoryName;

    /** ExamHistory.addDetail() 에서 양방향 연관 세팅을 위해 패키지 가시성으로 제공 */
    void setExamHistory(ExamHistory examHistory) {
        this.examHistory = examHistory;
    }
}
