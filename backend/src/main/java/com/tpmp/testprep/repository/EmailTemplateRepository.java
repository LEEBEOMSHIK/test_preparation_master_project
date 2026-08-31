package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.EmailTemplate;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Long> {

    @Query("select t from EmailTemplate t where t.deletedAt is null " +
            "and (:keyword is null or lower(t.name) like lower(concat('%', :keyword, '%'))) " +
            "and (:scope is null or t.scope = :scope) and (:active is null or t.active = :active)")
    Page<EmailTemplate> search(@Param("keyword") String keyword,
                               @Param("scope") EmailTemplate.Scope scope,
                               @Param("active") Boolean active,
                               Pageable pageable);

    Optional<EmailTemplate> findByIdAndDeletedAtIsNull(Long id);

    Optional<EmailTemplate> findBySystemKey(String systemKey);

    List<EmailTemplate> findAllByScopeAndDeletedAtIsNullOrderByNameAsc(EmailTemplate.Scope scope);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from EmailTemplate t where t.id = :id and t.deletedAt is null")
    Optional<EmailTemplate> findActiveForUpdate(@Param("id") Long id);
}
