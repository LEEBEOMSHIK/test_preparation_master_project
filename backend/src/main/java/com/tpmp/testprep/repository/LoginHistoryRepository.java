package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.LoginHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {

    Page<LoginHistory> findByLoginAtBetween(LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<LoginHistory> findByMemberNameContainingIgnoreCaseAndLoginAtBetween(
            String memberName, LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<LoginHistory> findByEmailContainingIgnoreCaseAndLoginAtBetween(
            String email, LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<LoginHistory> findByIpAddressContainingAndLoginAtBetween(
            String ipAddress, LocalDateTime from, LocalDateTime to, Pageable pageable);

    long countByLoginAtBetween(LocalDateTime from, LocalDateTime to);
}
