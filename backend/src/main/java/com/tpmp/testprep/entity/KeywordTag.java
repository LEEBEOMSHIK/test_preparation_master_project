package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "keyword_tag",
    uniqueConstraints = @UniqueConstraint(name = "uq_keyword_tag_name_type", columnNames = {"name", "type"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class KeywordTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TagType type;

    @Column(name = "use_count", nullable = false)
    private int useCount = 1;

    public enum TagType { KEYWORD, DOMAIN }

    @Builder
    public KeywordTag(String name, TagType type) {
        this.name = name;
        this.type = type;
    }

    public void incrementUseCount() {
        this.useCount++;
    }
}
