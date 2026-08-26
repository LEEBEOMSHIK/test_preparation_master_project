package com.tpmp.testprep.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
}
