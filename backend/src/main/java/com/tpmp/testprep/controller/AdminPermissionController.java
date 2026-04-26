package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.PermissionDetailRequest;
import com.tpmp.testprep.dto.request.PermissionMasterRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.PermissionDetailResponse;
import com.tpmp.testprep.dto.response.PermissionMasterResponse;
import com.tpmp.testprep.service.PermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/permissions")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminPermissionController {

    private final PermissionService permissionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PermissionMasterResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(permissionService.getAllMasters()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PermissionMasterResponse>> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(permissionService.getMaster(id)));
    }

    @PostMapping("/masters")
    public ResponseEntity<ApiResponse<PermissionMasterResponse>> createMaster(
            @Valid @RequestBody PermissionMasterRequest request) {
        return ResponseEntity.ok(ApiResponse.success(permissionService.createMaster(request)));
    }

    @PutMapping("/masters/{id}")
    public ResponseEntity<ApiResponse<PermissionMasterResponse>> updateMaster(
            @PathVariable Long id, @Valid @RequestBody PermissionMasterRequest request) {
        return ResponseEntity.ok(ApiResponse.success(permissionService.updateMaster(id, request)));
    }

    @DeleteMapping("/masters/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMaster(@PathVariable Long id) {
        permissionService.deleteMaster(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/masters/{id}/menus")
    public ResponseEntity<ApiResponse<List<Long>>> getMenuIds(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(permissionService.getMenuIds(id)));
    }

    @PutMapping("/masters/{id}/menus")
    public ResponseEntity<ApiResponse<Void>> updateMenuAccess(
            @PathVariable Long id, @RequestBody List<Long> menuIds) {
        permissionService.updateMenuAccess(id, menuIds);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/details/{id}/menus")
    public ResponseEntity<ApiResponse<List<Long>>> getDetailMenuIds(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(permissionService.getDetailMenuIds(id)));
    }

    @PutMapping("/details/{id}/menus")
    public ResponseEntity<ApiResponse<Void>> updateDetailMenuAccess(
            @PathVariable Long id, @RequestBody List<Long> menuIds) {
        permissionService.updateDetailMenuAccess(id, menuIds);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/details")
    public ResponseEntity<ApiResponse<PermissionDetailResponse>> createDetail(
            @Valid @RequestBody PermissionDetailRequest request) {
        return ResponseEntity.ok(ApiResponse.success(permissionService.createDetail(request)));
    }

    @PutMapping("/details/{id}")
    public ResponseEntity<ApiResponse<PermissionDetailResponse>> updateDetail(
            @PathVariable Long id, @Valid @RequestBody PermissionDetailRequest request) {
        return ResponseEntity.ok(ApiResponse.success(permissionService.updateDetail(id, request)));
    }

    @DeleteMapping("/details/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDetail(@PathVariable Long id) {
        permissionService.deleteDetail(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
