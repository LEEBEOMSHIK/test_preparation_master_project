package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.Examination;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface ExaminationRepository extends JpaRepository<Examination, Long> {

    /** 관리자 목록용 — 삭제되지 않은(del_yn='N') 시험만, use_yn은 필터하지 않음(비활성도 관리자는 봐야 함). 카테고리·시험지 페치 조인 (N+1 방지) */
    @Query("SELECT e FROM Examination e " +
           "LEFT JOIN FETCH e.category " +
           "LEFT JOIN FETCH e.examPaper " +
           "WHERE e.delYn = :delYn " +
           "ORDER BY e.createdAt DESC")
    Page<Examination> findAllWithDetailsByDelYn(@Param("delYn") String delYn, Pageable pageable);

    /** 사용자 목록용 — 삭제되지 않고 활성(del_yn='N' AND use_yn='Y')인 시험만. 카테고리·시험지 페치 조인 (N+1 방지)
     *  정렬: 시험 연도·회차 최신순(내림차순, NULL은 맨 뒤) → 동일 연도·회차 시 등록 시각 최신순 타이브레이커 */
    @Query("SELECT e FROM Examination e " +
           "LEFT JOIN FETCH e.category " +
           "LEFT JOIN FETCH e.examPaper " +
           "WHERE e.delYn = 'N' AND e.useYn = 'Y' " +
           "ORDER BY e.examYear DESC NULLS LAST, e.examRound DESC NULLS LAST, e.createdAt DESC")
    Page<Examination> findAllWithDetailsActive(Pageable pageable);

    /** 슬레이브 ID가 category로 참조되는 시험(삭제되지 않은 것만)이 있는지 확인 */
    boolean existsByCategoryIdAndDelYn(Long categoryId, String delYn);

    /** 관리자 단건 조회용 — 삭제되지 않은(del_yn='N') 시험만. 시험지·카테고리 페치 조인 */
    @Query("SELECT e FROM Examination e " +
           "JOIN FETCH e.examPaper " +
           "LEFT JOIN FETCH e.category " +
           "WHERE e.id = :id AND e.delYn = :delYn")
    Optional<Examination> findByIdAndDelYn(@Param("id") Long id, @Param("delYn") String delYn);

    /** 사용자 응시 시작·상세 조회(진입점)용 — 삭제되지 않고 활성(del_yn='N' AND use_yn='Y')인 시험만. 시험지·카테고리 페치 조인 */
    @Query("SELECT e FROM Examination e " +
           "JOIN FETCH e.examPaper " +
           "LEFT JOIN FETCH e.category " +
           "WHERE e.id = :id AND e.delYn = 'N' AND e.useYn = 'Y'")
    Optional<Examination> findActiveByIdWithPaper(@Param("id") Long id);

    /** 시험 제출·채점(진행 중 세션 종료)용 — 삭제되지 않은(del_yn='N') 시험만, use_yn은 필터하지 않음
     *  (응시 도중 관리자가 비활성화해도 이미 시작한 응시자의 채점이 깨지지 않도록). 시험지·카테고리 페치 조인 */
    @Query("SELECT e FROM Examination e " +
           "JOIN FETCH e.examPaper " +
           "LEFT JOIN FETCH e.category " +
           "WHERE e.id = :id AND e.delYn = :delYn")
    Optional<Examination> findByIdWithPaperAndDelYn(@Param("id") Long id, @Param("delYn") String delYn);

    @Query("SELECT DISTINCT e.category.id FROM Examination e WHERE e.examPaper.id = :examPaperId")
    List<Long> findDistinctCategoryIdsByExamPaperId(@Param("examPaperId") Long examPaperId);
}
