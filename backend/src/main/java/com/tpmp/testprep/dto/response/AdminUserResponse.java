package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.User;

import java.time.LocalDateTime;

public record AdminUserResponse(
        Long id,
        String email,
        String name,
        String role,
        LocalDateTime createdAt
) {
    public static AdminUserResponse from(User u) {
        return new AdminUserResponse(u.getId(), u.getEmail(), u.getName(), u.getRole().name(), u.getCreatedAt());
    }
}
