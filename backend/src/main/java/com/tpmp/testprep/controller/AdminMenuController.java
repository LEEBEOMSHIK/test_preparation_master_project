package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.MenuConfigRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.MenuConfigResponse;
import com.tpmp.testprep.entity.MenuConfig;
import com.tpmp.testprep.service.MenuConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/menus")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminMenuController {

    private final MenuConfigService menuConfigService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MenuConfigResponse>>> getMenus(
            @RequestParam(defaultValue = "ADMIN") MenuConfig.MenuType menuType,
            @RequestParam(defaultValue = "false") boolean treeView,
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        List<MenuConfigResponse> result = treeView
                ? menuConfigService.getMenuTree(menuType, activeOnly)
                : menuConfigService.getAllFlat(menuType);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MenuConfigResponse>> create(
            @Valid @RequestBody MenuConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success(menuConfigService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MenuConfigResponse>> update(
            @PathVariable Long id, @Valid @RequestBody MenuConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success(menuConfigService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        menuConfigService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
