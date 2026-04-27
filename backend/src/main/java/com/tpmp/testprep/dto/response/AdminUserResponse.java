package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.User;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

public record AdminUserResponse(
        Long id,
        String email,
        String name,
        String role,
        LocalDateTime createdAt,
        List<GrantedPermissionInfo> grantedPermissions
) {
    public record GrantedPermissionInfo(Long id, String name, String code) {}

    public static AdminUserResponse from(User u) {
        List<GrantedPermissionInfo> perms = u.getGrantedPermissions().stream()
                .map(p -> new GrantedPermissionInfo(p.getId(), p.getName(), p.getCode()))
                .sorted(Comparator.comparing(GrantedPermissionInfo::name))
                .toList();
        return new AdminUserResponse(
                u.getId(), u.getEmail(), u.getName(), u.getRole().name(), u.getCreatedAt(), perms);
    }
}
