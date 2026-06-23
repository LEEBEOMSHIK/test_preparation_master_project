package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.ExamSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ExamSessionRepository extends JpaRepository<ExamSession, Long> {

    Optional<ExamSession> findByUser_IdAndExamination_Id(Long userId, Long examinationId);

    @Modifying
    @Query("DELETE FROM ExamSession s WHERE s.user.id = :userId AND s.examination.id = :examinationId")
    void deleteByUser_IdAndExamination_Id(
            @Param("userId") Long userId,
            @Param("examinationId") Long examinationId
    );
}
