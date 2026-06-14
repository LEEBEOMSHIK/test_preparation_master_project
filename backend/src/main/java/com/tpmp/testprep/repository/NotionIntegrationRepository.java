package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.NotionIntegration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NotionIntegrationRepository extends JpaRepository<NotionIntegration, Long> {
    Optional<NotionIntegration> findByUserId(Long userId);
    void deleteByUserId(Long userId);
    boolean existsByUserId(Long userId);
}
