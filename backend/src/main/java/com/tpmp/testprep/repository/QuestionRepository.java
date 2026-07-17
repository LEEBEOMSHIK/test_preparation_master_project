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

    /** 시험 제출 채점용 — category LAZY 로딩 N+1 방지를 위해 LEFT JOIN FETCH 적용 */
    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.category WHERE q.exam.id = :examId ORDER BY q.seq ASC")
    List<Question> findByExamIdOrderBySeqAscWithCategory(@Param("examId") Long examId);

    /** 동기화 미리보기용 — 원본·카테고리를 한 번에 조회한다. */
    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.category LEFT JOIN FETCH q.sourceQuestionBank s LEFT JOIN FETCH s.category WHERE q.exam.id = :examId ORDER BY q.seq ASC")
    List<Question> findByExamIdOrderBySeqAscWithSyncSource(@Param("examId") Long examId);
}
