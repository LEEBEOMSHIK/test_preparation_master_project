package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.LoginHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {

    Page<LoginHistory> findByLoginAtBetween(LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<LoginHistory> findByMemberNameContainingIgnoreCaseAndLoginAtBetween(
            String memberName, LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<LoginHistory> findByEmailContainingIgnoreCaseAndLoginAtBetween(
            String email, LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<LoginHistory> findByIpAddressContainingAndLoginAtBetween(
            String ipAddress, LocalDateTime from, LocalDateTime to, Pageable pageable);

    long countByLoginAtBetween(LocalDateTime from, LocalDateTime to);

    /** 기간 내 날짜별 로그인 건수 집계 (관리자 대시보드 추이) */
    @Query("""
            SELECT CAST(l.loginAt AS date), COUNT(l)
            FROM LoginHistory l
            WHERE l.loginAt >= :from AND l.loginAt < :to
            GROUP BY CAST(l.loginAt AS date)
            """)
    List<Object[]> countDailyByLoginAtBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
