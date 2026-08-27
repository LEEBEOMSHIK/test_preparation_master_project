package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.InquiryMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InquiryMessageRepository extends JpaRepository<InquiryMessage, Long> {
    List<InquiryMessage> findByInquiryIdOrderByCreatedAtAscIdAsc(Long inquiryId);
    boolean existsByInquiryId(Long inquiryId);
}
