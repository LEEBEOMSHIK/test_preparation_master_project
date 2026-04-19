package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.Quote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface QuoteRepository extends JpaRepository<Quote, Long> {

    @Query(value = "SELECT * FROM quotes WHERE use_yn = 'Y' ORDER BY RANDOM() LIMIT 1", nativeQuery = true)
    Optional<Quote> findRandomActive();
}
