package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.InquiryMessageRequest;
import com.tpmp.testprep.dto.request.AdminInquiryMessageRequest;
import com.tpmp.testprep.dto.request.InquiryRequest;
import com.tpmp.testprep.dto.request.InquiryStatusUpdateRequest;
import com.tpmp.testprep.dto.request.InquiryUpdateRequest;
import com.tpmp.testprep.dto.response.InquiryStatusEmailOutcome;
import com.tpmp.testprep.dto.response.InquiryStatusUpdateResponse;
import com.tpmp.testprep.entity.Inquiry;
import com.tpmp.testprep.entity.InquiryMessage;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.InquiryMessageRepository;
import com.tpmp.testprep.repository.InquiryRepository;
import com.tpmp.testprep.repository.UserRepository;
import com.tpmp.testprep.repository.DomainSlaveRepository;
import com.tpmp.testprep.service.InquiryEmailService.StatusEmailResult;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class InquiryServiceTest {

    @Test
    void updateAllowsOwnerToChangePendingInquiryWithoutMessagesAndKeepsExistingAttachments() {
        User owner = user("user@tpmp.com");
        Inquiry inquiry = inquiry(owner, Inquiry.RequestType.GENERAL_INQUIRY);
        ReflectionTestUtils.setField(inquiry, "id", 17L);
        InquiryRepository inquiryRepository = mock(InquiryRepository.class);
        InquiryMessageRepository messageRepository = mock(InquiryMessageRepository.class);
        AttachmentService attachmentService = mock(AttachmentService.class);
        InquiryEmailService inquiryEmailService = mock(InquiryEmailService.class);
        when(inquiryRepository.findByIdForUpdate(17L)).thenReturn(Optional.of(inquiry));
        when(messageRepository.existsByInquiryId(17L)).thenReturn(false);
        when(attachmentService.findByRef(com.tpmp.testprep.entity.Attachment.RefType.INQUIRY, 17L))
                .thenReturn(List.of());
        when(messageRepository.findByInquiryIdOrderByCreatedAtAscIdAsc(17L)).thenReturn(List.of());
        InquiryService service = new InquiryService(inquiryRepository, userRepository(owner), attachmentService,
                messageRepository, mock(DomainSlaveRepository.class), inquiryEmailService);

        service.update(17L, new InquiryUpdateRequest("수정 제목", "수정 내용", Inquiry.RequestType.FEATURE_REQUEST,
                "EXAM_INFO", "/user/inquiries/17"), "user@tpmp.com");

        assertThat(inquiry.getTitle()).isEqualTo("수정 제목");
        assertThat(inquiry.getContent()).isEqualTo("수정 내용");
        assertThat(inquiry.getRequestType()).isEqualTo(Inquiry.RequestType.FEATURE_REQUEST);
        assertThat(inquiry.getTargetArea()).isEqualTo("EXAM_INFO");
        assertThat(inquiry.getDetailLocation()).isEqualTo("/user/inquiries/17");
        verify(attachmentService, never()).validateAndLinkInquiryAttachments(any(), any(), any(), any());
        verifyNoInteractions(inquiryEmailService);
    }

    @Test
    void updateAllowsBugReportToKeepItsInactiveLegacyTargetArea() {
        User owner = user("user@tpmp.com");
        Inquiry inquiry = Inquiry.builder().user(owner).title("버그").content("내용")
                .requestType(Inquiry.RequestType.BUG_REPORT).targetArea("LEGACY_REMOVED").build();
        ReflectionTestUtils.setField(inquiry, "id", 20L);
        InquiryRepository inquiryRepository = mock(InquiryRepository.class);
        InquiryMessageRepository messageRepository = mock(InquiryMessageRepository.class);
        AttachmentService attachmentService = mock(AttachmentService.class);
        DomainSlaveRepository domainSlaveRepository = mock(DomainSlaveRepository.class);
        when(inquiryRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(inquiry));
        when(messageRepository.existsByInquiryId(20L)).thenReturn(false);
        when(attachmentService.findByRef(com.tpmp.testprep.entity.Attachment.RefType.INQUIRY, 20L)).thenReturn(List.of());
        when(messageRepository.findByInquiryIdOrderByCreatedAtAscIdAsc(20L)).thenReturn(List.of());
        when(domainSlaveRepository.findByMasterCode("INQUIRY_BUG_AREA")).thenReturn(List.of());
        InquiryService service = new InquiryService(inquiryRepository, userRepository(owner), attachmentService,
                messageRepository, domainSlaveRepository, mock(InquiryEmailService.class));

        service.update(20L, new InquiryUpdateRequest("수정 제목", "수정 내용", Inquiry.RequestType.BUG_REPORT,
                "LEGACY_REMOVED", null), "user@tpmp.com");

        assertThat(inquiry.getTitle()).isEqualTo("수정 제목");
        assertThat(inquiry.getContent()).isEqualTo("수정 내용");
        assertThat(inquiry.getTargetArea()).isEqualTo("LEGACY_REMOVED");
    }

    @Test
    void updateRejectsChangingBugReportToAnotherInactiveTargetArea() {
        User owner = user("user@tpmp.com");
        Inquiry inquiry = Inquiry.builder().user(owner).title("버그").content("내용")
                .requestType(Inquiry.RequestType.BUG_REPORT).targetArea("LEGACY_REMOVED").build();
        ReflectionTestUtils.setField(inquiry, "id", 21L);
        InquiryRepository inquiryRepository = mock(InquiryRepository.class);
        InquiryMessageRepository messageRepository = mock(InquiryMessageRepository.class);
        DomainSlaveRepository domainSlaveRepository = mock(DomainSlaveRepository.class);
        when(inquiryRepository.findByIdForUpdate(21L)).thenReturn(Optional.of(inquiry));
        when(messageRepository.existsByInquiryId(21L)).thenReturn(false);
        when(domainSlaveRepository.findByMasterCode("INQUIRY_BUG_AREA")).thenReturn(List.of());
        InquiryService service = new InquiryService(inquiryRepository, userRepository(owner), mock(AttachmentService.class),
                messageRepository, domainSlaveRepository, mock(InquiryEmailService.class));

        assertThatThrownBy(() -> service.update(21L, new InquiryUpdateRequest("수정", "내용", Inquiry.RequestType.BUG_REPORT,
                "OTHER_REMOVED", null), "user@tpmp.com"))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_INQUIRY_TARGET_AREA);
    }

    @Test
    void updateRejectsChangingNonBugInquiryToBugReportWithInactiveTargetArea() {
        User owner = user("user@tpmp.com");
        Inquiry inquiry = inquiry(owner, Inquiry.RequestType.GENERAL_INQUIRY);
        ReflectionTestUtils.setField(inquiry, "id", 22L);
        InquiryRepository inquiryRepository = mock(InquiryRepository.class);
        InquiryMessageRepository messageRepository = mock(InquiryMessageRepository.class);
        DomainSlaveRepository domainSlaveRepository = mock(DomainSlaveRepository.class);
        when(inquiryRepository.findByIdForUpdate(22L)).thenReturn(Optional.of(inquiry));
        when(messageRepository.existsByInquiryId(22L)).thenReturn(false);
        when(domainSlaveRepository.findByMasterCode("INQUIRY_BUG_AREA")).thenReturn(List.of());
        InquiryService service = new InquiryService(inquiryRepository, userRepository(owner), mock(AttachmentService.class),
                messageRepository, domainSlaveRepository, mock(InquiryEmailService.class));

        assertThatThrownBy(() -> service.update(22L, new InquiryUpdateRequest("수정", "내용", Inquiry.RequestType.BUG_REPORT,
                "LEGACY_REMOVED", null), "user@tpmp.com"))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_INQUIRY_TARGET_AREA);
    }

    @Test
    void updateRejectsNonOwnerNonPendingOrInquiryWithMessages() {
        User owner = user("owner@tpmp.com");
        Inquiry inquiry = inquiry(owner, Inquiry.RequestType.GENERAL_INQUIRY);
        ReflectionTestUtils.setField(inquiry, "id", 18L);
        InquiryRepository inquiryRepository = mock(InquiryRepository.class);
        InquiryMessageRepository messageRepository = mock(InquiryMessageRepository.class);
        when(inquiryRepository.findByIdForUpdate(18L)).thenReturn(Optional.of(inquiry));
        InquiryService service = service(inquiryRepository, userRepository(owner), messageRepository);
        InquiryUpdateRequest request = new InquiryUpdateRequest("수정", "내용", Inquiry.RequestType.OTHER, null, null);

        assertThatThrownBy(() -> service.update(18L, request, "other@tpmp.com"))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).getErrorCode())
                .isEqualTo(ErrorCode.INQUIRY_ACCESS_DENIED);

        inquiry.changeStatus(Inquiry.Status.IN_PROGRESS);
        assertThatThrownBy(() -> service.update(18L, request, "owner@tpmp.com"))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).getErrorCode())
                .isEqualTo(ErrorCode.INQUIRY_ACCESS_DENIED);

        inquiry.changeStatus(Inquiry.Status.PENDING);
        when(messageRepository.existsByInquiryId(18L)).thenReturn(true);
        assertThatThrownBy(() -> service.update(18L, request, "owner@tpmp.com"))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).getErrorCode())
                .isEqualTo(ErrorCode.INQUIRY_ACCESS_DENIED);
    }

    @Test
    void mutationPathsUseLockedInquiryLookupBeforeChangingConversationOrStatus() {
        User owner = user("user@tpmp.com");
        Inquiry inquiry = inquiry(owner, Inquiry.RequestType.GENERAL_INQUIRY);
        ReflectionTestUtils.setField(inquiry, "id", 19L);
        InquiryRepository inquiryRepository = mock(InquiryRepository.class);
        InquiryMessageRepository messageRepository = mock(InquiryMessageRepository.class);
        when(inquiryRepository.findByIdForUpdate(19L)).thenReturn(Optional.of(inquiry));
        when(messageRepository.existsByInquiryId(19L)).thenReturn(false);
        when(messageRepository.save(any(InquiryMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        InquiryService service = service(inquiryRepository, userRepository(owner), messageRepository);

        service.update(19L, new InquiryUpdateRequest("수정", "내용", Inquiry.RequestType.OTHER, null, null), "user@tpmp.com");
        service.addUserMessage(19L, new InquiryMessageRequest("추가", List.of()), "user@tpmp.com");
        service.addAdminMessage(19L, new AdminInquiryMessageRequest("답변", List.of(), false), "user@tpmp.com");
        service.updateStatus(19L, new InquiryStatusUpdateRequest(Inquiry.Status.ON_HOLD, false));
        inquiry.changeStatus(Inquiry.Status.PENDING);
        service.delete(19L, "user@tpmp.com");

        verify(inquiryRepository, times(5)).findByIdForUpdate(19L);
        verify(inquiryRepository, never()).findById(19L);
    }

    @Test
    void createRejectsBugReportWithoutTargetArea() {
        InquiryService service = service();

        assertThatThrownBy(() -> service.create(new InquiryRequest(
                "버그", "재현 내용", Inquiry.RequestType.BUG_REPORT, null, null, List.of()), "user@tpmp.com"))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_INQUIRY_TARGET_AREA);
    }

    @Test
    void addUserMessageRejectsClosedInquiry() {
        User user = user("user@tpmp.com");
        Inquiry inquiry = inquiry(user, Inquiry.RequestType.GENERAL_INQUIRY);
        inquiry.changeStatus(Inquiry.Status.ANSWERED);
        InquiryRepository inquiryRepository = mock(InquiryRepository.class);
        when(inquiryRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(inquiry));
        InquiryService service = service(inquiryRepository, userRepository(user), mock(InquiryMessageRepository.class));

        assertThatThrownBy(() -> service.addUserMessage(1L,
                new InquiryMessageRequest("추가 문의", List.of()), "user@tpmp.com"))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).getErrorCode())
                .isEqualTo(ErrorCode.INQUIRY_CLOSED);
    }

    @Test
    void adminMessagePersistsConversationWithoutChangingStatus() {
        Inquiry inquiry = inquiry(user("user@tpmp.com"), Inquiry.RequestType.BUG_REPORT);
        InquiryRepository inquiryRepository = mock(InquiryRepository.class);
        InquiryMessageRepository messageRepository = mock(InquiryMessageRepository.class);
        when(inquiryRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(inquiry));
        when(messageRepository.save(any(InquiryMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        InquiryService service = service(inquiryRepository, userRepository(user("admin@tpmp.com")), messageRepository);

        service.addAdminMessage(1L, new AdminInquiryMessageRequest("확인 중입니다.", List.of(), false), "admin@tpmp.com");

        assertThat(inquiry.getStatus()).isEqualTo(Inquiry.Status.PENDING);
        verify(messageRepository).save(argThat(message -> message.getAuthorRole() == InquiryMessage.AuthorRole.ADMIN
                && "확인 중입니다.".equals(message.getContent())));
    }

    @Test
    void completedStatusDoesNotCreateAdminMessageAndReturnsEmailOutcome() {
        Inquiry inquiry = inquiry(user("user@tpmp.com"), Inquiry.RequestType.FEATURE_REQUEST);
        ReflectionTestUtils.setField(inquiry, "id", 1L);
        InquiryRepository inquiryRepository = mock(InquiryRepository.class);
        InquiryMessageRepository messageRepository = mock(InquiryMessageRepository.class);
        AttachmentService attachmentService = mock(AttachmentService.class);
        InquiryEmailService inquiryEmailService = mock(InquiryEmailService.class);
        when(inquiryRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(inquiry));
        when(attachmentService.findByRef(com.tpmp.testprep.entity.Attachment.RefType.INQUIRY, 1L))
                .thenReturn(List.of());
        when(messageRepository.findByInquiryIdOrderByCreatedAtAscIdAsc(1L)).thenReturn(List.of());
        when(inquiryEmailService.queueStatusNotification(any(), eq(true)))
                .thenReturn(new StatusEmailResult(InquiryStatusEmailOutcome.QUEUED,
                        "상태 변경 안내 이메일을 발송 대기열에 등록했습니다."));
        InquiryService service = new InquiryService(inquiryRepository, mock(UserRepository.class), attachmentService,
                messageRepository, mock(DomainSlaveRepository.class), inquiryEmailService);

        InquiryStatusUpdateResponse result = service.updateStatus(1L,
                new InquiryStatusUpdateRequest(Inquiry.Status.COMPLETED, true));

        assertThat(result.inquiry().status()).isEqualTo(Inquiry.Status.COMPLETED.name());
        assertThat(result.emailOutcome()).isEqualTo(InquiryStatusEmailOutcome.QUEUED);
        verify(messageRepository, never()).save(any());
    }

    @Test
    void skippedTemplateKeepsCompletedStatusAndReturnsSettingsUrl() {
        Inquiry inquiry = inquiry(user("user@tpmp.com"), Inquiry.RequestType.FEATURE_REQUEST);
        ReflectionTestUtils.setField(inquiry, "id", 2L);
        InquiryRepository inquiryRepository = mock(InquiryRepository.class);
        InquiryMessageRepository messageRepository = mock(InquiryMessageRepository.class);
        AttachmentService attachmentService = mock(AttachmentService.class);
        InquiryEmailService inquiryEmailService = mock(InquiryEmailService.class);
        when(inquiryRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(inquiry));
        when(attachmentService.findByRef(com.tpmp.testprep.entity.Attachment.RefType.INQUIRY, 2L))
                .thenReturn(List.of());
        when(messageRepository.findByInquiryIdOrderByCreatedAtAscIdAsc(2L)).thenReturn(List.of());
        when(inquiryEmailService.queueStatusNotification(inquiry, true))
                .thenReturn(new StatusEmailResult(InquiryStatusEmailOutcome.SKIPPED_TEMPLATE_MISSING,
                        "연결된 이메일 템플릿이 없어 상태만 변경했습니다."));
        InquiryService service = new InquiryService(inquiryRepository, mock(UserRepository.class), attachmentService,
                messageRepository, mock(DomainSlaveRepository.class), inquiryEmailService);

        InquiryStatusUpdateResponse result = service.updateStatus(2L,
                new InquiryStatusUpdateRequest(Inquiry.Status.COMPLETED, true));

        assertThat(result.inquiry().status()).isEqualTo("COMPLETED");
        assertThat(result.emailOutcome()).isEqualTo(InquiryStatusEmailOutcome.SKIPPED_TEMPLATE_MISSING);
        assertThat(result.templateSettingsUrl()).isEqualTo("/admin/email-templates?tab=bindings");
        verify(messageRepository, never()).save(any());
    }

    @Test
    void reopeningClosedInquiryNeverRequestsStatusEmail() {
        Inquiry inquiry = inquiry(user("user@tpmp.com"), Inquiry.RequestType.FEATURE_REQUEST);
        ReflectionTestUtils.setField(inquiry, "id", 3L);
        inquiry.changeStatus(Inquiry.Status.COMPLETED);
        InquiryRepository inquiryRepository = mock(InquiryRepository.class);
        InquiryMessageRepository messageRepository = mock(InquiryMessageRepository.class);
        AttachmentService attachmentService = mock(AttachmentService.class);
        InquiryEmailService inquiryEmailService = mock(InquiryEmailService.class);
        when(inquiryRepository.findByIdForUpdate(3L)).thenReturn(Optional.of(inquiry));
        when(attachmentService.findByRef(com.tpmp.testprep.entity.Attachment.RefType.INQUIRY, 3L))
                .thenReturn(List.of());
        when(messageRepository.findByInquiryIdOrderByCreatedAtAscIdAsc(3L)).thenReturn(List.of());
        InquiryService service = new InquiryService(inquiryRepository, mock(UserRepository.class), attachmentService,
                messageRepository, mock(DomainSlaveRepository.class), inquiryEmailService);

        InquiryStatusUpdateResponse result = service.updateStatus(3L,
                new InquiryStatusUpdateRequest(Inquiry.Status.IN_PROGRESS, true));

        assertThat(result.inquiry().status()).isEqualTo("IN_PROGRESS");
        assertThat(result.emailOutcome()).isEqualTo(InquiryStatusEmailOutcome.NOT_REQUESTED);
        assertThat(result.emailMessage()).isEqualTo("상태만 변경했습니다.");
        assertThat(result.templateSettingsUrl()).isNull();
        verifyNoInteractions(inquiryEmailService);
        verify(messageRepository, never()).save(any());
    }

    @Test
    void adminGetAllCombinesKeywordWithStructuredFilters() {
        InquiryRepository inquiryRepository = mock(InquiryRepository.class);
        Pageable pageable = PageRequest.of(0, 20);
        when(inquiryRepository.findAdminFiltered(
                Inquiry.Status.IN_PROGRESS,
                Inquiry.RequestType.BUG_REPORT,
                "EXAM_INFO",
                "Login failure",
                pageable
        )).thenReturn(Page.empty(pageable));
        InquiryService service = service(inquiryRepository, mock(UserRepository.class),
                mock(InquiryMessageRepository.class));

        service.adminGetAll(
                Inquiry.Status.IN_PROGRESS,
                Inquiry.RequestType.BUG_REPORT,
                "EXAM_INFO",
                "  Login failure  ",
                pageable
        );

        verify(inquiryRepository).findAdminFiltered(
                Inquiry.Status.IN_PROGRESS,
                Inquiry.RequestType.BUG_REPORT,
                "EXAM_INFO",
                "Login failure",
                pageable
        );
    }

    @Test
    void adminGetAllNormalizesMissingKeywordToEmptyString() {
        InquiryRepository inquiryRepository = mock(InquiryRepository.class);
        Pageable pageable = PageRequest.of(0, 20);
        when(inquiryRepository.findAdminFiltered(any(), any(), any(), any(), any()))
                .thenReturn(Page.empty(pageable));
        InquiryService service = service(inquiryRepository, mock(UserRepository.class),
                mock(InquiryMessageRepository.class));

        service.adminGetAll(null, null, null, null, pageable);
        service.adminGetAll(null, null, null, "   ", pageable);

        verify(inquiryRepository, times(2)).findAdminFiltered(
                isNull(), isNull(), isNull(), eq(""), eq(pageable)
        );
    }

    @Test
    void detailFallsBackToLegacyImageUrlsWhenAttachmentRowsAreMissing() {
        User owner = user("user@tpmp.com");
        Inquiry inquiry = Inquiry.builder()
                .user(owner)
                .title("레거시 첨부 문의")
                .content("내용")
                .requestType(Inquiry.RequestType.GENERAL_INQUIRY)
                .imageUrls(" /uploads/images/legacy-a.png, ,/uploads/images/legacy-b.webp ")
                .build();
        ReflectionTestUtils.setField(inquiry, "id", 17L);
        InquiryRepository inquiryRepository = mock(InquiryRepository.class);
        AttachmentService attachmentService = mock(AttachmentService.class);
        InquiryMessageRepository messageRepository = mock(InquiryMessageRepository.class);
        when(inquiryRepository.findById(17L)).thenReturn(Optional.of(inquiry));
        when(attachmentService.findByRef(com.tpmp.testprep.entity.Attachment.RefType.INQUIRY, 17L))
                .thenReturn(List.of());
        when(messageRepository.findByInquiryIdOrderByCreatedAtAscIdAsc(17L)).thenReturn(List.of());
        InquiryService service = new InquiryService(inquiryRepository, userRepository(owner), attachmentService,
                messageRepository, mock(DomainSlaveRepository.class), mock(InquiryEmailService.class));

        var detail = service.getMyInquiry(17L, "user@tpmp.com");

        assertThat(detail.imageUrls()).containsExactly(
                "/uploads/images/legacy-a.png",
                "/uploads/images/legacy-b.webp"
        );
    }

    private InquiryService service() {
        return service(mock(InquiryRepository.class), mock(UserRepository.class), mock(InquiryMessageRepository.class));
    }

    private InquiryService service(InquiryRepository inquiryRepository, UserRepository userRepository,
                                   InquiryMessageRepository messageRepository) {
        return new InquiryService(inquiryRepository, userRepository, mock(AttachmentService.class), messageRepository,
                mock(DomainSlaveRepository.class), mock(InquiryEmailService.class));
    }

    private UserRepository userRepository(User user) {
        UserRepository repository = mock(UserRepository.class);
        when(repository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        return repository;
    }

    private User user(String email) {
        return User.builder().email(email).password("pw").name("사용자").role(User.Role.USER).build();
    }

    private Inquiry inquiry(User user, Inquiry.RequestType requestType) {
        return Inquiry.builder().user(user).title("제목").content("내용").requestType(requestType).build();
    }
}
