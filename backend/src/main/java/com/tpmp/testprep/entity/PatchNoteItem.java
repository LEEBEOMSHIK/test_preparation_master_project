package com.tpmp.testprep.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 패치노트 릴리즈에 포함된 한 줄 항목. */
@Entity
@Table(name = "patch_note_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PatchNoteItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patch_note_id", nullable = false)
    private PatchNote patchNote;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 20)
    private ItemType itemType;

    @Column(nullable = false, length = 200)
    private String summary;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Builder
    public PatchNoteItem(PatchNote patchNote, ItemType itemType, String summary, int displayOrder,
                         Long createdByUno) {
        this.patchNote = patchNote;
        this.itemType = itemType;
        this.summary = summary;
        this.displayOrder = displayOrder;
        initAudit(createdByUno);
    }

    public void attachTo(PatchNote patchNote) {
        this.patchNote = patchNote;
    }

    public enum ItemType {
        ADD,
        IMPROVEMENT,
        FIX,
        SECURITY,
        ETC
    }
}
