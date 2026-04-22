package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.Faq;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FaqRepository extends JpaRepository<Faq, Long> {
    List<Faq> findByIsActiveTrueOrderByDisplayOrderAscCreatedAtAsc();
}
