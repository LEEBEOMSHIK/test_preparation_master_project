package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.Exam;
import com.tpmp.testprep.entity.Question;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * exams/questions 소프트 삭제(del_yn)·비활성화(use_yn) 토글 회귀 테스트.
 * removeQuestion이 하드 delete 대신 softDelete()를 호출하는지, toggle 메서드가 정확히 동작하는지 검증한다.
 */
@ExtendWith(MockitoExtension.class)
class ExamServiceAuditFlagsTest {

    @Mock private ExamRepository examRepository;
    @Mock private QuestionRepository questionRepository;
    @Mock private QuestionBankRepository questionBankRepository;
    @Mock private UserRepository userRepository;
    @Mock private DomainSlaveRepository domainSlaveRepository;
    @Mock private Exam exam;
    @Mock private Question question;

    private ExamService service;

    @BeforeEach
    void setUp() {
        service = new ExamService(
                examRepository, questionRepository, questionBankRepository,
                userRepository, domainSlaveRepository);
    }

    @Test
    void removeQuestionSoftDeletesInsteadOfHardDelete() {
        when(questionRepository.findById(10L)).thenReturn(Optional.of(question));
        when(question.getExam()).thenReturn(exam);
        when(exam.getId()).thenReturn(1L);

        service.removeQuestion(1L, 10L);

        verify(question).softDelete();
        verify(questionRepository, never()).delete(question);
    }

    @Test
    void removeQuestionRejectsQuestionFromAnotherExam() {
        when(questionRepository.findById(10L)).thenReturn(Optional.of(question));
        when(question.getExam()).thenReturn(exam);
        when(exam.getId()).thenReturn(2L);

        assertThatThrownBy(() -> service.removeQuestion(1L, 10L))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> assertThat(((BusinessException) error).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_INPUT));
        verify(question, never()).softDelete();
    }

    @Test
    void toggleUseYnTogglesExamAndReturnsSummary() {
        when(examRepository.findByIdAndDelYn(1L, "N")).thenReturn(Optional.of(exam));
        when(questionRepository.countByExamId(1L)).thenReturn(3);
        when(exam.getQuestionMode()).thenReturn(Exam.QuestionMode.SEQUENTIAL);

        service.toggleUseYn(1L);

        verify(exam).toggleUseYn();
    }

    @Test
    void toggleQuestionUseYnTogglesQuestionAfterOwnershipCheck() {
        when(questionRepository.findById(10L)).thenReturn(Optional.of(question));
        when(question.getExam()).thenReturn(exam);
        when(exam.getId()).thenReturn(1L);
        when(question.getQuestionType()).thenReturn(Question.QuestionType.SHORT_ANSWER);

        service.toggleQuestionUseYn(1L, 10L);

        verify(question).toggleUseYn();
    }

    @Test
    void toggleQuestionUseYnRejectsQuestionFromAnotherExam() {
        when(questionRepository.findById(10L)).thenReturn(Optional.of(question));
        when(question.getExam()).thenReturn(exam);
        when(exam.getId()).thenReturn(2L);

        assertThatThrownBy(() -> service.toggleQuestionUseYn(1L, 10L))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> assertThat(((BusinessException) error).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_INPUT));
        verify(question, never()).toggleUseYn();
    }
}
