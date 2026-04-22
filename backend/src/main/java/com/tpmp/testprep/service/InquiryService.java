package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.InquiryReplyRequest;
import com.tpmp.testprep.dto.request.InquiryRequest;
import com.tpmp.testprep.dto.response.InquiryResponse;
import com.tpmp.testprep.entity.Inquiry;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.InquiryRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
public class InquiryService {

    private final InquiryRepository inquiryRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.path:./uploads}")
    private String uploadPath;

    private static final List<String> ALLOWED_IMAGE_MIME =
            List.of("image/jpeg", "image/png", "image/gif", "image/webp");

    // ── User ─────────────────────────────────────────────────────────────────

    public Page<InquiryResponse> getMyInquiries(String email, Inquiry.Status status, Pageable pageable) {
        User user = findUser(email);
        Page<Inquiry> page = (status != null)
                ? inquiryRepository.findByUserIdAndStatus(user.getId(), status, pageable)
                : inquiryRepository.findByUserId(user.getId(), pageable);
        return page.map(InquiryResponse::from);
    }

    public InquiryResponse getMyInquiry(Long id, String email) {
        Inquiry inquiry = findInquiry(id);
        checkOwner(inquiry, email);
        return InquiryResponse.from(inquiry);
    }

    @Transactional
    public InquiryResponse create(InquiryRequest request, String email) {
        User user = findUser(email);
        String imageUrlsStr = (request.imageUrls() != null && !request.imageUrls().isEmpty())
                ? String.join(",", request.imageUrls())
                : null;
        Inquiry inquiry = Inquiry.builder()
                .user(user)
                .title(request.title())
                .content(request.content())
                .inquiryType(request.inquiryType())
                .imageUrls(imageUrlsStr)
                .build();
        return InquiryResponse.from(inquiryRepository.save(inquiry));
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

    public String uploadImage(MultipartFile image) {
        if (image.isEmpty()) throw new BusinessException(ErrorCode.INVALID_INPUT);
        String mime = image.getContentType();
        if (mime == null || !ALLOWED_IMAGE_MIME.contains(mime))
            throw new BusinessException(ErrorCode.UNSUPPORTED_FILE_TYPE);

        String origName = image.getOriginalFilename();
        String ext = (origName != null && origName.contains("."))
                ? origName.substring(origName.lastIndexOf('.') + 1).toLowerCase()
                : "jpg";

        String filename = UUID.randomUUID() + "." + ext;
        Path dest = Paths.get(uploadPath, "images", filename);
        try {
            Files.createDirectories(dest.getParent());
            image.transferTo(dest);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_PARSE_FAILED);
        }
        return "/uploads/images/" + filename;
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    public Page<InquiryResponse> adminGetAll(Inquiry.Status status, Pageable pageable) {
        Page<Inquiry> page = (status != null)
                ? inquiryRepository.findByStatus(status, pageable)
                : inquiryRepository.findAll(pageable);
        return page.map(InquiryResponse::from);
    }

    public InquiryResponse adminGetOne(Long id) {
        return InquiryResponse.from(findInquiry(id));
    }

    @Transactional
    public InquiryResponse adminReply(Long id, InquiryReplyRequest request) {
        Inquiry inquiry = findInquiry(id);
        inquiry.reply(request.reply());
        return InquiryResponse.from(inquiry);
    }

    @Transactional
    public InquiryResponse adminToggleHold(Long id) {
        Inquiry inquiry = findInquiry(id);
        inquiry.toggleHold();
        return InquiryResponse.from(inquiry);
    }

    @Transactional
    public void adminDelete(Long id) {
        inquiryRepository.delete(findInquiry(id));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

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
