package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.PermissionDetail;

import java.time.LocalDateTime;
import java.util.List;

public record PermissionDetailResponse(
        Long id,
        Long masterId,
        String masterCode,
        String masterName,
        String name,
        String description,
        String code,
        List<Long> allowedMenuIds,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static PermissionDetailResponse from(PermissionDetail d) {
        return from(d, List.of());
    }

    public static PermissionDetailResponse from(PermissionDetail d, List<Long> allowedMenuIds) {
        return new PermissionDetailResponse(
                d.getId(),
                d.getMaster().getId(),
                d.getMaster().getCode(),
                d.getMaster().getName(),
                d.getName(),
                d.getDescription(),
                d.getCode(),
                allowedMenuIds,
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }
}
