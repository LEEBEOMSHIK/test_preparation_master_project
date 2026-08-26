package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.PatchNote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PatchNoteRepository extends JpaRepository<PatchNote, Long> {

    Page<PatchNote> findByDelYnOrderByModifiedDtDescIdDesc(String delYn, Pageable pageable);

    Page<PatchNote> findByDelYnAndUseYnAndPublishedYnOrderByPublishedDtDescIdDesc(
            String delYn, String useYn, String publishedYn, Pageable pageable);

    Optional<PatchNote> findByIdAndDelYn(Long id, String delYn);
}
