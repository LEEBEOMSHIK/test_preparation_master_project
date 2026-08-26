package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.domain.PatchNote;

import java.time.LocalDateTime;

public record PatchNoteResponse(
        Long id,
        String title,
        String version,
        String content,
        boolean published,
        LocalDateTime publishedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static PatchNoteResponse from(PatchNote patchNote) {
        return new PatchNoteResponse(
                patchNote.getId(),
                patchNote.getTitle(),
                patchNote.getVersion(),
                patchNote.getContent(),
                patchNote.isPublished(),
                patchNote.getPublishedDt(),
                patchNote.getCreateDt(),
                patchNote.getModifiedDt()
        );
    }
}
