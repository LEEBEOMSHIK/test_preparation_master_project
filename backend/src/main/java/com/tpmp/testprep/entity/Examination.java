package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 시험 엔티티.
 * 하나의 시험지(Exam)를 사용해 실제로 응시하는 시험을 정의한다.
 * - 시험 유형(카테고리), 제한 시간을 포함하며 출제 방식은 시험지에서 결정한다.
 */
@Entity
@Table(name = "examinations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Examination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 시험 제목 */
    @Column(nullable = false, length = 200)
    private String title;

    /** 사용할 시험지 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_paper_id", nullable = false)
    private Exam examPaper;

    /** 시험 유형 카테고리 (도메인 슬레이브) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private DomainSlave category;

    /** 시험 제한 시간 (분) */
    @Column(name = "time_limit", nullable = false)
    private Integer timeLimit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @Builder
    public Examination(String title, Exam examPaper, DomainSlave category,
                       Integer timeLimit, User createdBy) {
        this.title = title;
        this.examPaper = examPaper;
        this.category = category;
        this.timeLimit = timeLimit;
        this.createdBy = createdBy;
    }

    public void update(String title, Exam examPaper, DomainSlave category, Integer timeLimit) {
        this.title = title;
        this.examPaper = examPaper;
        this.category = category;
        this.timeLimit = timeLimit;
    }
}
