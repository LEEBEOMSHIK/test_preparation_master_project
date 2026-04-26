package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "menu_config")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MenuConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 200)
    private String url;

    @Column(name = "icon_key", length = 50)
    private String iconKey;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "menu_type", nullable = false, length = 20)
    private MenuType menuType;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    // comma-separated role codes that can see this menu, e.g. "ADMIN" or "USER,ADMIN"
    @Column(name = "allowed_roles", length = 200)
    private String allowedRoles;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Builder
    public MenuConfig(Long parentId, String name, String url, String iconKey,
                      Integer displayOrder, MenuType menuType, boolean isActive, String allowedRoles) {
        this.parentId = parentId;
        this.name = name;
        this.url = url;
        this.iconKey = iconKey;
        this.displayOrder = displayOrder;
        this.menuType = menuType;
        this.isActive = isActive;
        this.allowedRoles = allowedRoles;
    }

    public void update(Long parentId, String name, String url, String iconKey,
                       Integer displayOrder, boolean isActive, String allowedRoles) {
        this.parentId = parentId;
        this.name = name;
        this.url = url;
        this.iconKey = iconKey;
        this.displayOrder = displayOrder;
        this.isActive = isActive;
        this.allowedRoles = allowedRoles;
    }

    public enum MenuType {
        USER, ADMIN
    }
}
