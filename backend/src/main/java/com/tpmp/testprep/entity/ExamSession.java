package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 시험 응시 세션 엔티티.
 * 사용자가 특정 시험을 시작한 시각을 기록해 서버 기준 남은 시간 계산에 사용한다.
 * user_id + examination_id 쌍은 유니크 — 재응시 시 reset=true 플래그로 레코드를 교체한다.
 */
@Entity
@Table(
    name = "exam_session",
    indexes = @Index(
        name = "idx_exam_session_user_exam",
        columnList = "user_id, examination_id",
        unique = true
    )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ExamSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examination_id", nullable = false)
    private Examination examination;

    /** 응시 시작 시각 — 서버 기준, 최초 저장 후 변경 불가 */
    @Column(name = "started_at", nullable = false, updatable = false)
    private LocalDateTime startedAt;

    @PrePersist
    protected void onCreate() {
        if (this.startedAt == null) {
            this.startedAt = LocalDateTime.now();
        }
    }
}
