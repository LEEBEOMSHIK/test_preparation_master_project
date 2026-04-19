package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.Examination;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ExaminationRepository extends JpaRepository<Examination, Long> {

    /** 카테고리·시험지·생성자 페치 조인 (N+1 방지) */
    @Query("SELECT e FROM Examination e " +
           "LEFT JOIN FETCH e.category " +
           "LEFT JOIN FETCH e.examPaper " +
           "ORDER BY e.createdAt DESC")
    Page<Examination> findAllWithDetails(Pageable pageable);
}
