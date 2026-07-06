package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.QuestionBankRequest;
import com.tpmp.testprep.entity.DomainSlave;
import com.tpmp.testprep.entity.QuestionBank;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.entity.support.SchedulingData;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.DomainSlaveRepository;
import com.tpmp.testprep.repository.QuestionBankRepository;
import com.tpmp.testprep.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * QuestionBankService — SCHEDULING 유형 신설에 따른 validateSchedulingData 검증 단위 테스트.
 * createQuestion(단건 등록) 경로를 통해 private 검증 로직을 간접 검증한다.
 */
@ExtendWith(MockitoExtension.class)
class QuestionBankServiceTest {

    @Mock private QuestionBankRepository questionBankRepository;
    @Mock private UserRepository userRepository;
    @Mock private DomainSlaveRepository domainSlaveRepository;
    @Mock private AttachmentService attachmentService;
    @Mock private User adminUser;
    @Mock private DomainSlave categorySlave;
    @Mock private DomainSlave examTypeSlave;

    private QuestionBankService service;

    private static final String ADMIN_EMAIL = "admin@tpmp.com";

    @BeforeEach
    void setUp() {
        service = new QuestionBankService(questionBankRepository, userRepository, domainSlaveRepository, attachmentService);
        lenient().when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));
        lenient().when(adminUser.getId()).thenReturn(1L);
        lenient().when(domainSlaveRepository.findById(10L)).thenReturn(Optional.of(categorySlave));
        lenient().when(domainSlaveRepository.findById(20L)).thenReturn(Optional.of(examTypeSlave));
        lenient().when(questionBankRepository.save(any(QuestionBank.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    private QuestionBankRequest requestOf(QuestionBank.QuestionType type, SchedulingData schedulingData) {
        return new QuestionBankRequest(
                "제목", null, null, "문항 내용", type, 10L, 20L,
                null, "정답", null, null, null,
                null, null, null, null,
                schedulingData
        );
    }

    // ── SCHEDULING 유형 검증 ─────────────────────────────────────────────────

    @Test
    @DisplayName("SCHEDULING: schedulingData가 null이면 SCHEDULING_DATA_INVALID 예외")
    void schedulingData_null_throws() {
        QuestionBankRequest req = requestOf(QuestionBank.QuestionType.SCHEDULING, null);

        assertThatThrownBy(() -> service.createQuestion(req, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SCHEDULING_DATA_INVALID));
    }

    @Test
    @DisplayName("SCHEDULING: RR 알고리즘인데 timeQuantum이 없으면 예외")
    void schedulingData_rrWithoutTimeQuantum_throws() {
        SchedulingData data = new SchedulingData(
                SchedulingData.SchedulingAlgorithm.RR, null,
                List.of(new SchedulingData.ProcessRow("P1", 0, 5, null)));
        QuestionBankRequest req = requestOf(QuestionBank.QuestionType.SCHEDULING, data);

        assertThatThrownBy(() -> service.createQuestion(req, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SCHEDULING_DATA_INVALID));
    }

    @Test
    @DisplayName("SCHEDULING: RR 알고리즘 + timeQuantum 0 이하이면 예외")
    void schedulingData_rrWithZeroTimeQuantum_throws() {
        SchedulingData data = new SchedulingData(
                SchedulingData.SchedulingAlgorithm.RR, 0,
                List.of(new SchedulingData.ProcessRow("P1", 0, 5, null)));
        QuestionBankRequest req = requestOf(QuestionBank.QuestionType.SCHEDULING, data);

        assertThatThrownBy(() -> service.createQuestion(req, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SCHEDULING_DATA_INVALID));
    }

    @Test
    @DisplayName("SCHEDULING: PRIORITY_NON_PREEMPTIVE인데 일부 프로세스 priority 누락 시 예외")
    void schedulingData_priorityMissing_throws() {
        SchedulingData data = new SchedulingData(
                SchedulingData.SchedulingAlgorithm.PRIORITY_NON_PREEMPTIVE, null,
                List.of(
                        new SchedulingData.ProcessRow("P1", 0, 5, 1),
                        new SchedulingData.ProcessRow("P2", 1, 3, null)));
        QuestionBankRequest req = requestOf(QuestionBank.QuestionType.SCHEDULING, data);

        assertThatThrownBy(() -> service.createQuestion(req, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.SCHEDULING_DATA_INVALID));
    }

    @Test
    @DisplayName("SCHEDULING: FCFS + 유효한 프로세스 목록이면 정상 저장되고 schedulingData가 그대로 반영")
    void schedulingData_valid_savesSuccessfully() {
        SchedulingData data = new SchedulingData(
                SchedulingData.SchedulingAlgorithm.FCFS, null,
                List.of(
                        new SchedulingData.ProcessRow("P1", 0, 5, null),
                        new SchedulingData.ProcessRow("P2", 2, 3, null)));
        QuestionBankRequest req = requestOf(QuestionBank.QuestionType.SCHEDULING, data);

        service.createQuestion(req, ADMIN_EMAIL);

        ArgumentCaptor<QuestionBank> captor = ArgumentCaptor.forClass(QuestionBank.class);
        verify(questionBankRepository).save(captor.capture());
        assertThat(captor.getValue().getSchedulingData()).isEqualTo(data);
        assertThat(captor.getValue().getQuestionType()).isEqualTo(QuestionBank.QuestionType.SCHEDULING);
    }

    @Test
    @DisplayName("SCHEDULING: RR + 유효한 timeQuantum이면 정상 저장")
    void schedulingData_validRR_savesSuccessfully() {
        SchedulingData data = new SchedulingData(
                SchedulingData.SchedulingAlgorithm.RR, 4,
                List.of(new SchedulingData.ProcessRow("P1", 0, 5, null)));
        QuestionBankRequest req = requestOf(QuestionBank.QuestionType.SCHEDULING, data);

        service.createQuestion(req, ADMIN_EMAIL);

        verify(questionBankRepository).save(any(QuestionBank.class));
    }

    // ── 회귀 확인: SCHEDULING이 아닌 유형은 schedulingData 검증을 타지 않음 ──────

    @Test
    @DisplayName("SHORT_ANSWER: schedulingData가 없어도 예외 없이 정상 저장 (회귀 확인)")
    void nonScheduling_withoutSchedulingData_savesSuccessfully() {
        QuestionBankRequest req = requestOf(QuestionBank.QuestionType.SHORT_ANSWER, null);

        service.createQuestion(req, ADMIN_EMAIL);

        verify(questionBankRepository).save(any(QuestionBank.class));
    }
}
