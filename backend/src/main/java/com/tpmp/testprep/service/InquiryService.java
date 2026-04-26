package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.InquiryReplyRequest;
import com.tpmp.testprep.dto.request.InquiryRequest;
import com.tpmp.testprep.dto.response.InquiryResponse;
import com.tpmp.testprep.entity.Attachment;
import com.tpmp.testprep.entity.Inquiry;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.InquiryRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InquiryService {

    private final InquiryRepository inquiryRepository;
    private final UserRepository userRepository;
    private final AttachmentService attachmentService;

    // ── User ─────────────────────────────────────────────────────────────────

    public Page<InquiryResponse> getMyInquiries(String email, Inquiry.Status status, Pageable pageable) {
        User user = findUser(email);
        Page<Inquiry> page = (status != null)
                ? inquiryRepository.findByUserIdAndStatus(user.getId(), status, pageable)
                : inquiryRepository.findByUserId(user.getId(), pageable);
        return page.map(inquiry -> toResponse(inquiry));
    }

    public InquiryResponse getMyInquiry(Long id, String email) {
        Inquiry inquiry = findInquiry(id);
        checkOwner(inquiry, email);
        return toResponse(inquiry);
    }

    @Transactional
    public InquiryResponse create(InquiryRequest request, String email) {
        User user = findUser(email);

        // Resolve attachment URLs for imageUrls TEXT field
        List<Attachment> attachments = attachmentService.findByIds(request.attachmentIds());
        String imageUrlsStr = attachments.isEmpty()
                ? null
                : String.join(",", attachments.stream().map(Attachment::getFileUrl).toList());

        Inquiry inquiry = Inquiry.builder()
                .user(user)
                .title(request.title())
                .content(request.content())
                .inquiryType(request.inquiryType())
                .imageUrls(imageUrlsStr)
                .build();
        Inquiry saved = inquiryRepository.save(inquiry);

        // Link attachments to the new inquiry
        if (request.attachmentIds() != null && !request.attachmentIds().isEmpty()) {
            attachmentService.linkAttachments(request.attachmentIds(), saved.getId());
        }

        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id, String email) {
        Inquiry inquiry = findInquiry(id);
        checkOwner(inquiry, email);
        if (inquiry.getStatus() != Inquiry.Status.PENDING) {
            throw new BusinessException(ErrorCode.INQUIRY_ACCESS_DENIED);
        }
        inquiryRepository.delete(inquiry);
    }

    public record UploadResult(Long id, String url) {}

    @Transactional
    public UploadResult uploadImage(MultipartFile image) {
        Attachment attachment = attachmentService.saveImage(image, Attachment.RefType.INQUIRY);
        return new UploadResult(attachment.getId(), attachment.getFileUrl());
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    public Page<InquiryResponse> adminGetAll(Inquiry.Status status, Pageable pageable) {
        Page<Inquiry> page = (status != null)
                ? inquiryRepository.findByStatus(status, pageable)
                : inquiryRepository.findAll(pageable);
        return page.map(inquiry -> toResponse(inquiry));
    }

    public InquiryResponse adminGetOne(Long id) {
        return toResponse(findInquiry(id));
    }

    @Transactional
    public InquiryResponse adminReply(Long id, InquiryReplyRequest request) {
        Inquiry inquiry = findInquiry(id);
        inquiry.reply(request.reply());
        return toResponse(inquiry);
    }

    @Transactional
    public InquiryResponse adminToggleHold(Long id) {
        Inquiry inquiry = findInquiry(id);
        inquiry.toggleHold();
        return toResponse(inquiry);
    }

    @Transactional
    public void adminDelete(Long id) {
        inquiryRepository.delete(findInquiry(id));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private InquiryResponse toResponse(Inquiry inquiry) {
        // Prefer attachment table; fall back to legacy imageUrls TEXT field
        List<Attachment> attachments = attachmentService.findByRef(Attachment.RefType.INQUIRY, inquiry.getId());
        List<String> imageUrls;
        if (!attachments.isEmpty()) {
            imageUrls = attachments.stream().map(Attachment::getFileUrl).toList();
        } else if (inquiry.getImageUrls() != null && !inquiry.getImageUrls().isBlank()) {
            imageUrls = java.util.Arrays.stream(inquiry.getImageUrls().split(","))
                    .map(String::trim).filter(s -> !s.isEmpty()).toList();
        } else {
            imageUrls = List.of();
        }
        return InquiryResponse.fromWithUrls(inquiry, imageUrls);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    private Inquiry findInquiry(Long id) {
        return inquiryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.INQUIRY_NOT_FOUND));
    }

    private void checkOwner(Inquiry inquiry, String email) {
        if (!inquiry.getUser().getEmail().equals(email)) {
            throw new BusinessException(ErrorCode.INQUIRY_ACCESS_DENIED);
        }
    }
}
