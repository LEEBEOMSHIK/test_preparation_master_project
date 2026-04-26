package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.User;

import java.util.Arrays;
import java.util.List;

public record UserResponse(Long id, String email, String name, String role,
                           boolean isFirstLogin, List<String> interestedExamTypes) {
    public static UserResponse from(User user) {
        List<String> examTypes = user.getInterestedExamTypes() != null && !user.getInterestedExamTypes().isBlank()
                ? Arrays.asList(user.getInterestedExamTypes().split(","))
                : List.of();
        return new UserResponse(
                user.getId(), user.getEmail(), user.getName(), user.getRole().name(),
                Boolean.TRUE.equals(user.getIsFirstLogin()),
                examTypes
        );
    }
}
