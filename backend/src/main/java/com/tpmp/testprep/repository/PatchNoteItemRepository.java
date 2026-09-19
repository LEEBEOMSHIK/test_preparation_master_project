package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.PatchNoteItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PatchNoteItemRepository extends JpaRepository<PatchNoteItem, Long> {

    List<PatchNoteItem> findByPatchNoteIdAndDelYnAndUseYnOrderByDisplayOrderAscIdAsc(
            Long patchNoteId, String delYn, String useYn);
}
