package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.QuestionBank;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionBankRepository extends JpaRepository<QuestionBank, Long> {

    /** 삭제되지 않은 문항만 조회 */
    Page<QuestionBank> findAllByDelYn(String delYn, Pageable pageable);

    /** 카테고리별 랜덤 문항 조회 (데일리 퀴즈용) */
    @org.springframework.data.jpa.repository.Query(
        value = "SELECT * FROM question_bank WHERE category_id = :categoryId AND del_yn = 'N' ORDER BY RANDOM() LIMIT :limit",
        nativeQuery = true)
    java.util.List<QuestionBank> findRandomByCategory(
            @org.springframework.data.repository.query.Param("categoryId") Long categoryId,
            @org.springframework.data.repository.query.Param("limit") int limit);
}
