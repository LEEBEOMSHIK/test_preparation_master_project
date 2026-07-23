package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.SupportSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SupportSettingsRepository extends JpaRepository<SupportSettings, Long> {

    Optional<SupportSettings> findFirstByOrderByIdAsc();
}
