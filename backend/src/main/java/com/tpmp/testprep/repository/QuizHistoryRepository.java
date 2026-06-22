package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.QuizHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface QuizHistoryRepository extends JpaRepository<QuizHistory, Long> {

    /** 기간 내 사용자 총 문항 수 / 총 정답 수 집계 */
    @Query("""
            SELECT COUNT(q), SUM(CASE WHEN q.correct = true THEN 1 ELSE 0 END)
            FROM QuizHistory q
            WHERE q.user.id = :userId
              AND q.createdAt >= :from
            """)
    Object[] sumTotalAndCorrectByUserAndPeriod(
            @Param("userId") Long userId,
            @Param("from") LocalDateTime from);

    /** 기간 내 사용자 도메인별 집계 — domainName 없는 행 제외 */
    @Query("""
            SELECT q.domainName, COUNT(q), SUM(CASE WHEN q.correct = true THEN 1 ELSE 0 END)
            FROM QuizHistory q
            WHERE q.user.id = :userId
              AND q.createdAt >= :from
              AND q.domainName IS NOT NULL
            GROUP BY q.domainName
            ORDER BY
              CASE WHEN COUNT(q) = 0 THEN 0.0
                   ELSE SUM(CASE WHEN q.correct = true THEN 1 ELSE 0 END) * 1.0 / COUNT(q)
              END ASC
            """)
    List<Object[]> aggregateDomainStatsByUserAndPeriod(
            @Param("userId") Long userId,
            @Param("from") LocalDateTime from);

    /** 기간 내 사용자 날짜별 집계 */
    @Query("""
            SELECT CAST(q.createdAt AS date), COUNT(q), SUM(CASE WHEN q.correct = true THEN 1 ELSE 0 END)
            FROM QuizHistory q
            WHERE q.user.id = :userId
              AND q.createdAt >= :from
            GROUP BY CAST(q.createdAt AS date)
            ORDER BY CAST(q.createdAt AS date) ASC
            """)
    List<Object[]> aggregateDailyStatsByUserAndPeriod(
            @Param("userId") Long userId,
            @Param("from") LocalDateTime from);
}
