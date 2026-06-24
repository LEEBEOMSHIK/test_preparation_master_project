package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.PracticeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PracticeHistoryRepository
        extends JpaRepository<PracticeHistory, Long>, JpaSpecificationExecutor<PracticeHistory> {

    /**
     * 기간 내 사용자 연습장 총 실행수 + 성공수 집계.
     * 성공 판정: resultType != 'ERROR'
     */
    @Query("""
            SELECT COUNT(p),
                   SUM(CASE WHEN p.resultType = 'ERROR' THEN 0 ELSE 1 END)
            FROM PracticeHistory p
            WHERE p.userEmail = :email
              AND p.executedAt >= :from
            """)
    Object[] sumTotalAndSuccessByEmailAndPeriod(
            @Param("email") String email,
            @Param("from") LocalDateTime from);

    /**
     * 기간 내 사용자 연습장 날짜별 실행수 집계 (날짜 ASC).
     */
    @Query("""
            SELECT CAST(p.executedAt AS date),
                   COUNT(p)
            FROM PracticeHistory p
            WHERE p.userEmail = :email
              AND p.executedAt >= :from
            GROUP BY CAST(p.executedAt AS date)
            ORDER BY CAST(p.executedAt AS date) ASC
            """)
    List<Object[]> aggregateDailyStatsByEmailAndPeriod(
            @Param("email") String email,
            @Param("from") LocalDateTime from);
}
