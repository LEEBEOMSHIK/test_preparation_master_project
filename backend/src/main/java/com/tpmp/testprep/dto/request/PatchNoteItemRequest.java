package com.tpmp.testprep.dto.request;

import com.tpmp.testprep.entity.PatchNoteItem;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PatchNoteItemRequest(
        @NotNull PatchNoteItem.ItemType itemType,
        @NotBlank @Size(max = 200) String summary,
        @NotNull @Min(0) Integer displayOrder
) {}
