package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.LoginRequest;
import com.tpmp.testprep.dto.request.SignupRequest;
import com.tpmp.testprep.dto.response.LoginResponse;
import com.tpmp.testprep.dto.response.UserResponse;
import com.tpmp.testprep.entity.PermissionDetail;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.entity.UserInterestedExam;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.UserInterestedExamRepository;
import com.tpmp.testprep.repository.UserRepository;
import com.tpmp.testprep.security.LoginRateLimiter;
import com.tpmp.testprep.security.jwt.JwtTokenProvider;
import com.tpmp.testprep.security.jwt.RefreshTokenCookieProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final UserInterestedExamRepository userInterestedExamRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final LoginHistoryService loginHistoryService;
    private final RefreshTokenCookieProvider refreshTokenCookieProvider;
    private final LoginRateLimiter loginRateLimiter;

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
        // id 확정 후 기본 닉네임 설정 (2-step)
        User saved = userRepository.save(user);
        saved.updateNickname("사용자" + saved.getId());
        userRepository.save(saved);
    }

    @Transactional
    public LoginResponse login(LoginRequest request, HttpServletResponse response, HttpServletRequest httpRequest) {
        String ip = resolveClientIp(httpRequest);
        loginRateLimiter.checkAllowed(ip);

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> {
                    loginRateLimiter.recordFailure(ip);
                    return new BusinessException(ErrorCode.INVALID_CREDENTIALS);
                });

        if (user.getPassword() == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
            loginRateLimiter.recordFailure(ip);
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        List<String> permCodes = user.getGrantedPermissions().stream()
                .map(PermissionDetail::getCode)
                .filter(c -> c != null && !c.isBlank())
                .toList();
        String accessToken = jwtTokenProvider.createAccessToken(user.getEmail(), user.getRole().name(), permCodes);
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getEmail());

        response.addCookie(refreshTokenCookieProvider.createCookie(user.getRole(), refreshToken));
        // role 분리 이전 발급된 레거시 refresh_token 쿠키가 남아 있으면 즉시 만료시켜 정리한다.
        response.addCookie(refreshTokenCookieProvider.createLegacyExpiredCookie());

        loginRateLimiter.recordSuccess(ip);

        String userAgent = httpRequest.getHeader("User-Agent");
        if (user.getRole() == User.Role.USER) {
            loginHistoryService.recordLogin(user.getName(), user.getEmail(), ip, userAgent);
        }

        List<UserInterestedExam> interests = userInterestedExamRepository.findByUser(user);
        return new LoginResponse(accessToken, UserResponse.from(user, interests));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
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
        List<UserInterestedExam> interests = userInterestedExamRepository.findByUser(user);
        return new LoginResponse(newAccessToken, UserResponse.from(user, interests));
    }

    /**
     * 로그아웃: role별 refresh 쿠키와 레거시 refresh_token 쿠키를 즉시 만료시킨다.
     * Refresh Token은 stateless JWT이므로 서버 측 블랙리스트 처리는 하지 않는다(쿠키 삭제만으로 충분).
     * accessToken이 이미 만료된 상태에서도 호출될 수 있으므로 인증 정보·DB 조회는 필요하지 않다.
     */
    public void logout(String scope, HttpServletResponse response) {
        User.Role role = "admin".equals(scope) ? User.Role.ADMIN : User.Role.USER;
        response.addCookie(refreshTokenCookieProvider.createExpiredCookie(role));
        response.addCookie(refreshTokenCookieProvider.createLegacyExpiredCookie());
    }

    public UserResponse me(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        List<UserInterestedExam> interests = userInterestedExamRepository.findByUser(user);
        return UserResponse.from(user, interests);
    }
}
