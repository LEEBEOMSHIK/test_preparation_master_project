package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "practice_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PracticeHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false, length = 100)
    private String userEmail;

    @Column(name = "sql_content", nullable = false, columnDefinition = "TEXT")
    private String sqlContent;

    /** SELECT / INSERT / UPDATE / DELETE / CREATE / DROP / ALTER / ERROR */
    @Column(name = "result_type", length = 20)
    private String resultType;

    @Column(name = "row_count")
    private Integer rowCount;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    /** postgresql / mysql / oracle */
    @Column(name = "dialect", length = 20)
    private String dialect;

    @Column(name = "executed_at", nullable = false)
    private LocalDateTime executedAt;

    @Builder
    public PracticeHistory(String userEmail, String sqlContent, String resultType,
                           Integer rowCount, String errorMessage, String dialect) {
        this.userEmail = userEmail;
        this.sqlContent = sqlContent;
        this.resultType = resultType;
        this.rowCount = rowCount;
        this.errorMessage = errorMessage;
        this.dialect = dialect;
        this.executedAt = LocalDateTime.now();
    }
}
