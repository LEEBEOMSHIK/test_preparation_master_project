package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.QuestionRequest;
import com.tpmp.testprep.entity.Exam;
import com.tpmp.testprep.entity.Question;
import com.tpmp.testprep.entity.support.SchedulingData;
import com.tpmp.testprep.entity.support.SqlData;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.DomainSlaveRepository;
import com.tpmp.testprep.repository.ExamRepository;
import com.tpmp.testprep.repository.QuestionBankRepository;
import com.tpmp.testprep.repository.QuestionRepository;
import com.tpmp.testprep.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExamServiceStructuredQuestionTest {

    @Mock private ExamRepository examRepository;
    @Mock private QuestionRepository questionRepository;
    @Mock private QuestionBankRepository questionBankRepository;
    @Mock private UserRepository userRepository;
    @Mock private DomainSlaveRepository domainSlaveRepository;
    @Mock private Exam exam;

    private ExamService service;

    @BeforeEach
    void setUp() {
        service = new ExamService(
                examRepository, questionRepository, questionBankRepository,
                userRepository, domainSlaveRepository);
        when(examRepository.findByIdAndDelYn(1L, "N")).thenReturn(Optional.of(exam));
        when(questionRepository.maxSeqByExamId(1L)).thenReturn(0);
    }

    @Test
    void manualSchedulingRequiresStructureAndRrQuantum() {
        assertInvalid(request(Question.QuestionType.SCHEDULING, null, null),
                ErrorCode.SCHEDULING_DATA_INVALID);

        SchedulingData rrWithoutQuantum = new SchedulingData(
                SchedulingData.SchedulingAlgorithm.RR, null,
                List.of(new SchedulingData.ProcessRow("P1", 0, 3, null)));
        assertInvalid(request(Question.QuestionType.SCHEDULING, rrWithoutQuantum, null),
                ErrorCode.SCHEDULING_DATA_INVALID);
    }

    @Test
    void manualPrioritySchedulingRequiresEveryPriority() {
        SchedulingData missingPriority = new SchedulingData(
                SchedulingData.SchedulingAlgorithm.PRIORITY_PREEMPTIVE, null,
                List.of(new SchedulingData.ProcessRow("P1", 0, 3, null)));

        assertInvalid(request(Question.QuestionType.SCHEDULING, missingPriority, null),
                ErrorCode.SCHEDULING_DATA_INVALID);
    }

    @Test
    void manualSqlRejectsTableRowColumnMismatch() {
        SqlData invalid = new SqlData(List.of(new SqlData.SqlTable(
                "member",
                List.of(new SqlData.SqlColumn("id", "INT", true)),
                List.of(List.of("1", "extra")))));

        assertInvalid(request(Question.QuestionType.SQL, null, invalid), ErrorCode.SQL_DATA_INVALID);
    }

    @Test
    void manualSqlRejectsExpectedResultMismatch() {
        SqlData invalid = new SqlData(
                List.of(new SqlData.SqlTable(
                        "member",
                        List.of(new SqlData.SqlColumn("id", "INT", true)),
                        List.of(List.of("1")))),
                new SqlData.SqlExpectedResult(
                        List.of("id", "name"), List.of(List.of("1")), false));

        assertInvalid(request(Question.QuestionType.SQL, null, invalid), ErrorCode.SQL_DATA_INVALID);
    }

    @Test
    void manualSqlWithConsistentStructureIsSaved() {
        SqlData valid = new SqlData(
                List.of(new SqlData.SqlTable(
                        "member",
                        List.of(new SqlData.SqlColumn("id", "INT", true)),
                        List.of(List.of("1")))),
                new SqlData.SqlExpectedResult(List.of("id"), List.of(List.of("1")), true));

        service.addQuestion(1L, request(Question.QuestionType.SQL, null, valid));

        verify(questionRepository).save(any(Question.class));
    }

    private void assertInvalid(QuestionRequest request, ErrorCode expected) {
        assertThatThrownBy(() -> service.addQuestion(1L, request))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> assertThat(((BusinessException) error).getErrorCode())
                        .isEqualTo(expected));
        verify(questionRepository, never()).save(any(Question.class));
    }

    private QuestionRequest request(
            Question.QuestionType type,
            SchedulingData schedulingData,
            SqlData sqlData
    ) {
        return new QuestionRequest(
                "문항 내용", null, type, null, "정답", null,
                null, null, null, null, schedulingData, sqlData, false);
    }
}
