package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.Exam;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    Page<Exam> findAll(Pageable pageable);

    @Query("SELECT COALESCE(MAX(e.orderNo), 0) + 1 FROM Exam e")
    int nextOrderNo();
}
