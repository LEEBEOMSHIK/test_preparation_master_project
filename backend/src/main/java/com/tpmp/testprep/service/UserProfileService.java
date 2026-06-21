package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.NicknameUpdateRequest;
import com.tpmp.testprep.dto.response.UserResponse;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;

    @Transactional
    public UserResponse updateNickname(String email, NicknameUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        String newNickname = request.nickname();

        // 본인의 현재 닉네임과 동일한 경우(대소문자 무시) → no-op 허용 (자기 자신과의 충돌 방지)
        if (newNickname.equalsIgnoreCase(user.getNickname())) {
            return UserResponse.from(user);
        }

        // 타인이 이미 사용 중인 닉네임이면 409 반환
        if (userRepository.existsByNicknameIgnoreCase(newNickname)) {
            throw new BusinessException(ErrorCode.NICKNAME_ALREADY_EXISTS);
        }

        user.updateNickname(newNickname);
        return UserResponse.from(user);
    }
}
