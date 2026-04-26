package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    List<Attachment> findByRefTypeAndRefId(Attachment.RefType refType, Long refId);
}
