package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.PasswordResetRequest;
import com.tpmp.testprep.dto.request.UserUpdateRequest;
import com.tpmp.testprep.dto.response.AdminUserResponse;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminUserResponse>>> getAll(
            @RequestParam(required = false) String role) {
        List<AdminUserResponse> users = (role != null && !role.isBlank())
                ? adminUserService.getByRole(User.Role.valueOf(role))
                : adminUserService.getAll();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminUserService.getOne(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> update(
            @PathVariable Long id, @Valid @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(adminUserService.update(id, request)));
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable Long id, @Valid @RequestBody PasswordResetRequest request) {
        adminUserService.resetPassword(id, request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        adminUserService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/{id}/permissions")
    public ResponseEntity<ApiResponse<List<Long>>> getUserPermissions(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminUserService.getUserPermissions(id)));
    }

    @PutMapping("/{id}/permissions")
    public ResponseEntity<ApiResponse<Void>> updateUserPermissions(
            @PathVariable Long id, @RequestBody List<Long> detailIds) {
        adminUserService.updateUserPermissions(id, detailIds);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
