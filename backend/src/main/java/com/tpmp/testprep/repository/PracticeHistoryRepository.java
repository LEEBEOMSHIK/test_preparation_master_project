package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.PracticeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PracticeHistoryRepository
        extends JpaRepository<PracticeHistory, Long>, JpaSpecificationExecutor<PracticeHistory> {
}
