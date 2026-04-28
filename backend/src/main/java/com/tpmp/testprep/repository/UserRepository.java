package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByProviderAndProviderId(String provider, String providerId);
    long countByRole(User.Role role);

    /** 세부 권한 포함 전체 조회 (N+1 방지) */
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.grantedPermissions ORDER BY u.createdAt DESC")
    List<User> findAllWithPermissionsOrderByCreatedAtDesc();

    /** 세부 권한 포함 역할별 조회 */
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.grantedPermissions WHERE u.role = :role ORDER BY u.createdAt DESC")
    List<User> findAllWithPermissionsByRoleOrderByCreatedAtDesc(@Param("role") User.Role role);

    /** 세부 권한 포함 단건 조회 */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.grantedPermissions WHERE u.id = :id")
    Optional<User> findByIdWithPermissions(@Param("id") Long id);
}
