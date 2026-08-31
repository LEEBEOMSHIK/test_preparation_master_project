package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.EmailTemplateBinding;
import com.tpmp.testprep.entity.EmailTemplateEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmailTemplateBindingRepository extends JpaRepository<EmailTemplateBinding, EmailTemplateEvent> {

    Optional<EmailTemplateBinding> findByEventCode(EmailTemplateEvent eventCode);

    List<EmailTemplateBinding> findAllByOrderByEventCodeAsc();

    List<EmailTemplateBinding> findAllByTemplateId(Long templateId);

    long countByTemplateId(Long templateId);
}
