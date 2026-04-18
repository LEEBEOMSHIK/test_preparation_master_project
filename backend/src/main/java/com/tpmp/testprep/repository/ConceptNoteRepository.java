package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.ConceptNote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConceptNoteRepository extends JpaRepository<ConceptNote, Long> {
    Page<ConceptNote> findByUserId(Long userId, Pageable pageable);
    Page<ConceptNote> findAll(Pageable pageable); // Admin
}
