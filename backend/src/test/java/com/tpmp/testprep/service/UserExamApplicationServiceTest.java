package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.UserExamApplicationRequest;
import com.tpmp.testprep.dto.response.UserExamApplicationResponse;
import com.tpmp.testprep.entity.ExamInfo;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.entity.UserExamApplication;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.ExamInfoRepository;
import com.tpmp.testprep.repository.UserExamApplicationRepository;
import com.tpmp.testprep.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * UserExamApplicationService — 소유자 검증(checkOwner)·날짜 필수값·examInfo 연결 로직 단위 테스트.
 */
@ExtendWith(MockitoExtension.class)
class UserExamApplicationServiceTest {

    @Mock private UserExamApplicationRepository userExamApplicationRepository;
    @Mock private UserRepository userRepository;
    @Mock private ExamInfoRepository examInfoRepository;

    private UserExamApplicationService service;

    private static final String OWNER_EMAIL = "owner@tpmp.com";
    private static final String OTHER_EMAIL = "other@tpmp.com";

    private User owner;

    @BeforeEach
    void setUp() {
        service = new UserExamApplicationService(userExamApplicationRepository, userRepository, examInfoRepository);
        owner = User.builder().email(OWNER_EMAIL).name("owner").role(User.Role.USER).build();
    }

