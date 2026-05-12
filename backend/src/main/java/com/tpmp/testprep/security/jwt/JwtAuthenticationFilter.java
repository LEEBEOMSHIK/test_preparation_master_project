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
        // /api/auth/** 는 토큰 없이 접근하는 인증 엔드포인트 — 만료 토큰 차단 대상에서 제외
        String path = request.getServletPath();
        return path.startsWith("/api/auth/") || path.startsWith("/api/oauth2/") || path.startsWith("/api/login/oauth2/");
    }

    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
