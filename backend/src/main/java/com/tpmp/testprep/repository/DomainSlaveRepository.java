package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.DomainSlave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DomainSlaveRepository extends JpaRepository<DomainSlave, Long> {

    @Query("SELECT s FROM DomainSlave s WHERE s.master.code = :code ORDER BY s.displayOrder")
    List<DomainSlave> findByMasterCode(@Param("code") String code);
}
