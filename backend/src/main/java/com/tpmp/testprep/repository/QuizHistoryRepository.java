package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.QuizHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface QuizHistoryRepository extends JpaRepository<QuizHistory, Long> {

    /** 관리자 대시보드용 — 기간 내 전체 사용자 퀴즈 풀이 건수 */
    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    /** 관리자 퀴즈 이력 목록용 — 검색어 없이 조회 */
    Page<QuizHistory> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to, Pageable pageable);

    /** 관리자 퀴즈 이력 목록용 — 회원 이름 검색 */
    Page<QuizHistory> findByUser_NameContainingIgnoreCaseAndCreatedAtBetween(
            String name, LocalDateTime from, LocalDateTime to, Pageable pageable);

    /** 관리자 퀴즈 이력 목록용 — 이메일 검색 */
    Page<QuizHistory> findByUser_EmailContainingIgnoreCaseAndCreatedAtBetween(
            String email, LocalDateTime from, LocalDateTime to, Pageable pageable);

    /** 관리자 퀴즈 이력 목록용 — 도메인(카테고리)명 검색 */
    Page<QuizHistory> findByDomainNameContainingIgnoreCaseAndCreatedAtBetween(
            String domainName, LocalDateTime from, LocalDateTime to, Pageable pageable);

    /** 관리자 대시보드 추이용 — 기간 내 날짜별 전체 사용자 퀴즈 풀이 건수 집계 */
    @Query("""
            SELECT CAST(q.createdAt AS date), COUNT(q)
            FROM QuizHistory q
            WHERE q.createdAt >= :from AND q.createdAt < :to
            GROUP BY CAST(q.createdAt AS date)
            """)
    List<Object[]> countDailyByCreatedAtBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

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

    /** 관리자 퀴즈 이력 통계용 — 기간 내 전체 사용자 도메인별 풀이량(풀이수 내림차순), domainName 없는 행 제외 */
    @Query("""
            SELECT q.domainName, COUNT(q)
            FROM QuizHistory q
            WHERE q.createdAt >= :from AND q.createdAt < :to
              AND q.domainName IS NOT NULL
            GROUP BY q.domainName
            ORDER BY COUNT(q) DESC
            """)
    List<Object[]> aggregateDomainStatsBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
