package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.PermissionDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PermissionDetailRepository extends JpaRepository<PermissionDetail, Long> {
    List<PermissionDetail> findByMasterId(Long masterId);
}
