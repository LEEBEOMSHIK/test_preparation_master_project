package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.MenuConfigResponse;
import com.tpmp.testprep.entity.MenuConfig;
import com.tpmp.testprep.service.MenuConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
}
