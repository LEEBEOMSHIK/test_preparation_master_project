package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.ExamHistoryDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ExamHistoryDetailRepository extends JpaRepository<ExamHistoryDetail, Long> {

    List<ExamHistoryDetail> findByExamHistory_IdOrderBySeqAsc(Long examHistoryId);

    /**
     * 기간 내 사용자 문항 카테고리별 집계.
     * categoryName 이 null 인 행은 GROUP BY 대상에서 제외됨.
     * 정답률 ASC 정렬로 약점 도메인 상위를 먼저 반환.
     */
    @Query("""
            SELECT d.categoryName, COUNT(d), SUM(CASE WHEN d.correct = true THEN 1 ELSE 0 END)
            FROM ExamHistoryDetail d JOIN d.examHistory h
            WHERE h.user.id = :userId
              AND h.takenAt >= :from
              AND d.categoryName IS NOT NULL
            GROUP BY d.categoryName
            ORDER BY
              CASE WHEN COUNT(d) = 0 THEN 0.0
                   ELSE SUM(CASE WHEN d.correct = true THEN 1 ELSE 0 END) * 1.0 / COUNT(d)
              END ASC
            """)
    List<Object[]> aggregateDomainStatsByUserAndPeriod(
            @Param("userId") Long userId,
            @Param("from") LocalDateTime from);
}
