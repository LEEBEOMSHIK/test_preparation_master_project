package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.MenuConfig;

import java.time.LocalDateTime;
import java.util.List;

public record MenuConfigResponse(
        Long id,
        Long parentId,
        String name,
        String url,
        String iconKey,
        Integer displayOrder,
        String menuType,
        boolean isActive,
        String allowedRoles,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<MenuConfigResponse> children
) {
    public static MenuConfigResponse from(MenuConfig m) {
        return new MenuConfigResponse(
                m.getId(),
                m.getParentId(),
                m.getName(),
                m.getUrl(),
                m.getIconKey(),
                m.getDisplayOrder(),
                m.getMenuType().name(),
                m.isActive(),
                m.getAllowedRoles(),
                m.getCreatedAt(),
                m.getUpdatedAt(),
                List.of()
        );
    }

    public static MenuConfigResponse withChildren(MenuConfig m, List<MenuConfigResponse> children) {
        return new MenuConfigResponse(
                m.getId(),
                m.getParentId(),
                m.getName(),
                m.getUrl(),
                m.getIconKey(),
                m.getDisplayOrder(),
                m.getMenuType().name(),
                m.isActive(),
                m.getAllowedRoles(),
                m.getCreatedAt(),
                m.getUpdatedAt(),
                children
        );
    }
}
