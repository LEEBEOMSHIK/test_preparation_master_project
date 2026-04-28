package com.tpmp.testprep.security.oauth2;

import com.tpmp.testprep.entity.PermissionDetail;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.repository.UserRepository;
import com.tpmp.testprep.security.jwt.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @Value("${app.jwt.refresh-token-expiry}")
    private long refreshTokenExpiry;

    @Value("${app.oauth2.frontend-redirect-uri}")
    private String frontendRedirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("OAuth user not found: " + email));

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

        getRedirectStrategy().sendRedirect(request, response, frontendRedirectUri + "?token=" + accessToken);
    }
}
