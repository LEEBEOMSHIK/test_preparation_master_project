package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.PasswordResetRequest;
import com.tpmp.testprep.dto.request.UserUpdateRequest;
import com.tpmp.testprep.dto.response.AdminUserResponse;
import com.tpmp.testprep.entity.PermissionDetail;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.repository.PermissionDetailRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PermissionDetailRepository permissionDetailRepository;

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAll() {
        return userRepository.findAllWithPermissionsOrderByCreatedAtDesc().stream()
                .map(AdminUserResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getByRole(User.Role role) {
        return userRepository.findAllWithPermissionsByRoleOrderByCreatedAtDesc(role).stream()
                .map(AdminUserResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getOne(Long id) {
        User user = userRepository.findByIdWithPermissions(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        return AdminUserResponse.from(user);
    }

    @Transactional
    public AdminUserResponse update(Long id, UserUpdateRequest request) {
        User user = findOrThrow(id);
        user.updateName(request.name());
        user.updateRole(request.role());
        return AdminUserResponse.from(user);
    }

    @Transactional
    public void resetPassword(Long id, PasswordResetRequest request) {
        User user = findOrThrow(id);
        user.updatePassword(passwordEncoder.encode(request.newPassword()));
    }

    @Transactional
    public void delete(Long id) {
        if (!userRepository.existsById(id)) throw new IllegalArgumentException("User not found: " + id);
        userRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Long> getUserPermissions(Long userId) {
        User user = findOrThrow(userId);
        return user.getGrantedPermissions().stream().map(PermissionDetail::getId).toList();
    }

    @Transactional
    public void updateUserPermissions(Long userId, List<Long> detailIds) {
        User user = findOrThrow(userId);
        Set<PermissionDetail> details = new HashSet<>(permissionDetailRepository.findAllById(detailIds));
        user.setGrantedPermissions(details);
    }

    private User findOrThrow(Long id) {
        return userRepository.findByIdWithPermissions(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
    }
}
