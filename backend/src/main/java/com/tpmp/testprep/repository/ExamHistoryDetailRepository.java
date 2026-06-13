package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.ExamHistoryDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExamHistoryDetailRepository extends JpaRepository<ExamHistoryDetail, Long> {

    List<ExamHistoryDetail> findByExamHistory_IdOrderBySeqAsc(Long examHistoryId);
}
