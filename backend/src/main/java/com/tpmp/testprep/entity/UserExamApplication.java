package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 사용자가 직접 입력한 시험 접수(신청) 정보.
 * Q-net 공개 API는 종목별 공통 일정만 제공하고 개인별 접수 이력은 제공하지 않으므로,
 * 사용자가 접수일·시험일을 직접 입력·수정·삭제할 수 있도록 지원한다.
 */
@Entity
@Table(name = "user_exam_applications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserExamApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_info_id", nullable = true)
    private ExamInfo examInfo;

    // 저장 시점 스냅샷 — exam_info.title이 나중에 바뀌어도 접수 당시 이름을 유지
    @Column(name = "exam_name", nullable = false, length = 200)
    private String examName;

    @Column(name = "application_date")
    private LocalDate applicationDate;

    @Column(name = "exam_date")
    private LocalDate examDate;

    @Column(name = "memo", length = 300)
    private String memo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Builder
    public UserExamApplication(User user, ExamInfo examInfo, String examName,
                                LocalDate applicationDate, LocalDate examDate, String memo) {
        this.user = user;
        this.examInfo = examInfo;
        this.examName = examName;
        this.applicationDate = applicationDate;
        this.examDate = examDate;
        this.memo = memo;
    }

    public void update(ExamInfo examInfo, String examName, LocalDate applicationDate,
                        LocalDate examDate, String memo) {
        this.examInfo = examInfo;
        this.examName = examName;
        this.applicationDate = applicationDate;
        this.examDate = examDate;
        this.memo = memo;
    }
}
