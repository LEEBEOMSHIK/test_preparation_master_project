package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.Attachment;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.AttachmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;

    @Value("${app.upload.path:./uploads}")
    private String uploadPath;

    private static final List<String> ALLOWED_IMAGE_MIME =
            List.of("image/jpeg", "image/png", "image/gif", "image/webp");

    @Transactional
    public Attachment saveImage(MultipartFile file, Attachment.RefType refType) {
        if (file.isEmpty()) throw new BusinessException(ErrorCode.INVALID_INPUT);
        String mime = file.getContentType();
        if (mime == null || !ALLOWED_IMAGE_MIME.contains(mime))
            throw new BusinessException(ErrorCode.UNSUPPORTED_FILE_TYPE);

        String original = file.getOriginalFilename();
        String ext = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf('.') + 1).toLowerCase()
                : "jpg";

        String storedFilename = UUID.randomUUID() + "." + ext;
        Path dest = Paths.get(uploadPath, "images", storedFilename);
        try {
            Files.createDirectories(dest.getParent());
            file.transferTo(dest);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_PARSE_FAILED);
        }

        String fileUrl = "/uploads/images/" + storedFilename;
        Attachment attachment = Attachment.builder()
                .originalFilename(original != null ? original : storedFilename)
                .storedFilename(storedFilename)
                .fileUrl(fileUrl)
                .fileSize(file.getSize())
                .mimeType(mime)
                .refType(refType)
                .build();

        return attachmentRepository.save(attachment);
    }

    @Transactional
    public void linkAttachments(List<Long> ids, Long refId) {
        if (ids == null || ids.isEmpty()) return;
        List<Attachment> attachments = attachmentRepository.findAllById(ids);
        attachments.forEach(a -> a.linkTo(refId));
        attachmentRepository.saveAll(attachments);
    }

    public List<Attachment> findByRef(Attachment.RefType refType, Long refId) {
        return attachmentRepository.findByRefTypeAndRefId(refType, refId);
    }

    public List<Attachment> findByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        return attachmentRepository.findAllById(ids);
    }
}
