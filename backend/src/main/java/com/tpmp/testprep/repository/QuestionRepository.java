package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    @Query("SELECT COALESCE(MAX(q.seq), 0) FROM Question q WHERE q.exam.id = :examId")
    int maxSeqByExamId(@Param("examId") Long examId);

    @Query("SELECT COUNT(q) FROM Question q WHERE q.exam.id = :examId")
    int countByExamId(@Param("examId") Long examId);

    List<Question> findByExamIdOrderBySeqAsc(Long examId);
}
