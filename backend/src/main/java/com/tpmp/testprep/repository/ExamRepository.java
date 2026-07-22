package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.Exam;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Exam e WHERE e.id = :id AND e.delYn = 'N'")
    java.util.Optional<Exam> findByIdForUpdate(@Param("id") Long id);

    /** 사용자 응시 시작용 — 삭제되지 않고 활성(use_yn='Y')인 시험지만 잠근다. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Exam e WHERE e.id = :id AND e.delYn = 'N' AND e.useYn = 'Y'")
    java.util.Optional<Exam> findActiveByIdForUpdate(@Param("id") Long id);

    Page<Exam> findAll(Pageable pageable);

    Page<Exam> findAllByDelYn(String delYn, Pageable pageable);

    java.util.Optional<Exam> findByIdAndDelYn(Long id, String delYn);

    long countByDelYn(String delYn);

    @Query("SELECT COALESCE(MAX(e.orderNo), 0) + 1 FROM Exam e")
    int nextOrderNo();
}
