package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "exams")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(name = "order_no", nullable = false)
    private Integer orderNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_mode", nullable = false)
    private QuestionMode questionMode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("seq ASC")
    private List<Question> questions = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "del_yn", nullable = false, length = 1)
    private String delYn = "N";

    /** 사용 여부: 'Y' = 사용중, 'N' = 비사용(가역). 삭제(del_yn)와 달리 다시 켤 수 있다. */
    @Column(name = "use_yn", nullable = false, length = 1)
    private String useYn = "Y";

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @Builder
    public Exam(String title, Integer orderNo, QuestionMode questionMode, User createdBy) {
        this.title = title;
        this.orderNo = orderNo;
        this.questionMode = questionMode;
        this.createdBy = createdBy;
    }

    public void update(String title, QuestionMode questionMode) {
        if (title != null) this.title = title;
        if (questionMode != null) this.questionMode = questionMode;
    }

    public void softDelete() { this.delYn = "Y"; }

    public void toggleUseYn() { this.useYn = "Y".equals(this.useYn) ? "N" : "Y"; }

    public enum QuestionMode {
        RANDOM, SEQUENTIAL
    }
}
