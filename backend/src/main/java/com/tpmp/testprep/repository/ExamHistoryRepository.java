package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.ExamHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ExamHistoryRepository extends JpaRepository<ExamHistory, Long> {

    /** 특정 사용자·시험의 가장 최근 응시 이력 조회 */
    Optional<ExamHistory> findTopByUser_IdAndExamination_IdOrderByTakenAtDesc(Long userId, Long examinationId);

    /** 사용자 전체 응시 이력 목록 (최신순) */
    Page<ExamHistory> findByUser_IdOrderByTakenAtDesc(Long userId, Pageable pageable);

    /** 사용자 소유 이력 단건 조회 (소유권 검증용) */
    Optional<ExamHistory> findByIdAndUser_Id(Long id, Long userId);

    Page<ExamHistory> findByTakenAtBetween(LocalDateTime from, LocalDateTime to, Pageable pageable);
    Page<ExamHistory> findByUser_NameContainingIgnoreCaseAndTakenAtBetween(String name, LocalDateTime from, LocalDateTime to, Pageable pageable);
    Page<ExamHistory> findByUser_EmailContainingIgnoreCaseAndTakenAtBetween(String email, LocalDateTime from, LocalDateTime to, Pageable pageable);
    Page<ExamHistory> findByExamination_TitleContainingIgnoreCaseAndTakenAtBetween(String title, LocalDateTime from, LocalDateTime to, Pageable pageable);
    long countByTakenAtBetween(LocalDateTime from, LocalDateTime to);

    /** 기간 내 사용자 총 문항 수 / 총 정답 수 집계 */
    @Query("""
            SELECT SUM(h.totalQuestions), SUM(h.correctCount)
            FROM ExamHistory h
            WHERE h.user.id = :userId
              AND h.takenAt >= :from
            """)
    Object[] sumTotalAndCorrectByUserAndPeriod(
            @Param("userId") Long userId,
            @Param("from") LocalDateTime from);

    /** 기간 내 사용자 도메인(카테고리)별 집계 — category 없는 행 제외 */
    @Query("""
            SELECT c.name, SUM(h.totalQuestions), SUM(h.correctCount)
            FROM ExamHistory h
            JOIN h.examination e
            JOIN e.category c
            WHERE h.user.id = :userId
              AND h.takenAt >= :from
            GROUP BY c.name
            ORDER BY
              CASE WHEN SUM(h.totalQuestions) = 0 THEN 0.0
                   ELSE SUM(h.correctCount) * 1.0 / SUM(h.totalQuestions)
              END ASC
            """)
    List<Object[]> aggregateDomainStatsByUserAndPeriod(
            @Param("userId") Long userId,
            @Param("from") LocalDateTime from);

    /** 기간 내 사용자 날짜별 집계 */
    @Query("""
            SELECT CAST(h.takenAt AS date), SUM(h.totalQuestions), SUM(h.correctCount)
            FROM ExamHistory h
            WHERE h.user.id = :userId
              AND h.takenAt >= :from
            GROUP BY CAST(h.takenAt AS date)
            ORDER BY CAST(h.takenAt AS date) ASC
            """)
    List<Object[]> aggregateDailyStatsByUserAndPeriod(
            @Param("userId") Long userId,
            @Param("from") LocalDateTime from);
}
