package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.ConceptNote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ConceptNoteRepository extends JpaRepository<ConceptNote, Long> {

    @Query(value = "SELECT n FROM ConceptNote n LEFT JOIN FETCH n.question LEFT JOIN FETCH n.questionBank WHERE n.user.id = :userId",
           countQuery = "SELECT COUNT(n) FROM ConceptNote n WHERE n.user.id = :userId")
    Page<ConceptNote> findByUserIdWithRelations(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT n FROM ConceptNote n LEFT JOIN FETCH n.question LEFT JOIN FETCH n.questionBank WHERE n.id = :id")
    Optional<ConceptNote> findByIdWithRelations(@Param("id") Long id);

    @Query(value = "SELECT n FROM ConceptNote n LEFT JOIN FETCH n.question LEFT JOIN FETCH n.questionBank",
           countQuery = "SELECT COUNT(n) FROM ConceptNote n")
    Page<ConceptNote> findAllWithRelations(Pageable pageable);
}
