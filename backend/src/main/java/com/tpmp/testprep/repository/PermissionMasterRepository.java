package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.PermissionMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PermissionMasterRepository extends JpaRepository<PermissionMaster, Long> {
    Optional<PermissionMaster> findByCode(String code);
    boolean existsByCode(String code);
}
