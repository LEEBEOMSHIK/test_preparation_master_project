package com.tpmp.testprep.security.jwt;

import com.tpmp.testprep.entity.User;
import jakarta.servlet.http.Cookie;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Refresh Token 쿠키 이름·생성 로직을 역할(USER/ADMIN)별로 분리해 공용으로 제공한다.
 *
 * <p>Refresh Token 쿠키는 origin 단위로 공유되어 탭 격리가 되지 않는다. 동일 브라우저에서
 * 사용자 탭과 관리자 탭을 동시에 열면 쿠키 이름이 하나(`refresh_token`)일 때 나중에 로그인한
 * 쪽이 먼저 로그인한 쪽의 쿠키를 덮어써, 세션이 조용히 다른 계정으로 전환되는 문제가 있었다.
 * 이를 막기 위해 쿠키 이름 자체를 role 기준으로 분리한다.</p>
 */
@Component
public class RefreshTokenCookieProvider {

    public static final String COOKIE_NAME_USER = "refresh_token_user";
    public static final String COOKIE_NAME_ADMIN = "refresh_token_admin";

    /** role 분리 이전 사용하던 레거시 쿠키 이름. 신규 로그인 응답에서 즉시 만료시켜 브라우저에서 정리한다. */
    public static final String LEGACY_COOKIE_NAME = "refresh_token";

    @Value("${app.jwt.refresh-token-expiry}")
    private long refreshTokenExpiry;

    public String cookieNameFor(User.Role role) {
        return role == User.Role.ADMIN ? COOKIE_NAME_ADMIN : COOKIE_NAME_USER;
    }

    public Cookie createCookie(User.Role role, String refreshToken) {
        Cookie cookie = new Cookie(cookieNameFor(role), refreshToken);
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth");
        cookie.setMaxAge((int) (refreshTokenExpiry / 1000));
        return cookie;
    }

    /** 레거시 `refresh_token` 쿠키를 즉시 만료시키는 쿠키를 생성한다. */
    public Cookie createLegacyExpiredCookie() {
        Cookie cookie = new Cookie(LEGACY_COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth");
        cookie.setMaxAge(0);
        return cookie;
    }
}
