package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.entity.UserInterestedExam;

import java.util.List;

public record UserResponse(Long id, String email, String name, String role,
                           boolean isFirstLogin,
                           List<String> interestedExamTypes,
                           List<Long> interestedExamSlaveIds) {

    public static UserResponse from(User user, List<UserInterestedExam> interests) {
        List<String> names = interests.stream()
                .map(uie -> uie.getDomainSlave().getName())
                .toList();
        List<Long> ids = interests.stream()
                .map(uie -> uie.getDomainSlave().getId())
                .toList();
        return new UserResponse(
                user.getId(), user.getEmail(), user.getName(), user.getRole().name(),
                Boolean.TRUE.equals(user.getIsFirstLogin()),
                names, ids
        );
    }

    /** 관심 시험 조회 없이 빌드 — interests 별도 전달 필요 없는 컨텍스트 전용 */
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(), user.getEmail(), user.getName(), user.getRole().name(),
                Boolean.TRUE.equals(user.getIsFirstLogin()),
                List.of(), List.of()
        );
    }
}
