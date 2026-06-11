package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.UserQuestionBookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserQuestionBookmarkRepository extends JpaRepository<UserQuestionBookmark, Long> {

    Optional<UserQuestionBookmark> findByUserIdAndQuestionBankId(Long userId, Long questionBankId);

    /** 사용자 북마크 목록 — 소프트 삭제 문항 제외, 최신순 */
    @Query("SELECT b FROM UserQuestionBookmark b " +
           "JOIN FETCH b.questionBank qb " +
           "LEFT JOIN FETCH qb.category " +
           "LEFT JOIN FETCH qb.examType " +
           "WHERE b.user.id = :userId AND qb.delYn = 'N' " +
           "ORDER BY b.createdAt DESC")
    List<UserQuestionBookmark> findAllByUserIdWithQuestion(@Param("userId") Long userId);

    /** 사용자의 북마크된 questionBankId 목록만 추출 */
    @Query("SELECT b.questionBank.id FROM UserQuestionBookmark b " +
           "JOIN b.questionBank qb " +
           "WHERE b.user.id = :userId AND qb.delYn = 'N'")
    List<Long> findQuestionBankIdsByUserId(@Param("userId") Long userId);
}
