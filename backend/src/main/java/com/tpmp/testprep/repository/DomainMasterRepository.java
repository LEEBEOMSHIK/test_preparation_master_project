package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.DomainMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DomainMasterRepository extends JpaRepository<DomainMaster, Long> {

    /** 슬레이브 목록을 함께 조회 (N+1 방지) */
    @Query("SELECT DISTINCT dm FROM DomainMaster dm LEFT JOIN FETCH dm.slaves ORDER BY dm.id")
    List<DomainMaster> findAllWithSlaves();

    Optional<DomainMaster> findByName(String name);
}
