package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    @Query("SELECT COALESCE(MAX(q.seq), 0) FROM Question q WHERE q.exam.id = :examId")
    int maxSeqByExamId(@Param("examId") Long examId);

    /** 관리자 표시용 문항 수 — 삭제되지 않은(del_yn='N') 문항만 집계, use_yn은 필터하지 않음 */
    @Query("SELECT COUNT(q) FROM Question q WHERE q.exam.id = :examId AND q.delYn = 'N'")
    int countByExamId(@Param("examId") Long examId);

    /** 사용자 시험 상세(진입점)용 — 삭제되지 않고 활성(del_yn='N' AND use_yn='Y')인 문항만 */
    @Query("SELECT q FROM Question q WHERE q.exam.id = :examId AND q.delYn = 'N' AND q.useYn = 'Y' ORDER BY q.seq ASC")
    List<Question> findActiveByExamIdOrderBySeqAsc(@Param("examId") Long examId);

    /** 시험 제출 채점(admin 조회 공용)용 — 삭제되지 않은(del_yn='N') 문항만, use_yn은 필터하지 않음
     *  (응시 도중 관리자가 비활성화해도 채점이 깨지지 않도록). category와 원본 제목 LAZY 로딩 N+1 방지를 위해 LEFT JOIN FETCH 적용 */
    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.category LEFT JOIN FETCH q.sourceQuestionBank " +
           "WHERE q.exam.id = :examId AND q.delYn = 'N' ORDER BY q.seq ASC")
    List<Question> findByExamIdOrderBySeqAscWithCategory(@Param("examId") Long examId);

    /** 동기화 미리보기용 — 삭제되지 않은(del_yn='N') 문항만. 원본·카테고리를 한 번에 조회한다. */
    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.category LEFT JOIN FETCH q.sourceQuestionBank s LEFT JOIN FETCH s.category " +
           "WHERE q.exam.id = :examId AND q.delYn = 'N' ORDER BY q.seq ASC")
    List<Question> findByExamIdOrderBySeqAscWithSyncSource(@Param("examId") Long examId);

    /**
     * 문항관리 목록의 "사용 시험" 표시용 — 문제은행 ID별로 실제 연결된 시험(examinations) 제목을 조회한다.
     * 결과: Object[]{questionBankId(Long), examinationTitle(String)} — 한 문제은행 문항이 여러 시험에
     * 연결될 수 있어 questionBankId당 여러 행이 나올 수 있다.
     */
    @Query("""
            SELECT q.sourceQuestionBank.id, e.title
            FROM Question q, Examination e
            WHERE q.exam = e.examPaper
              AND q.sourceQuestionBank.id IN :questionBankIds
              AND q.delYn = 'N' AND e.delYn = 'N'
            """)
    List<Object[]> findUsedExaminationTitlesByQuestionBankIds(@Param("questionBankIds") List<Long> questionBankIds);
}
