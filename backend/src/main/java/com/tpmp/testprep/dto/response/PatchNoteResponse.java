package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.PatchNote;
import com.tpmp.testprep.entity.PatchNoteItem;
import org.springframework.web.util.HtmlUtils;

import java.time.LocalDateTime;
import java.util.List;

public record PatchNoteResponse(
        Long id,
        String title,
        String version,
        String content,
        boolean published,
        LocalDateTime publishedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<PatchNoteItemResponse> items
) {
    public PatchNoteResponse(Long id, String title, String version, String content, boolean published,
                             LocalDateTime publishedAt, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this(id, title, version, content, published, publishedAt, createdAt, updatedAt, List.of());
    }

    public static PatchNoteResponse from(PatchNote patchNote) {
        List<PatchNoteItemResponse> itemResponses = patchNote.getActiveItems().stream()
                .map(PatchNoteItemResponse::from)
                .toList();
        if (itemResponses.isEmpty()) {
            itemResponses = List.of(new PatchNoteItemResponse(
                    null, PatchNoteItem.ItemType.ETC, toFallbackSummary(patchNote.getContent()), 0));
        }
        return new PatchNoteResponse(
                patchNote.getId(),
                patchNote.getTitle(),
                patchNote.getVersion(),
                patchNote.getContent(),
                patchNote.isPublished(),
                patchNote.getPublishedDt(),
                patchNote.getCreateDt(),
                patchNote.getModifiedDt(),
                itemResponses
        );
    }

    private static String toFallbackSummary(String content) {
        String plainText = content
                .replaceAll("(?is)<\\s*(script|style|template)\\b[^>]*>.*?</\\s*\\1\\s*>", "")
                .replaceAll("(?s)<[^>]*>", " ")
                .transform(HtmlUtils::htmlUnescape)
                .replaceAll("[\\p{Cf}\\u034F\\u115F\\u1160\\u180B-\\u180D\\u3164\\uFE00-\\uFE0F\\uFFA0]", "")
                .replaceAll("\\s+", " ")
                .trim();
        return plainText.length() > 200 ? plainText.substring(0, 200) : plainText;
    }
}
