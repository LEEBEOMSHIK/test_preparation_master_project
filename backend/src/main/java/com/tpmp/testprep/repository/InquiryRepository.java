package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.Inquiry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InquiryRepository extends JpaRepository<Inquiry, Long> {
    Page<Inquiry> findByUserId(Long userId, Pageable pageable);
    Page<Inquiry> findByStatus(Inquiry.Status status, Pageable pageable);
}
