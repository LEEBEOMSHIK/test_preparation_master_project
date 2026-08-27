package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.AdminInquiryMessageRequest;
import com.tpmp.testprep.dto.request.InquiryMessageRequest;
import com.tpmp.testprep.dto.request.InquiryRequest;
import com.tpmp.testprep.dto.request.InquiryStatusUpdateRequest;
import com.tpmp.testprep.dto.response.InquiryDetailResponse;
import com.tpmp.testprep.dto.response.InquiryMessageResponse;
import com.tpmp.testprep.dto.response.InquirySummaryResponse;
import com.tpmp.testprep.entity.Attachment;
import com.tpmp.testprep.entity.Inquiry;
import com.tpmp.testprep.entity.InquiryEmailDelivery;
import com.tpmp.testprep.entity.InquiryMessage;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.InquiryMessageRepository;
import com.tpmp.testprep.repository.InquiryRepository;
import com.tpmp.testprep.repository.UserRepository;
import com.tpmp.testprep.repository.DomainSlaveRepository;
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
    private final InquiryMessageRepository inquiryMessageRepository;
    private final DomainSlaveRepository domainSlaveRepository;
    private final InquiryEmailService inquiryEmailService;

    public Page<InquirySummaryResponse> getMyInquiries(String email, Inquiry.Status status, Pageable pageable) {
        User user = findUser(email);
        return (status == null ? inquiryRepository.findByUserId(user.getId(), pageable)
                : inquiryRepository.findByUserIdAndStatus(user.getId(), status, pageable)).map(InquirySummaryResponse::from);
    }

    public InquiryDetailResponse getMyInquiry(Long id, String email) {
        Inquiry inquiry = findInquiry(id);
        checkOwner(inquiry, email);
        return toDetail(inquiry);
    }

    @Transactional
    public InquiryDetailResponse create(InquiryRequest request, String email) {
        validateRequest(request);
        User user = findUser(email);
        Inquiry saved = inquiryRepository.save(Inquiry.builder().user(user).title(request.title()).content(request.content())
                .requestType(request.requestType()).targetArea(targetArea(request)).detailLocation(detailLocation(request)).build());
        attachmentService.validateAndLinkInquiryAttachments(request.attachmentIds(), Attachment.RefType.INQUIRY, saved.getId(), user);
        inquiryEmailService.queueAdminNotification(InquiryEmailDelivery.EventType.NEW_INQUIRY, saved, null);
        return toDetail(saved);
    }

    @Transactional
    public void delete(Long id, String email) {
        Inquiry inquiry = findInquiry(id);
        checkOwner(inquiry, email);
        if (inquiry.getStatus() != Inquiry.Status.PENDING || inquiryMessageRepository.existsByInquiryId(id))
            throw new BusinessException(ErrorCode.INQUIRY_ACCESS_DENIED);
        inquiryRepository.delete(inquiry);
    }

    @Transactional
    public UploadResult uploadImage(MultipartFile image, String email) {
        User user = findUser(email);
        Attachment attachment = attachmentService.saveImage(image, Attachment.RefType.INQUIRY, user);
        return new UploadResult(attachment.getId(), attachment.getFileUrl());
    }

    @Transactional
    public UploadResult uploadMessageImage(MultipartFile image, String email) {
        User user = findUser(email);
        Attachment attachment = attachmentService.saveImage(image, Attachment.RefType.INQUIRY_MESSAGE, user);
        return new UploadResult(attachment.getId(), attachment.getFileUrl());
    }

    @Transactional
    public InquiryMessageResponse addUserMessage(Long inquiryId, InquiryMessageRequest request, String email) {
        Inquiry inquiry = findInquiry(inquiryId);
        User user = findUser(email);
        checkOwner(inquiry, email);
        if (inquiry.isClosed()) throw new BusinessException(ErrorCode.INQUIRY_CLOSED);
        InquiryMessage message = inquiryMessageRepository.save(InquiryMessage.builder().inquiry(inquiry).author(user)
                .authorRole(InquiryMessage.AuthorRole.USER).content(request.content()).build());
        attachmentService.validateAndLinkInquiryAttachments(request.attachmentIds(), Attachment.RefType.INQUIRY_MESSAGE, message.getId(), user);
        inquiryEmailService.queueAdminNotification(InquiryEmailDelivery.EventType.USER_MESSAGE, inquiry, message);
        return toMessage(message);
    }

    public Page<InquirySummaryResponse> adminGetAll(Inquiry.Status status, Inquiry.RequestType requestType, String targetArea, Pageable pageable) {
        return inquiryRepository.findAdminFiltered(status, requestType, targetArea, pageable).map(InquirySummaryResponse::from);
    }

    public InquiryDetailResponse adminGetOne(Long id) { return toDetail(findInquiry(id)); }

    @Transactional
    public InquiryMessageResponse addAdminMessage(Long inquiryId, AdminInquiryMessageRequest request, String email) {
        Inquiry inquiry = findInquiry(inquiryId);
        User admin = findUser(email);
        if (inquiry.isClosed()) throw new BusinessException(ErrorCode.INQUIRY_CLOSED);
        InquiryMessage message = inquiryMessageRepository.save(InquiryMessage.builder().inquiry(inquiry)
                .author(admin).authorRole(InquiryMessage.AuthorRole.ADMIN).content(request.content()).build());
        attachmentService.validateAndLinkInquiryAttachments(request.attachmentIds(), Attachment.RefType.INQUIRY_MESSAGE,
                message.getId(), admin);
        inquiryEmailService.queueUserNotification(InquiryEmailDelivery.EventType.ADMIN_MESSAGE, inquiry, message, request.sendEmail());
        return toMessage(message);
    }

    @Transactional
    public InquiryDetailResponse updateStatus(Long inquiryId, InquiryStatusUpdateRequest request, String email) {
        Inquiry inquiry = findInquiry(inquiryId);
        User admin = findUser(email);
        if (!inquiry.canTransitionTo(request.status())) throw new BusinessException(ErrorCode.INVALID_INQUIRY_STATUS_TRANSITION);
        InquiryMessage finalMessage = null;
        if (request.status().isClosed()) {
            if (request.message() == null || request.message().isBlank()) throw new BusinessException(ErrorCode.INVALID_INPUT);
            finalMessage = inquiryMessageRepository.save(InquiryMessage.builder().inquiry(inquiry)
                    .author(admin).authorRole(InquiryMessage.AuthorRole.ADMIN).content(request.message()).build());
        }
        inquiry.changeStatus(request.status());
        if (request.status().isClosed()) {
            inquiryEmailService.queueUserNotification(toEmailEvent(request.status()), inquiry, finalMessage, request.sendEmail());
        }
        return toDetail(inquiry);
    }

    @Transactional
    public void adminDelete(Long id) { inquiryRepository.delete(findInquiry(id)); }

    private void validateRequest(InquiryRequest request) {
        if (request.requestType() == Inquiry.RequestType.BUG_REPORT && (request.targetArea() == null || request.targetArea().isBlank()
                || domainSlaveRepository.findByMasterCode("INQUIRY_BUG_AREA").stream().noneMatch(s -> request.targetArea().equals(s.getName()))))
            throw new BusinessException(ErrorCode.INVALID_INQUIRY_TARGET_AREA);
    }

    private String targetArea(InquiryRequest request) { return request.requestType() == Inquiry.RequestType.EXAM_OPENING_REQUEST ? null : request.targetArea(); }
    private String detailLocation(InquiryRequest request) { return request.requestType() == Inquiry.RequestType.EXAM_OPENING_REQUEST ? null : request.detailLocation(); }

    private InquiryEmailDelivery.EventType toEmailEvent(Inquiry.Status status) {
        return switch (status) {
            case ANSWERED -> InquiryEmailDelivery.EventType.ANSWERED;
            case COMPLETED -> InquiryEmailDelivery.EventType.COMPLETED;
            case UNABLE_TO_PROCESS -> InquiryEmailDelivery.EventType.UNABLE_TO_PROCESS;
            default -> throw new IllegalArgumentException("종료 상태가 아닙니다.");
        };
    }

    private InquiryDetailResponse toDetail(Inquiry inquiry) {
        List<String> images = attachmentService.findByRef(Attachment.RefType.INQUIRY, inquiry.getId()).stream().map(Attachment::getFileUrl).toList();
        List<InquiryMessageResponse> messages = inquiryMessageRepository.findByInquiryIdOrderByCreatedAtAscIdAsc(inquiry.getId()).stream().map(this::toMessage).toList();
        return InquiryDetailResponse.from(inquiry, images, messages);
    }

    private InquiryMessageResponse toMessage(InquiryMessage message) {
        List<String> images = attachmentService.findByRef(Attachment.RefType.INQUIRY_MESSAGE, message.getId()).stream().map(Attachment::getFileUrl).toList();
        return InquiryMessageResponse.from(message, images);
    }

    private User findUser(String email) { return userRepository.findByEmail(email).orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND)); }
    private Inquiry findInquiry(Long id) { return inquiryRepository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.INQUIRY_NOT_FOUND)); }
    private void checkOwner(Inquiry inquiry, String email) { if (!inquiry.getUser().getEmail().equals(email)) throw new BusinessException(ErrorCode.INQUIRY_ACCESS_DENIED); }

    public record UploadResult(Long id, String url) {}
}
