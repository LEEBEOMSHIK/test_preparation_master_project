package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.PermissionMaster;

import java.time.LocalDateTime;
import java.util.List;

public record PermissionMasterResponse(
        Long id,
        String code,
        String name,
        String description,
        LocalDateTime createdAt,
        List<PermissionDetailResponse> details
) {
    public static PermissionMasterResponse from(PermissionMaster m) {
        return new PermissionMasterResponse(
                m.getId(),
                m.getCode(),
                m.getName(),
                m.getDescription(),
                m.getCreatedAt(),
                m.getDetails().stream().map(PermissionDetailResponse::from).toList()
        );
    }
}
