package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.MenuConfigResponse;
import com.tpmp.testprep.entity.MenuConfig;
import com.tpmp.testprep.service.MenuConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/menus")
@RequiredArgsConstructor
public class MenuController {

    private final MenuConfigService menuConfigService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MenuConfigResponse>>> getMenuTree(
            @RequestParam MenuConfig.MenuType menuType) {
        return ResponseEntity.ok(ApiResponse.success(
                menuConfigService.getMenuTree(menuType, true)));
    }

    /**
     * 현재 로그인 사용자의 권한(JWT authorities)에 기반한 메뉴 트리 반환.
     * 권한 코드가 없으면(슈퍼 어드민 등) 해당 타입의 전체 메뉴를 반환한다.
     */
    @GetMapping("/mine")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<MenuConfigResponse>>> getMyMenus(
            @RequestParam MenuConfig.MenuType menuType,
            Authentication authentication) {
        Set<String> codes = authentication.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .filter(a -> !a.startsWith("ROLE_"))
                .collect(Collectors.toSet());
        return ResponseEntity.ok(ApiResponse.success(
                menuConfigService.getMenuTreeByPermissions(menuType, codes)));
    }
}