    @Test
    @DisplayName("create: 접수일·시험일이 모두 없으면 INVALID_INPUT")
    void create_bothDatesNull_throwsInvalidInput() {
        lenient().when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        UserExamApplicationRequest request = new UserExamApplicationRequest(null, "정보처리기사", null, null, null);

        assertThatThrownBy(() -> service.create(OWNER_EMAIL, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.INVALID_INPUT);

        verify(userExamApplicationRepository, never()).save(any());
    }

    @Test
    @DisplayName("create: examInfoId가 존재하지 않으면 INVALID_INPUT")
    void create_examInfoNotFound_throwsInvalidInput() {
        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(examInfoRepository.findById(99L)).thenReturn(Optional.empty());
        UserExamApplicationRequest request = new UserExamApplicationRequest(99L, "정보처리기사", LocalDate.now(), null, null);

        assertThatThrownBy(() -> service.create(OWNER_EMAIL, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.INVALID_INPUT);
    }

    @Test
    @DisplayName("create: examInfoId 없이 자유 입력이면 examInfo 없이 저장")
    void create_freeInput_savesWithoutExamInfo() {
        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(userExamApplicationRepository.save(any(UserExamApplication.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        UserExamApplicationRequest request = new UserExamApplicationRequest(null, "자체 준비 시험", LocalDate.of(2026, 8, 1), null, "메모");

        UserExamApplicationResponse response = service.create(OWNER_EMAIL, request);

        assertThat(response.examInfoId()).isNull();
        assertThat(response.examName()).isEqualTo("자체 준비 시험");
        verify(examInfoRepository, never()).findById(any());
    }

    @Test
    @DisplayName("update: 소유자가 아니면 USER_EXAM_APPLICATION_ACCESS_DENIED")
    void update_notOwner_throwsAccessDenied() {
        UserExamApplication application = UserExamApplication.builder()
                .user(owner).examName("정보처리기사").applicationDate(LocalDate.now()).build();
        when(userExamApplicationRepository.findById(1L)).thenReturn(Optional.of(application));
        UserExamApplicationRequest request = new UserExamApplicationRequest(null, "정보처리기사", LocalDate.now(), null, null);

        assertThatThrownBy(() -> service.update(OTHER_EMAIL, 1L, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.USER_EXAM_APPLICATION_ACCESS_DENIED);
    }

    @Test
    @DisplayName("delete: 소유자가 아니면 삭제되지 않고 USER_EXAM_APPLICATION_ACCESS_DENIED")
    void delete_notOwner_throwsAccessDeniedAndDoesNotDelete() {
        UserExamApplication application = UserExamApplication.builder()
                .user(owner).examName("정보처리기사").applicationDate(LocalDate.now()).build();
        when(userExamApplicationRepository.findById(1L)).thenReturn(Optional.of(application));

        assertThatThrownBy(() -> service.delete(OTHER_EMAIL, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.USER_EXAM_APPLICATION_ACCESS_DENIED);

        verify(userExamApplicationRepository, never()).delete(any());
    }

    @Test
    @DisplayName("delete: 소유자면 정상 삭제")
    void delete_owner_deletesSuccessfully() {
        UserExamApplication application = UserExamApplication.builder()
                .user(owner).examName("정보처리기사").applicationDate(LocalDate.now()).build();
        when(userExamApplicationRepository.findById(1L)).thenReturn(Optional.of(application));

        service.delete(OWNER_EMAIL, 1L);

        verify(userExamApplicationRepository).delete(application);
    }

    @Test
    @DisplayName("update: id가 존재하지 않으면 USER_EXAM_APPLICATION_NOT_FOUND")
    void update_notFound_throwsNotFound() {
        when(userExamApplicationRepository.findById(1L)).thenReturn(Optional.empty());
        UserExamApplicationRequest request = new UserExamApplicationRequest(null, "정보처리기사", LocalDate.now(), null, null);

        assertThatThrownBy(() -> service.update(OWNER_EMAIL, 1L, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.USER_EXAM_APPLICATION_NOT_FOUND);
    }

    @Test
    @DisplayName("create: 접수일이 시험일보다 늦으면 INVALID_INPUT")
    void create_applicationDateAfterExamDate_throwsInvalidInput() {
        lenient().when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        UserExamApplicationRequest request = new UserExamApplicationRequest(
                null, "정보처리기사", LocalDate.of(2026, 8, 10), LocalDate.of(2026, 8, 1), null);

        assertThatThrownBy(() -> service.create(OWNER_EMAIL, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.INVALID_INPUT);

        verify(userExamApplicationRepository, never()).save(any());
    }

    @Test
    @DisplayName("create: 접수일이 시험일과 같거나 이르면 정상 저장")
    void create_applicationDateOnOrBeforeExamDate_savesSuccessfully() {
        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(userExamApplicationRepository.save(any(UserExamApplication.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        UserExamApplicationRequest request = new UserExamApplicationRequest(
                null, "정보처리기사", LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 1), null);

        UserExamApplicationResponse response = service.create(OWNER_EMAIL, request);

        assertThat(response.examName()).isEqualTo("정보처리기사");
    }

    @Test
    @DisplayName("create: 연도가 2000년 미만이면 INVALID_INPUT")
    void create_yearTooOld_throwsInvalidInput() {
        lenient().when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        UserExamApplicationRequest request = new UserExamApplicationRequest(
                null, "정보처리기사", LocalDate.of(1900, 1, 1), null, null);

        assertThatThrownBy(() -> service.create(OWNER_EMAIL, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.INVALID_INPUT);

        verify(userExamApplicationRepository, never()).save(any());
    }

    @Test
    @DisplayName("create: 연도가 (현재연도+10) 초과면 INVALID_INPUT")
    void create_yearTooFarInFuture_throwsInvalidInput() {
        lenient().when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        UserExamApplicationRequest request = new UserExamApplicationRequest(
                null, "정보처리기사", null, LocalDate.of(9999, 1, 1), null);

        assertThatThrownBy(() -> service.create(OWNER_EMAIL, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.INVALID_INPUT);

        verify(userExamApplicationRepository, never()).save(any());
    }

    @Test
    @DisplayName("create: 연도가 허용 범위 경계값(현재연도+10)이면 정상 저장")
    void create_yearAtUpperBoundary_savesSuccessfully() {
        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(userExamApplicationRepository.save(any(UserExamApplication.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        LocalDate boundaryDate = LocalDate.now().plusYears(10);
        UserExamApplicationRequest request = new UserExamApplicationRequest(
                null, "정보처리기사", boundaryDate, null, null);

        UserExamApplicationResponse response = service.create(OWNER_EMAIL, request);

        assertThat(response.examName()).isEqualTo("정보처리기사");
    }

    @Test
    @DisplayName("update: 접수일이 시험일보다 늦으면 INVALID_INPUT")
    void update_applicationDateAfterExamDate_throwsInvalidInput() {
        UserExamApplication application = UserExamApplication.builder()
                .user(owner).examName("정보처리기사").applicationDate(LocalDate.now()).build();
        when(userExamApplicationRepository.findById(1L)).thenReturn(Optional.of(application));
        UserExamApplicationRequest request = new UserExamApplicationRequest(
                null, "정보처리기사", LocalDate.of(2026, 8, 10), LocalDate.of(2026, 8, 1), null);

        assertThatThrownBy(() -> service.update(OWNER_EMAIL, 1L, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.INVALID_INPUT);
    }

    @Test
    @DisplayName("update: 소유자면 examInfo·필드가 갱신된다")
    void update_owner_updatesFields() {
        UserExamApplication application = UserExamApplication.builder()
                .user(owner).examName("정보처리기사").applicationDate(LocalDate.now()).build();
        ExamInfo examInfo = ExamInfo.builder().examType("정보처리기사").title("정보처리기사 실기").isActive(true).displayOrder(0).build();
        when(userExamApplicationRepository.findById(1L)).thenReturn(Optional.of(application));
        when(examInfoRepository.findById(5L)).thenReturn(Optional.of(examInfo));
        UserExamApplicationRequest request = new UserExamApplicationRequest(5L, "정보처리기사 실기", LocalDate.now(), LocalDate.now().plusDays(30), "메모 수정");

        UserExamApplicationResponse response = service.update(OWNER_EMAIL, 1L, request);

        assertThat(response.examInfoTitle()).isEqualTo("정보처리기사 실기");
        assertThat(response.memo()).isEqualTo("메모 수정");
    }
}
