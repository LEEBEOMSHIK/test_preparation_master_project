package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.InquiryMessageRequest;
import com.tpmp.testprep.dto.request.AdminInquiryMessageRequest;
import com.tpmp.testprep.dto.request.InquiryRequest;
import com.tpmp.testprep.dto.request.InquiryStatusUpdateRequest;
import com.tpmp.testprep.entity.Inquiry;
import com.tpmp.testprep.entity.InquiryMessage;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.InquiryMessageRepository;
import com.tpmp.testprep.repository.InquiryRepository;
import com.tpmp.testprep.repository.UserRepository;
import com.tpmp.testprep.repository.DomainSlaveRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class InquiryServiceTest {

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
        when(inquiryRepository.findById(1L)).thenReturn(Optional.of(inquiry));
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
        when(inquiryRepository.findById(1L)).thenReturn(Optional.of(inquiry));
        when(messageRepository.save(any(InquiryMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        InquiryService service = service(inquiryRepository, userRepository(user("admin@tpmp.com")), messageRepository);

        service.addAdminMessage(1L, new AdminInquiryMessageRequest("확인 중입니다.", List.of(), false), "admin@tpmp.com");

        assertThat(inquiry.getStatus()).isEqualTo(Inquiry.Status.PENDING);
        verify(messageRepository).save(argThat(message -> message.getAuthorRole() == InquiryMessage.AuthorRole.ADMIN
                && "확인 중입니다.".equals(message.getContent())));
    }

    @Test
    void terminalStatusStoresFinalMessageBeforeChangingStatus() {
        Inquiry inquiry = inquiry(user("user@tpmp.com"), Inquiry.RequestType.FEATURE_REQUEST);
        InquiryRepository inquiryRepository = mock(InquiryRepository.class);
        InquiryMessageRepository messageRepository = mock(InquiryMessageRepository.class);
        when(inquiryRepository.findById(1L)).thenReturn(Optional.of(inquiry));
        when(messageRepository.save(any(InquiryMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        InquiryService service = service(inquiryRepository, userRepository(user("admin@tpmp.com")), messageRepository);

        service.updateStatus(1L, new InquiryStatusUpdateRequest(Inquiry.Status.COMPLETED, "반영했습니다.", false), "admin@tpmp.com");

        assertThat(inquiry.getStatus()).isEqualTo(Inquiry.Status.COMPLETED);
        verify(messageRepository).save(argThat(message -> "반영했습니다.".equals(message.getContent())));
    }

    private InquiryService service() {
        return service(mock(InquiryRepository.class), mock(UserRepository.class), mock(InquiryMessageRepository.class));
    }

    private InquiryService service(InquiryRepository inquiryRepository, UserRepository userRepository,
                                   InquiryMessageRepository messageRepository) {
        return new InquiryService(inquiryRepository, userRepository, mock(AttachmentService.class), messageRepository,
                mock(DomainSlaveRepository.class));
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
