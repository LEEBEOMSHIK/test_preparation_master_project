package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.PatchNoteItem;

public record PatchNoteItemResponse(
        Long id,
        PatchNoteItem.ItemType itemType,
        String summary,
        int displayOrder
) {
    public static PatchNoteItemResponse from(PatchNoteItem item) {
        return new PatchNoteItemResponse(item.getId(), item.getItemType(), item.getSummary(), item.getDisplayOrder());
    }
}
