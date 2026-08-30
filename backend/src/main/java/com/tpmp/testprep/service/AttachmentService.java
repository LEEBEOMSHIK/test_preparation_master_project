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
import com.tpmp.testprep.entity.User;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;

    @Value("${app.upload.path:./uploads}")
    private String uploadPath;

    private static final List<String> ALLOWED_IMAGE_MIME =
            List.of("image/jpeg", "image/png", "image/gif", "image/webp");

    private static final List<String> ALLOWED_IMAGE_EXTENSIONS =
            List.of("jpg", "jpeg", "png", "gif", "webp");

    @Transactional
    public Attachment saveImage(MultipartFile file, Attachment.RefType refType) {
        return saveImage(file, refType, null);
    }

    @Transactional
    public Attachment saveImage(MultipartFile file, Attachment.RefType refType, User uploadedBy) {
        if ((refType == Attachment.RefType.INQUIRY || refType == Attachment.RefType.INQUIRY_MESSAGE)
                && uploadedBy == null) {
            throw new BusinessException(ErrorCode.INVALID_INQUIRY_ATTACHMENT);
        }
        if (file.isEmpty()) throw new BusinessException(ErrorCode.INVALID_INPUT);
        String mime = file.getContentType();
        if (mime == null || !ALLOWED_IMAGE_MIME.contains(mime))
            throw new BusinessException(ErrorCode.UNSUPPORTED_FILE_TYPE);

        String original = file.getOriginalFilename();
        String ext = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf('.') + 1).toLowerCase()
                : "jpg";
        if (!ALLOWED_IMAGE_EXTENSIONS.contains(ext))
            throw new BusinessException(ErrorCode.UNSUPPORTED_FILE_TYPE);

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
                .uploadedBy(uploadedBy)
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

    @Transactional
    public void validateAndLinkInquiryAttachments(List<Long> ids, Attachment.RefType refType, Long refId, User uploadedBy) {
        if (ids == null || ids.isEmpty()) return;
        if (ids.size() > 3 || ids.stream().distinct().count() != ids.size()) {
            throw new BusinessException(ErrorCode.INVALID_INQUIRY_ATTACHMENT);
        }
        List<Attachment> attachments = attachmentRepository.findAllById(ids);
        if (attachments.size() != ids.size() || attachments.stream().anyMatch(attachment ->
                attachment.getRefType() != refType || attachment.getRefId() != null
                        || !isOwner(attachment.getUploadedBy(), uploadedBy))) {
            throw new BusinessException(ErrorCode.INVALID_INQUIRY_ATTACHMENT);
        }
        attachments.forEach(attachment -> attachment.linkTo(refId));
        attachmentRepository.saveAll(attachments);
    }

    private boolean isOwner(User uploadedBy, User expectedOwner) {
        if (uploadedBy == null || expectedOwner == null) return false;
        if (uploadedBy == expectedOwner) return true;
        return uploadedBy.getId() != null && uploadedBy.getId().equals(expectedOwner.getId());
    }

    public List<Attachment> findByRef(Attachment.RefType refType, Long refId) {
        return attachmentRepository.findByRefTypeAndRefId(refType, refId);
    }

    public List<Attachment> findByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        return attachmentRepository.findAllById(ids);
    }
}
