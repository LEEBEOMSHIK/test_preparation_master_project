package com.tpmp.testprep.entity;

import jakarta.persistence.Column;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/** 관리자 작성 패치노트. */
@Entity
@Table(name = "patch_notes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PatchNote extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 50)
    private String version;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "published_yn", nullable = false, length = 1)
    private String publishedYn = "N";

    @Column(name = "published_dt")
    private LocalDateTime publishedDt;

    @OneToMany(mappedBy = "patchNote", cascade = CascadeType.ALL)
    @OrderBy("displayOrder ASC, id ASC")
    private List<PatchNoteItem> items = new ArrayList<>();

    @Builder
    public PatchNote(String title, String version, String content, Long createdByUno) {
        this.title = title;
        this.version = version;
        this.content = content;
        initAudit(createdByUno);
    }

    public void update(String title, String version, String content, Long userId) {
        this.title = title;
        this.version = version;
        this.content = content;
        updateAudit(userId);
    }

    public void changePublication(boolean published, Long userId) {
        this.publishedYn = published ? "Y" : "N";
        if (published && this.publishedDt == null) {
            this.publishedDt = LocalDateTime.now();
        }
        updateAudit(userId);
    }

    public boolean isPublished() {
        return "Y".equals(publishedYn);
    }

    public void addItem(PatchNoteItem item) {
        item.attachTo(this);
        items.add(item);
    }

    public void replaceItems(List<PatchNoteItem> replacement, Long userId) {
        items.stream()
                .filter(item -> "N".equals(item.getDelYn()))
                .forEach(item -> item.softDelete(userId));
        replacement.forEach(this::addItem);
    }

    public List<PatchNoteItem> getActiveItems() {
        return items.stream()
                .filter(item -> "N".equals(item.getDelYn()) && "Y".equals(item.getUseYn()))
                .sorted(Comparator.comparingInt(PatchNoteItem::getDisplayOrder)
                        .thenComparing(item -> item.getId() == null ? Long.MAX_VALUE : item.getId()))
                .toList();
    }

    @Override
    public void softDelete(Long userId) {
        super.softDelete(userId);
        items.stream()
                .filter(item -> "N".equals(item.getDelYn()))
                .forEach(item -> item.softDelete(userId));
    }
}
