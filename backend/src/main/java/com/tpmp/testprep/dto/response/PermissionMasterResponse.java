package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.PermissionMaster;

import java.time.LocalDateTime;
import java.util.List;

public record PermissionMasterResponse(
        Long id,
        String code,
        String name,
        String description,
        String scope,
        LocalDateTime createdAt,
        List<PermissionDetailResponse> details,
        List<Long> allowedMenuIds,
        long userCount
) {
    public static PermissionMasterResponse from(PermissionMaster m, List<Long> allowedMenuIds, long userCount,
                                                List<PermissionDetailResponse> details) {
        PermissionMaster.PermissionScope scope = m.getScope();
        return new PermissionMasterResponse(
                m.getId(),
                m.getCode(),
                m.getName(),
                m.getDescription(),
                scope != null ? scope.name() : "ADMIN",
                m.getCreatedAt(),
                details,
                allowedMenuIds,
                userCount
        );
    }

    public static PermissionMasterResponse from(PermissionMaster m, List<Long> allowedMenuIds, long userCount) {
        return from(m, allowedMenuIds, userCount,
                m.getDetails().stream().map(PermissionDetailResponse::from).toList());
    }

    public static PermissionMasterResponse from(PermissionMaster m) {
        return from(m, List.of(), 0L);
    }
}
