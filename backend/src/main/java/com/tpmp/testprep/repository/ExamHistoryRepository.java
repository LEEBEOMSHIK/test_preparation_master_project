package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.ExamHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;

public interface ExamHistoryRepository extends JpaRepository<ExamHistory, Long> {
    Page<ExamHistory> findByTakenAtBetween(LocalDateTime from, LocalDateTime to, Pageable pageable);
    Page<ExamHistory> findByUser_NameContainingIgnoreCaseAndTakenAtBetween(String name, LocalDateTime from, LocalDateTime to, Pageable pageable);
    Page<ExamHistory> findByUser_EmailContainingIgnoreCaseAndTakenAtBetween(String email, LocalDateTime from, LocalDateTime to, Pageable pageable);
    Page<ExamHistory> findByExamination_TitleContainingIgnoreCaseAndTakenAtBetween(String title, LocalDateTime from, LocalDateTime to, Pageable pageable);
    long countByTakenAtBetween(LocalDateTime from, LocalDateTime to);
}
