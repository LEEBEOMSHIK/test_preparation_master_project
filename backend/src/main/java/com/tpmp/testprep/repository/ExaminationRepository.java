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

    /** 사용자 시험 목록 서버 검색. 모든 조건을 DB에서 적용한 뒤 페이지를 계산한다. */
    @Query(
            value = "SELECT e FROM Examination e " +
                    "LEFT JOIN FETCH e.category " +
                    "LEFT JOIN FETCH e.examPaper " +
                    "WHERE e.delYn = 'N' AND e.useYn = 'Y' " +
                    "AND (CAST(:title AS string) IS NULL " +
                    "OR LOWER(e.title) LIKE LOWER(CONCAT('%', CAST(:title AS string), '%')) ESCAPE '!') " +
                    "AND (:category IS NULL OR e.category.name = :category) " +
                    "AND (:filterInterests = false OR e.category.name IN :interests) " +
                    "AND (:year IS NULL OR e.examYear = :year) " +
                    "AND (:round IS NULL OR e.examRound = :round) " +
                    "AND (:aiCustom IS NULL OR e.isAiCustom = :aiCustom) " +
                    "ORDER BY e.examYear DESC NULLS LAST, e.examRound DESC NULLS LAST, " +
                    "e.createdAt DESC, e.id DESC",
            countQuery = "SELECT COUNT(e) FROM Examination e " +
                    "WHERE e.delYn = 'N' AND e.useYn = 'Y' " +
                    "AND (CAST(:title AS string) IS NULL " +
                    "OR LOWER(e.title) LIKE LOWER(CONCAT('%', CAST(:title AS string), '%')) ESCAPE '!') " +
                    "AND (:category IS NULL OR e.category.name = :category) " +
                    "AND (:filterInterests = false OR e.category.name IN :interests) " +
                    "AND (:year IS NULL OR e.examYear = :year) " +
                    "AND (:round IS NULL OR e.examRound = :round) " +
                    "AND (:aiCustom IS NULL OR e.isAiCustom = :aiCustom)"
    )
    Page<Examination> searchActive(
            @Param("title") String title,
            @Param("category") String category,
            @Param("interests") List<String> interests,
            @Param("filterInterests") boolean filterInterests,
            @Param("year") Integer year,
            @Param("round") Integer round,
            @Param("aiCustom") Boolean aiCustom,
            Pageable pageable
    );

    @Query("SELECT DISTINCT e.examYear FROM Examination e " +
            "WHERE e.delYn = 'N' AND e.useYn = 'Y' AND e.examYear IS NOT NULL " +
            "ORDER BY e.examYear DESC")
    List<Integer> findActiveYears();

    @Query("SELECT DISTINCT e.examRound FROM Examination e " +
            "WHERE e.delYn = 'N' AND e.useYn = 'Y' AND e.examRound IS NOT NULL " +
            "ORDER BY e.examRound DESC")
    List<Integer> findActiveRounds();

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
