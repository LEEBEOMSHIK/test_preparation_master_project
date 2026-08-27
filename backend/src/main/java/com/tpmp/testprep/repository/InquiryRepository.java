package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.Inquiry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.Query;

public interface InquiryRepository extends JpaRepository<Inquiry, Long> {
    Page<Inquiry> findByUserId(Long userId, Pageable pageable);
    Page<Inquiry> findByStatus(Inquiry.Status status, Pageable pageable);
    Page<Inquiry> findByUserIdAndStatus(Long userId, Inquiry.Status status, Pageable pageable);
    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
    long countByStatus(Inquiry.Status status);
    long countByStatusAndRequestType(Inquiry.Status status, Inquiry.RequestType requestType);
    @Query("SELECT i FROM Inquiry i WHERE (:status IS NULL OR i.status = :status) AND (:requestType IS NULL OR i.requestType = :requestType) AND (:targetArea IS NULL OR i.targetArea = :targetArea)")
    Page<Inquiry> findAdminFiltered(@Param("status") Inquiry.Status status, @Param("requestType") Inquiry.RequestType requestType, @Param("targetArea") String targetArea, Pageable pageable);

    /** 기간 내 날짜별 문의 건수 집계 (관리자 대시보드 추이) */
    @Query("""
            SELECT CAST(i.createdAt AS date), COUNT(i)
            FROM Inquiry i
            WHERE i.createdAt >= :from AND i.createdAt < :to
            GROUP BY CAST(i.createdAt AS date)
            """)
    List<Object[]> countDailyByCreatedAtBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
