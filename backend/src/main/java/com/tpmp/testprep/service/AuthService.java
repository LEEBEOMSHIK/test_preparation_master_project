package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.LoginRequest;
import com.tpmp.testprep.dto.request.SignupRequest;
import com.tpmp.testprep.dto.response.LoginResponse;
import com.tpmp.testprep.dto.response.UserResponse;
import com.tpmp.testprep.entity.PermissionDetail;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.UserRepository;
import com.tpmp.testprep.security.jwt.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.jwt.refresh-token-expiry}")
    private long refreshTokenExpiry;

    @Transactional
    public void signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .name(request.name())
                .role(User.Role.USER)
                .build();
        userRepository.save(user);
    }

    public LoginResponse login(LoginRequest request, HttpServletResponse response) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        List<String> permCodes = user.getGrantedPermissions().stream()
                .map(PermissionDetail::getCode)
                .filter(c -> c != null && !c.isBlank())
                .toList();
        String accessToken = jwtTokenProvider.createAccessToken(user.getEmail(), user.getRole().name(), permCodes);
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getEmail());

        Cookie cookie = new Cookie("refresh_token", refreshToken);
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth");
        cookie.setMaxAge((int) (refreshTokenExpiry / 1000));
        response.addCookie(cookie);

        return new LoginResponse(accessToken, UserResponse.from(user));
    }

    public LoginResponse refresh(String refreshToken) {
        if (refreshToken == null || !jwtTokenProvider.validate(refreshToken)) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }
        String email = jwtTokenProvider.getEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        List<String> permCodes = user.getGrantedPermissions().stream()
                .map(PermissionDetail::getCode)
                .filter(c -> c != null && !c.isBlank())
                .toList();
        String newAccessToken = jwtTokenProvider.createAccessToken(email, user.getRole().name(), permCodes);
        return new LoginResponse(newAccessToken, UserResponse.from(user));
    }

    public UserResponse me(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        return UserResponse.from(user);
    }
}
