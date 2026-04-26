package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.PermissionDetail;

import java.time.LocalDateTime;

public record PermissionDetailResponse(
        Long id,
        Long masterId,
        String masterCode,
        String masterName,
        String name,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static PermissionDetailResponse from(PermissionDetail d) {
        return new PermissionDetailResponse(
                d.getId(),
                d.getMaster().getId(),
                d.getMaster().getCode(),
                d.getMaster().getName(),
                d.getName(),
                d.getDescription(),
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }
}
