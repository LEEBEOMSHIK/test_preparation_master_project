package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.Attachment;

import java.time.LocalDateTime;

public record AttachmentResponse(
        Long id,
        String originalFilename,
        String fileUrl,
        Long fileSize,
        String mimeType,
        String refType,
        Long refId,
        LocalDateTime createdAt
) {
    public static AttachmentResponse from(Attachment a) {
        return new AttachmentResponse(
                a.getId(),
                a.getOriginalFilename(),
                a.getFileUrl(),
                a.getFileSize(),
                a.getMimeType(),
                a.getRefType() != null ? a.getRefType().name() : null,
                a.getRefId(),
                a.getCreatedAt()
        );
    }
}
