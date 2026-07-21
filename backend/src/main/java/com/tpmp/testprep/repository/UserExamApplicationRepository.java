package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.entity.UserExamApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserExamApplicationRepository extends JpaRepository<UserExamApplication, Long> {

    /**
     * 소유자의 접수 정보 목록을 examInfo까지 함께 조회한다.
     * 정렬: 시험일 오름차순(NULL은 뒤로) → 생성일 내림차순.
     * NULLS LAST 키워드 대신 순수 JPQL ASC 정렬만 사용한다 — PostgreSQL(이 프로젝트의 유일한
     * 대상 DB)은 ASC 정렬 시 NULL을 기본적으로 맨 뒤에 배치하므로 별도 키워드 없이도
     * "시험일 미입력 건은 뒤로" 요구사항이 그대로 만족된다. (Hibernate 버전 간 JPQL NULLS LAST
     * 지원 여부에 기대지 않는 안전한 선택)
     */
    @Query("SELECT a FROM UserExamApplication a LEFT JOIN FETCH a.examInfo " +
           "WHERE a.user = :user " +
           "ORDER BY a.examDate ASC, a.createdAt DESC")
    List<UserExamApplication> findByUserWithExamInfo(@Param("user") User user);
}
