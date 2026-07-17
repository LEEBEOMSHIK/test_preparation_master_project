package com.tpmp.testprep.security.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = resolveToken(request);

        if (StringUtils.hasText(token)) {
            if (jwtTokenProvider.validate(token)) {
                String email = jwtTokenProvider.getEmail(token);
                String role  = jwtTokenProvider.getRole(token);
                String perms = jwtTokenProvider.getPermissions(token);

                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                if (role != null) authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                if (perms != null && !perms.isBlank()) {
                    for (String p : perms.split(",")) {
                        String t = p.trim();
                        if (!t.isEmpty()) authorities.add(new SimpleGrantedAuthority(t));
                    }
                }
                var auth = new UsernamePasswordAuthenticationToken(email, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);
            } else if (isTokenOptionalEndpoint(request.getServletPath())) {
                // 로그인/재발급/회원가입 등 토큰 없이도 접근하는 엔드포인트:
                // 만료된 토큰이 헤더에 남아 있어도 무시하고 그대로 진행 (401로 막지 않음)
                SecurityContextHolder.clearContext();
            } else {
                // 토큰이 존재하지만 만료/무효 → 세션 auth 간섭 차단 후 즉시 401 반환
                // 프론트엔드 인터셉터가 401을 받아 Refresh Token으로 재발급을 시도하도록 한다
                SecurityContextHolder.clearContext();
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"success\":false,\"message\":\"토큰이 만료되었습니다. 재인증이 필요합니다.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // OAuth2 로그인 흐름은 Bearer 토큰을 사용하지 않으므로 토큰 처리 자체를 건너뛴다.
        // /api/auth/** 는 더 이상 전체 제외하지 않는다 — /api/auth/me 처럼 인증이 필요한
        // 엔드포인트가 토큰을 검증받을 수 있어야 하기 때문. (만료 토큰 허용은 아래 isTokenOptionalEndpoint로 처리)
        String path = request.getServletPath();
        return path.startsWith("/api/oauth2/") || path.startsWith("/api/login/oauth2/");
    }

    /** 토큰 없이/만료된 토큰으로도 접근 가능해야 하는 엔드포인트 (로그인·재발급·회원가입·로그아웃). */
    private boolean isTokenOptionalEndpoint(String path) {
        // 로그아웃은 accessToken이 이미 만료된 상태에서도 호출될 수 있으므로 토큰 만료를 이유로 막지 않는다.
        return path.equals("/api/auth/login")
                || path.equals("/api/auth/refresh")
                || path.equals("/api/auth/signup")
                || path.equals("/api/auth/logout");
    }

    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
