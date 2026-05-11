package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.PracticeHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PracticeHistoryRepository extends JpaRepository<PracticeHistory, Long> {

    Page<PracticeHistory> findAllByOrderByExecutedAtDesc(Pageable pageable);

    Page<PracticeHistory> findByUserEmailContainingIgnoreCaseOrderByExecutedAtDesc(
            String email, Pageable pageable);
}
