package com.tpmp.testprep.dto.request;

import com.tpmp.testprep.entity.MenuConfig;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MenuConfigRequest(
        Long parentId,
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 200) String url,
        @Size(max = 50) String iconKey,
        @NotNull Integer displayOrder,
        @NotNull MenuConfig.MenuType menuType,
        boolean isActive,
        @Size(max = 200) String allowedRoles
) {}
