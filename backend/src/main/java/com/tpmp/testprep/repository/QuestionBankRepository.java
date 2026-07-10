package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.QuestionBank;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuestionBankRepository extends JpaRepository<QuestionBank, Long> {

    /** 삭제되지 않은 문항만 조회 */
    Page<QuestionBank> findAllByDelYn(String delYn, Pageable pageable);

    /** 슬레이브 ID가 category 또는 examType으로 참조되는지 확인 */
    boolean existsByCategoryIdOrExamTypeId(Long categoryId, Long examTypeId);

    /** 활성 문항 중 동일 시험 그룹의 최대 문항번호 조회 */
    @Query("""
            SELECT COALESCE(MAX(qb.questionNo), 0)
            FROM QuestionBank qb
            WHERE qb.delYn = 'N'
              AND qb.examType.id = :examTypeId
              AND qb.examYear = :examYear
              AND qb.examRound = :examRound
              AND qb.questionNo IS NOT NULL
            """)
    Integer findMaxQuestionNo(
            @Param("examTypeId") Long examTypeId,
            @Param("examYear") Integer examYear,
            @Param("examRound") Integer examRound);

    /** 활성 문항 중 동일 시험 그룹/문항번호 존재 여부 */
    @Query("""
            SELECT CASE WHEN COUNT(qb) > 0 THEN true ELSE false END
            FROM QuestionBank qb
            WHERE qb.delYn = 'N'
              AND qb.examType.id = :examTypeId
              AND qb.examYear = :examYear
              AND qb.examRound = :examRound
              AND qb.questionNo = :questionNo
            """)
    boolean existsActiveQuestionNo(
            @Param("examTypeId") Long examTypeId,
            @Param("examYear") Integer examYear,
            @Param("examRound") Integer examRound,
            @Param("questionNo") Integer questionNo);

    /** 활성 문항 중 동일 시험 그룹/문항번호 존재 여부 (수정 시 자기 자신 제외) */
    @Query("""
            SELECT CASE WHEN COUNT(qb) > 0 THEN true ELSE false END
            FROM QuestionBank qb
            WHERE qb.delYn = 'N'
              AND qb.id <> :questionId
              AND qb.examType.id = :examTypeId
              AND qb.examYear = :examYear
              AND qb.examRound = :examRound
              AND qb.questionNo = :questionNo
            """)
    boolean existsActiveQuestionNoExcludingId(
            @Param("questionId") Long questionId,
            @Param("examTypeId") Long examTypeId,
            @Param("examYear") Integer examYear,
            @Param("examRound") Integer examRound,
            @Param("questionNo") Integer questionNo);

    /** 카테고리별 랜덤 문항 조회 (데일리 퀴즈용)
     *  language가 null이면 조건을 무시(=전체) — CODE 유형이면서 language가 대소문자 무시 일치하는 문항만 필터링.
     *  (관리자 등록 폼 버그로 CODE가 아닌 문항에도 language 값이 실릴 수 있어 question_type = 'CODE' 조건을 반드시 함께 건다)
     *  source가 null이면 조건을 무시(=전체) — "AI_CUSTOM"이면 examYear·examRound 모두 null인 문항만, "EXAM"이면 둘 중 하나라도 값이 있는 문항만 필터링. */
    @Query(
        value = "SELECT * FROM question_bank " +
            "WHERE (category_id = :categoryId OR exam_type_id = :categoryId) " +
            "AND del_yn = 'N' " +
            "AND (:language IS NULL OR (question_type = 'CODE' AND LOWER(language) = LOWER(:language))) " +
            "AND (:source IS NULL OR (:source = 'AI_CUSTOM' AND exam_year IS NULL AND exam_round IS NULL) OR (:source = 'EXAM' AND (exam_year IS NOT NULL OR exam_round IS NOT NULL))) " +
            "ORDER BY RANDOM() LIMIT :limit",
        nativeQuery = true)
    java.util.List<QuestionBank> findRandomByCategory(
            @Param("categoryId") Long categoryId,
            @Param("limit") int limit,
            @Param("language") String language,
            @Param("source") String source);

    /** 주어진 시험 유형 ID들에 문항이 존재하는 문제 유형(category) ID 목록 조회 */
    @Query(
        "SELECT DISTINCT qb.category.id FROM QuestionBank qb WHERE qb.examType.id IN :examTypeIds AND qb.delYn = 'N' AND qb.category IS NOT NULL")
    java.util.List<Long> findDistinctCategoryIdsByExamTypeIds(
            @Param("examTypeIds") java.util.List<Long> examTypeIds);

    /** CODE 유형 문항이 존재하는 문제 유형(category) ID 목록 조회 — 프로그래밍 언어 필터 노출 대상 카테고리 판별용 */
    @Query(
        "SELECT DISTINCT qb.category.id FROM QuestionBank qb WHERE qb.questionType = :questionType AND qb.delYn = 'N' AND qb.category IS NOT NULL")
    java.util.List<Long> findDistinctCategoryIdsByQuestionType(
            @Param("questionType") QuestionBank.QuestionType questionType);

    /** AI 커스텀 문항(examYear·examRound 모두 null)이 존재하는 문제 유형(category) ID 목록 조회 — 데일리 퀴즈 출처 필터 노출 대상 카테고리 판별용 */
    @Query(
        "SELECT DISTINCT qb.category.id FROM QuestionBank qb WHERE qb.examYear IS NULL AND qb.examRound IS NULL AND qb.delYn = 'N' AND qb.category IS NOT NULL")
    java.util.List<Long> findDistinctCategoryIdsWithAiCustomQuestions();
}
