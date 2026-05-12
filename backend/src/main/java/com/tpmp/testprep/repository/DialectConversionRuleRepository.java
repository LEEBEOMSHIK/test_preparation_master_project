package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.DialectConversionRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DialectConversionRuleRepository extends JpaRepository<DialectConversionRule, Long> {

    List<DialectConversionRule> findAllByOrderByDialectAscDisplayOrderAsc();

    List<DialectConversionRule> findByDialectOrderByDisplayOrder(String dialect);

    List<DialectConversionRule> findByEnabledTrue();

    boolean existsByRuleKey(String ruleKey);
}
