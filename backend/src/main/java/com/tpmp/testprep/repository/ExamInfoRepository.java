package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.ExamInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExamInfoRepository extends JpaRepository<ExamInfo, Long> {
    List<ExamInfo> findByIsActiveTrueOrderByDisplayOrderAscCreatedAtDesc();
    List<ExamInfo> findByIsActiveTrueAndExamTypeInOrderByDisplayOrderAscCreatedAtDesc(List<String> examTypes);
    List<ExamInfo> findAllByOrderByDisplayOrderAscCreatedAtDesc();
    Optional<ExamInfo> findByTitle(String title);
}
